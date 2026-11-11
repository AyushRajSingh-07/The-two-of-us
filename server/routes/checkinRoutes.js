import { Router } from 'express';
import { db, getKolkataDateString, getNowISO } from '../db.js';
import { verifyToken } from '../auth.js';
import { broadcast } from '../websocket.js';
import { formatCoupleSpace } from './authRoutes.js';

export const checkinRouter = Router();

// Helper to get or create today's check-in record
function getOrCreateRecord(date) {
  let record = db.prepare('SELECT * FROM daily_checkins WHERE date = ?').get(date);
  if (!record) {
    db.prepare(`
      INSERT INTO daily_checkins (
        date, partner1_checked_in, partner1_checked_in_at,
        partner2_checked_in, partner2_checked_in_at,
        both_completed, counted_towards_love_days
      ) VALUES (?, 0, NULL, 0, NULL, 0, 0)
    `).run(date);
    record = db.prepare('SELECT * FROM daily_checkins WHERE date = ?').get(date);
  }
  return record;
}

// Helper to assemble full counter state
function buildCounterState() {
  const todayDate = getKolkataDateString();
  const todayRow = getOrCreateRecord(todayDate);

  const couple = db.prepare('SELECT love_day_base_count FROM couple_space WHERE id = ?').get('couple-space-default');
  const sharedCount = couple ? couple.love_day_base_count : 612;

  // Fetch all history records
  const allRows = db.prepare('SELECT * FROM daily_checkins ORDER BY date DESC').all();
  const history = {};
  for (const r of allRows) {
    history[r.date] = {
      date: r.date,
      partner1CheckedIn: Boolean(r.partner1_checked_in),
      partner1CheckedInAt: r.partner1_checked_in_at,
      partner2CheckedIn: Boolean(r.partner2_checked_in),
      partner2CheckedInAt: r.partner2_checked_in_at,
      bothCompleted: Boolean(r.both_completed),
    };
  }

  return {
    sharedCount,
    todayDate,
    todayRecord: {
      date: todayRow.date,
      partner1CheckedIn: Boolean(todayRow.partner1_checked_in),
      partner1CheckedInAt: todayRow.partner1_checked_in_at,
      partner2CheckedIn: Boolean(todayRow.partner2_checked_in),
      partner2CheckedInAt: todayRow.partner2_checked_in_at,
      bothCompleted: Boolean(todayRow.both_completed),
    },
    history,
  };
}

// Helper to extract user identity if token present
function getOptionalUser(req) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }
  return token ? verifyToken(token) : null;
}

// GET /api/checkin -> returns current daily counter state from SQLite
// Public endpoint so every phone & PC immediately displays canonical truth
checkinRouter.get('/', (req, res) => {
  res.json(buildCounterState());
});

// POST /api/checkin -> records check-in for Ayush or Vrishti
checkinRouter.post('/', (req, res) => {
  const todayDate = getKolkataDateString();
  const now = getNowISO();

  const user = getOptionalUser(req);
  const body = req.body || {};

  // Determine whether this check-in is for Partner 1 (Ayush) or Partner 2 (Vrishti)
  let isP1 = true;
  if (user) {
    isP1 = user.id === 'partner-1' || user.username === 'ayush';
  } else if (body.partnerIndex !== undefined) {
    isP1 = Number(body.partnerIndex) === 1;
  } else if (body.isPartner1 !== undefined) {
    isP1 = Boolean(body.isPartner1);
  } else if (body.username) {
    isP1 = String(body.username).toLowerCase().includes('ayush');
  }

  // Perform atomic update inside a transaction to prevent race conditions
  db.exec('BEGIN TRANSACTION;');
  try {
    const record = getOrCreateRecord(todayDate);

    let p1Checked = Boolean(record.partner1_checked_in);
    let p1Time = record.partner1_checked_in_at;
    let p2Checked = Boolean(record.partner2_checked_in);
    let p2Time = record.partner2_checked_in_at;

    if (isP1) {
      if (!p1Checked) {
        p1Checked = true;
        p1Time = now;
      }
    } else {
      if (!p2Checked) {
        p2Checked = true;
        p2Time = now;
      }
    }

    const bothCompleted = p1Checked && p2Checked;
    let countedTowards = Boolean(record.counted_towards_love_days);
    let incremented = false;

    // Increment shared Love Days ONLY ONCE when both complete for the day
    if (bothCompleted && !countedTowards) {
      countedTowards = true;
      incremented = true;
      db.prepare(`
        UPDATE couple_space
        SET love_day_base_count = love_day_base_count + 1, updated_at = ?
        WHERE id = 'couple-space-default'
      `).run(now);
      console.log(`[CHECKIN] Both partners completed on ${todayDate}! Love Day counter incremented +1.`);
    }

    db.prepare(`
      UPDATE daily_checkins
      SET partner1_checked_in = ?, partner1_checked_in_at = ?,
          partner2_checked_in = ?, partner2_checked_in_at = ?,
          both_completed = ?, counted_towards_love_days = ?
      WHERE date = ?
    `).run(
      p1Checked ? 1 : 0, p1Time,
      p2Checked ? 1 : 0, p2Time,
      bothCompleted ? 1 : 0, countedTowards ? 1 : 0,
      todayDate
    );

    db.exec('COMMIT;');

    const state = buildCounterState();

    // Broadcast check-in update to both devices in real time over WebSocket
    broadcast('DAILY_CHECKIN_UPDATED', state);

    if (incremented) {
      const updatedCouple = db.prepare('SELECT * FROM couple_space WHERE id = ?').get('couple-space-default');
      broadcast('COUPLE_UPDATED', formatCoupleSpace(updatedCouple));
    }

    res.json(state);
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('[CHECKIN ERROR]', err);
    res.status(500).json({ error: 'Failed to record check-in.' });
  }
});
