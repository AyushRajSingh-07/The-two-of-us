import WebSocket from 'ws';

const NGROK_BASE = 'https://carrousel-skid-carrousel.ngrok-free.dev';
const NGROK_WS = 'wss://carrousel-skid-carrousel.ngrok-free.dev/api/ws?ngrok-skip-browser-warning=1';
const HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': '1'
};

async function test() {
  console.log('=== STEP 1: Check Backend Health over Public ngrok ===');
  const healthRes = await fetch(`${NGROK_BASE}/api/health`, { headers: HEADERS });
  const health = await healthRes.json();
  console.log('Health Response:', JSON.stringify(health));
  if (health.status !== 'online') throw new Error('Health check failed');
  console.log('✓ Public health check verified!\n');

  console.log('=== STEP 2: Connect Phone and PC WebSockets ===');
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

  console.log('\n=== STEP 3: Test Application-Level Heartbeat (PING -> PONG) ===');
  const pongPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Heartbeat PONG timeout')), 5000);
    phoneWs.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'PONG') {
          clearTimeout(timeout);
          console.log('✓ Received PONG from server:', JSON.stringify(data));
          resolve();
        }
      } catch {}
    });
  });
  phoneWs.send(JSON.stringify({ type: 'PING' }));
  await pongPromise;

  console.log('\n=== STEP 4: Send Chat Message Phone -> PC with Idempotency Key ===');
  const clientMsgId = 'test-cmsg-' + Date.now();
  const textContent = 'Testing stable delivery with retry safety: ' + new Date().toLocaleTimeString();

  const pcMessagePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('PC did not receive message via WS')), 8000);
    pcWs.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'CHAT_UPDATED' && Array.isArray(data.payload)) {
          const match = data.payload.find(m => m.clientMessageId === clientMsgId || m.text === textContent);
          if (match) {
            clearTimeout(timeout);
            console.log('✓ PC received message in real time via WebSocket:', match.text);
            resolve(match);
          }
        }
      } catch {}
    });
  });

  const sendRes = await fetch(`${NGROK_BASE}/api/chat/messages`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      clientMessageId: clientMsgId,
      text: textContent,
      sender: 'Ayush',
      sender_id: 'ayush'
    })
  });

  if (!sendRes.ok) throw new Error('Send failed: ' + await sendRes.text());
  const savedMsg = await sendRes.json();
  console.log('✓ Server confirmed message save with HTTP 201:', savedMsg.status, 'ID:', savedMsg.id);

  await pcMessagePromise;

  console.log('\n=== STEP 5: Test Idempotent Retry (Zero Duplicate Messages) ===');
  const initialHistoryRes = await fetch(`${NGROK_BASE}/api/chat/messages`, { headers: HEADERS });
  const initialHistory = await initialHistoryRes.json();
  const initialCount = initialHistory.length;

  console.log(`History count before retry simulation: ${initialCount}`);

  // Simulate network retry by submitting exact same clientMsgId
  const retryRes = await fetch(`${NGROK_BASE}/api/chat/messages`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      clientMessageId: clientMsgId,
      text: textContent,
      sender: 'Ayush',
      sender_id: 'ayush'
    })
  });

  if (!retryRes.ok) throw new Error('Retry request failed');
  console.log(`✓ Retry response status: HTTP ${retryRes.status} (Expected 200 OK without duplication)`);
  const retryResult = await retryRes.json();
  if (retryResult.id !== savedMsg.id) throw new Error('Retry did not match original message ID');

  const afterHistoryRes = await fetch(`${NGROK_BASE}/api/chat/messages`, { headers: HEADERS });
  const afterHistory = await afterHistoryRes.json();
  const afterCount = afterHistory.length;

  console.log(`History count after retry simulation: ${afterCount}`);
  if (afterCount !== initialCount) {
    throw new Error('DUPLICATE MESSAGE CREATED! Idempotency failed.');
  }
  console.log('✓ Idempotency verified: Safe retry creates ZERO duplicate messages!\n');

  console.log('=== STEP 6: Send Reply PC -> Phone ===');
  const replyClientMsgId = 'test-cmsg-reply-' + Date.now();
  const replyContent = 'Confirmed received on PC! Connection rock solid: ' + new Date().toLocaleTimeString();

  const phoneReplyPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Phone did not receive reply via WS')), 8000);
    phoneWs.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'CHAT_UPDATED' && Array.isArray(data.payload)) {
          const match = data.payload.find(m => m.clientMessageId === replyClientMsgId || m.text === replyContent);
          if (match) {
            clearTimeout(timeout);
            console.log('✓ Phone received reply in real time via WebSocket:', match.text);
            resolve(match);
          }
        }
      } catch {}
    });
  });

  const sendReplyRes = await fetch(`${NGROK_BASE}/api/chat/messages`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      clientMessageId: replyClientMsgId,
      text: replyContent,
      sender: 'Vrishti',
      sender_id: 'vrishti'
    })
  });

  if (!sendReplyRes.ok) throw new Error('Send reply failed');
  const savedReply = await sendReplyRes.json();
  console.log('✓ Reply saved to database:', savedReply.status);

  await phoneReplyPromise;

  phoneWs.close();
  pcWs.close();

  console.log('\n======================================================');
  console.log('🎉 ALL TESTS PASSED: CONNECTION & CHAT STABLE! 🎉');
  console.log('======================================================');
}

test().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
