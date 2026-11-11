import WebSocket from 'ws';

const NGROK_BASE = 'https://carrousel-skid-carrousel.ngrok-free.dev';
const NGROK_WS = 'wss://carrousel-skid-carrousel.ngrok-free.dev/api/ws?ngrok-skip-browser-warning=1';
const HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': '1'
};

async function run() {
  console.log('=== TEST 1: Connect Phone & PC WebSockets ===');
  const phoneWs = new WebSocket(NGROK_WS);
  const pcWs = new WebSocket(NGROK_WS);

  await Promise.all([
    new Promise((resolve, reject) => {
      phoneWs.on('open', () => {
        console.log('✓ Phone WebSocket connected');
        resolve();
      });
      phoneWs.on('error', reject);
    }),
    new Promise((resolve, reject) => {
      pcWs.on('open', () => {
        console.log('✓ PC WebSocket connected');
        resolve();
      });
      pcWs.on('error', reject);
    })
  ]);

  console.log('\n=== TEST 2: Co-op Game Real-Time Move Sync (Together Maze) ===');
  const mazeSessionId = 'couple-space-default_together_maze';
  const phoneMazeState = {
    p1Pos: [2, 1],
    p2Pos: [1, 6],
    doorAOpen: true,
    doorBOpen: false,
    isWon: false,
  };

  const pcReceivedMazePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('PC did not receive Together Maze move')), 8000);
    pcWs.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'GAME_UPDATED' && (data.payload?.sessionId === mazeSessionId || data.payload?.gameId === 'together_maze')) {
          clearTimeout(timeout);
          console.log('✓ PC received Together Maze state in real time via WS:', JSON.stringify(data.payload.data));
          resolve(data.payload);
        }
      } catch {}
    });
  });

  const sendMazeRes = await fetch(`${NGROK_BASE}/api/games/session/${encodeURIComponent(mazeSessionId)}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      sessionId: mazeSessionId,
      gameId: 'together_maze',
      state: phoneMazeState,
      updatedBy: 'partner-1'
    })
  });

  if (!sendMazeRes.ok) throw new Error('Failed to update game session: ' + await sendMazeRes.text());
  console.log('✓ Phone saved Together Maze move to backend SQLite database');

  await pcReceivedMazePromise;

  // Confirm PC can load saved state on joining/reconnecting
  const getMazeRes = await fetch(`${NGROK_BASE}/api/games/session/${encodeURIComponent(mazeSessionId)}`, { headers: HEADERS });
  const getMazeData = await getMazeRes.json();
  if (!getMazeData.data || getMazeData.data.p1Pos[0] !== 2) {
    throw new Error('GET session did not return persisted state: ' + JSON.stringify(getMazeData));
  }
  console.log('✓ Verified PC can fetch persisted game state upon joining/reconnecting!');

  // Now test PC making a move back to Phone
  const pcMazeState = {
    p1Pos: [2, 1],
    p2Pos: [2, 6],
    doorAOpen: true,
    doorBOpen: true,
    isWon: false,
  };

  const phoneReceivedMazePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Phone did not receive PC maze move')), 8000);
    phoneWs.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'GAME_UPDATED' && (data.payload?.sessionId === mazeSessionId || data.payload?.gameId === 'together_maze')) {
          clearTimeout(timeout);
          console.log('✓ Phone received PC Together Maze move in real time via WS:', JSON.stringify(data.payload.data));
          resolve(data.payload);
        }
      } catch {}
    });
  });

  await fetch(`${NGROK_BASE}/api/games/session/${encodeURIComponent(mazeSessionId)}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      sessionId: mazeSessionId,
      gameId: 'together_maze',
      state: pcMazeState,
      updatedBy: 'partner-2'
    })
  });

  await phoneReceivedMazePromise;

  console.log('\n=== TEST 3: Co-op Game Real-Time Sync (Draw and Guess) ===');
  const drawSessionId = 'couple-space-default_draw_guess';
  const drawState = {
    drawerUserId: 'partner-1',
    secretWord: 'Sunset',
    lines: [
      { points: [{ x: 10, y: 10 }, { x: 50, y: 50 }], color: '#e11d48', size: 4 }
    ],
    isGuessed: false
  };

  const pcReceivedDrawPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('PC did not receive Draw and Guess strokes')), 8000);
    pcWs.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'GAME_UPDATED' && (data.payload?.sessionId === drawSessionId || data.payload?.gameId === 'draw_guess')) {
          clearTimeout(timeout);
          console.log('✓ PC received Draw and Guess strokes in real time via WS');
          resolve(data.payload);
        }
      } catch {}
    });
  });

  await fetch(`${NGROK_BASE}/api/games/session/${encodeURIComponent(drawSessionId)}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      sessionId: drawSessionId,
      gameId: 'draw_guess',
      state: drawState,
      updatedBy: 'partner-1'
    })
  });

  await pcReceivedDrawPromise;

  console.log('\n=== TEST 4: Profile Picture Update & Live Chat Icon Reflection ===');
  const newAyushAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
  const newVrishtiAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150';

  const pcReceivedProfilePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('PC did not receive COUPLE_UPDATED')), 8000);
    pcWs.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'COUPLE_UPDATED' && data.payload?.partner1Avatar === newAyushAvatar) {
          clearTimeout(timeout);
          console.log('✓ PC received COUPLE_UPDATED event with new Ayush avatar via WS');
          resolve(data.payload);
        }
      } catch {}
    });
  });

  const updateCoupleRes = await fetch(`${NGROK_BASE}/api/couple`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify({
      partner1Avatar: newAyushAvatar,
      partner2Avatar: newVrishtiAvatar,
      partner1Name: 'Ayush',
      partner2Name: 'Vrishti',
    })
  });

  if (!updateCoupleRes.ok) throw new Error('Update couple failed: ' + await updateCoupleRes.text());
  console.log('✓ Updated profile pictures saved to SQLite database');

  await pcReceivedProfilePromise;

  // Verify chat messages now return the new avatar for all messages
  const chatMessagesRes = await fetch(`${NGROK_BASE}/api/chat/messages`, { headers: HEADERS });
  const messages = await chatMessagesRes.json();
  const ayushMsgs = messages.filter(m => m.senderId === 'partner-1' || m.senderName === 'Ayush');
  const vrishtiMsgs = messages.filter(m => m.senderId === 'partner-2' || m.senderName === 'Vrishti');

  console.log(`Retrieved ${messages.length} messages. Checking avatar updates...`);
  const allAyushUpdated = ayushMsgs.every(m => m.senderAvatar === newAyushAvatar);
  const allVrishtiUpdated = vrishtiMsgs.every(m => m.senderAvatar === newVrishtiAvatar);

  if (!allAyushUpdated || !allVrishtiUpdated) {
    throw new Error(`Chat messages do not reflect new avatars! Ayush: ${allAyushUpdated}, Vrishti: ${allVrishtiUpdated}`);
  }
  console.log('✓ ALL chat messages in conversation history now carry the updated live profile pictures!');

  phoneWs.close();
  pcWs.close();

  console.log('\n======================================================');
  console.log('🎉 ALL CO-OP GAMES & PROFILE PICTURE TESTS PASSED! 🎉');
  console.log('======================================================');
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
