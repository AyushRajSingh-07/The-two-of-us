import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db, getNowISO } from '../db.js';
import { requireAuth } from '../auth.js';
import { broadcast } from '../websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `photo-${Date.now()}-${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only valid image files are allowed.'));
    }
  },
});

export const photoRouter = Router();

function formatPhoto(row, req) {
  if (!row) return null;
  // If the file_name is a remote URL or external demo URL, keep it
  let fileUrl = row.file_name;
  if (!fileUrl.startsWith('http')) {
    // Generate private authenticated endpoint URL
    const protocol = req.protocol;
    const host = req.get('host');
    fileUrl = `${protocol}://${host}/api/photos/file/${row.id}`;
  }

  return {
    id: row.id,
    spaceId: 'couple-space-default',
    uploaderId: row.uploader_id,
    uploaderName: row.uploader_name,
    url: fileUrl,
    caption: row.caption || '',
    album: row.album || 'Date Nights',
    dateTaken: row.date_taken || '',
    isFavorite: Boolean(row.is_favorite),
    createdAt: row.created_at,
  };
}

function getAllPhotos(req) {
  const rows = db.prepare('SELECT * FROM photos ORDER BY date_taken DESC, created_at DESC').all();
  return rows.map((r) => formatPhoto(r, req));
}

// GET /api/photos -> List all couple photos
photoRouter.get('/', requireAuth, (req, res) => {
  res.json(getAllPhotos(req));
});

// POST /api/photos/upload -> Upload new photo
photoRouter.post('/upload', requireAuth, upload.single('photo'), (req, res) => {
  try {
    let fileName = '';
    let filePath = '';
    let mimeType = 'image/jpeg';
    let fileSize = 0;

    if (req.file) {
      fileName = req.file.filename;
      filePath = req.file.path;
      mimeType = req.file.mimetype;
      fileSize = req.file.size;
    } else if (req.body.url) {
      // Allow saving external or base64 URL
      fileName = req.body.url;
      filePath = '';
    } else {
      return res.status(400).json({ error: 'No photo file or URL provided.' });
    }

    const { caption, album, dateTaken } = req.body;
    const photoId = 'photo-' + randomUUID();
    const now = getNowISO();

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    db.prepare(`
      INSERT INTO photos (
        id, uploader_id, uploader_name, file_name, file_path,
        caption, album, date_taken, is_favorite, mime_type, file_size, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `).run(
      photoId,
      req.user.id,
      user?.display_name || req.user.displayName,
      fileName,
      filePath,
      caption || 'A sweet moment together',
      album || 'Date Nights',
      dateTaken || now.split('T')[0],
      mimeType,
      fileSize,
      now
    );

    const allPhotos = getAllPhotos(req);
    broadcast('PHOTOS_UPDATED', allPhotos);

    const created = db.prepare('SELECT * FROM photos WHERE id = ?').get(photoId);
    res.status(201).json(formatPhoto(created, req));
  } catch (err) {
    console.error('[PHOTO UPLOAD ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to upload photo.' });
  }
});

// GET /api/photos/file/:id -> Stream private photo securely
photoRouter.get('/file/:id', requireAuth, (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found.' });
  }

  // If stored on disk
  if (photo.file_path && fs.existsSync(photo.file_path)) {
    res.setHeader('Content-Type', photo.mime_type || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=86400');
    return fs.createReadStream(photo.file_path).pipe(res);
  }

  // Fallback if file_name is a relative filename inside uploads
  const diskPath = path.join(UPLOADS_DIR, photo.file_name);
  if (fs.existsSync(diskPath)) {
    res.setHeader('Content-Type', photo.mime_type || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=86400');
    return fs.createReadStream(diskPath).pipe(res);
  }

  // If remote URL, redirect
  if (photo.file_name && photo.file_name.startsWith('http')) {
    return res.redirect(photo.file_name);
  }

  res.status(404).json({ error: 'Photo file not found on disk.' });
});

// DELETE /api/photos/:id
photoRouter.delete('/:id', requireAuth, (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found.' });
  }

  // Delete from disk if exists
  try {
    if (photo.file_path && fs.existsSync(photo.file_path)) {
      fs.unlinkSync(photo.file_path);
    } else if (photo.file_name) {
      const p = path.join(UPLOADS_DIR, photo.file_name);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  } catch (e) {
    console.warn('[PHOTO DELETE] File remove warning:', e.message);
  }

  db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);

  const allPhotos = getAllPhotos(req);
  broadcast('PHOTOS_UPDATED', allPhotos);

  res.json({ success: true });
});

// POST /api/photos/:id/favorite -> Toggle favorite
photoRouter.post('/:id/favorite', requireAuth, (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (!photo) return res.status(404).json({ error: 'Photo not found.' });

  const nextFav = photo.is_favorite ? 0 : 1;
  db.prepare('UPDATE photos SET is_favorite = ? WHERE id = ?').run(nextFav, req.params.id);

  const allPhotos = getAllPhotos(req);
  broadcast('PHOTOS_UPDATED', allPhotos);

  res.json({ success: true, isFavorite: Boolean(nextFav) });
});
