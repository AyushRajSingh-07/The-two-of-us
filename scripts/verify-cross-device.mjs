import WebSocket from 'ws';

const NGROK_BASE = 'https://carrousel-skid-carrousel.ngrok-free.dev';
const NGROK_WS = 'wss://carrousel-skid-carrousel.ngrok-free.dev/api/ws?ngrok-skip-browser-warning=1';
const HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': '1'
};

async function run() {
  console.log('--- 1. Testing Check-in State (Canonical SQLite) ---');
  const checkinRes = await fetch(`${NGROK_BASE}/api/checkin`, { headers: HEADERS });
  const checkinData = await checkinRes.json();
  console.log('Check-in status:', JSON.stringify(checkinData.todayRecord));
  console.log('Love Day count:', checkinData.sharedCount);
  if (!checkinData.todayRecord.partner1CheckedIn || !checkinData.todayRecord.partner2CheckedIn) {
    throw new Error('Expected both partners to be checked in today!');
  }
  console.log('✓ Check-in correctly reports both partners checked in across devices without auth barrier!');

  console.log('\n--- 2. Connecting Two Devices over Ngrok WebSocket ---');
  const devicePhone = new WebSocket(NGROK_WS);
  const devicePC = new WebSocket(NGROK_WS);

  await Promise.all([
    new Promise((resolve, reject) => {
      devicePhone.on('open', () => {
        console.log('✓ Device 1 (Phone) WebSocket connected to ngrok');
        resolve();
      });
      devicePhone.on('error', reject);
    }),
    new Promise((resolve, reject) => {
      devicePC.on('open', () => {
        console.log('✓ Device 2 (PC) WebSocket connected to ngrok');
        resolve();
      });
      devicePC.on('error', reject);
    })
  ]);

  console.log('\n--- 3. Testing Realtime Chat: Phone (Ayush) -> PC (Vrishti) ---');
  const testMsgId = 'test_' + Date.now();
  const phoneMsgContent = 'Hey Vrishti, testing realtime sync from Phone! ' + new Date().toLocaleTimeString();

  const pcReceivedPhonePromise = new Promise((resolve) => {
    devicePC.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'CHAT_UPDATED' && data.payload) {
          const match = Array.isArray(data.payload) 
            ? data.payload.find(m => m.text === phoneMsgContent)
            : (data.payload.text === phoneMsgContent ? data.payload : null);
          if (match) {
            console.log('✓ Device 2 (PC) received message in realtime:', match.text);
            resolve(match);
          }
        }
      } catch (err) {}
    });
  });

  const sendPhoneRes = await fetch(`${NGROK_BASE}/api/chat/messages`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      text: phoneMsgContent,
      sender: 'Ayush',
      sender_id: 'ayush'
    })
  });

  if (!sendPhoneRes.ok) {
    throw new Error('Failed to send message: ' + await sendPhoneRes.text());
  }
  const savedPhoneMsg = await sendPhoneRes.json();
  console.log('✓ Phone message saved to SQLite and acknowledged as sent:', savedPhoneMsg.status, '(ID:', savedPhoneMsg.id, ')');

  await pcReceivedPhonePromise;

  console.log('\n--- 4. Testing Realtime Chat: PC (Vrishti) -> Phone (Ayush) ---');
  const pcMsgContent = 'Received loud and clear, Ayush! Sync working perfectly! ' + new Date().toLocaleTimeString();

  const phoneReceivedPcPromise = new Promise((resolve) => {
    devicePhone.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'CHAT_UPDATED' && data.payload) {
          const match = Array.isArray(data.payload) 
            ? data.payload.find(m => m.text === pcMsgContent)
            : (data.payload.text === pcMsgContent ? data.payload : null);
          if (match) {
            console.log('✓ Device 1 (Phone) received message in realtime:', match.text);
            resolve(match);
          }
        }
      } catch (err) {}
    });
  });

  const sendPcRes = await fetch(`${NGROK_BASE}/api/chat/messages`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      text: pcMsgContent,
      sender: 'Vrishti',
      sender_id: 'vrishti'
    })
  });

  if (!sendPcRes.ok) {
    throw new Error('Failed to send reply from PC: ' + await sendPcRes.text());
  }
  const savedPcMsg = await sendPcRes.json();
  console.log('✓ PC message saved to SQLite and acknowledged as sent:', savedPcMsg.status, '(ID:', savedPcMsg.id, ')');

  await phoneReceivedPcPromise;

  console.log('\n--- 5. Testing Persistence and History Refresh ---');
  const historyRes = await fetch(`${NGROK_BASE}/api/chat/messages`, { headers: HEADERS });
  const history = await historyRes.json();
  console.log(`✓ SQLite history retrieved ${history.length} total messages.`);
  const hasPhoneMsg = history.some(m => m.text === phoneMsgContent);
  const hasPcMsg = history.some(m => m.text === pcMsgContent);
  if (!hasPhoneMsg || !hasPcMsg) {
    throw new Error('History does not contain newly sent messages!');
  }
  console.log('✓ Both messages persisted canonically in SQLite database and survived refresh!');

  devicePhone.close();
  devicePC.close();

  console.log('\n=========================================');
  console.log('🎉 ALL CROSS-DEVICE SYNC TESTS PASSED! 🎉');
  console.log('=========================================');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
