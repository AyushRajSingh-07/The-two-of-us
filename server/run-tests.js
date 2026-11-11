import http from 'node:http';
import { app, server } from './index.js';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Accept': 'application/json',
      'ngrok-skip-browser-warning': '1',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    let bodyData = null;
    if (body) {
      headers['Content-Type'] = 'application/json';
      bodyData = JSON.stringify(body);
      headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = http.request({
      hostname: '127.0.0.1',
      port: 3001,
      path,
      method,
      headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function runTests() {
  // Wait a short tick for server to be listening
  await new Promise(r => setTimeout(r, 600));

  console.log('--- Starting Sanctuary Backend Verification Suite ---');

  // 1. Health check
  const health = await request('GET', '/api/health');
  console.log('1. Health check:', health.status === 200 && health.data.status === 'online' ? 'PASS' : 'FAIL', health.data);

  // 2. Login as Ayush
  const loginAyush = await request('POST', '/api/auth/login', { username: 'ayush', password: 'ayush123' });
  console.log('2. Ayush login:', loginAyush.status === 200 && loginAyush.data.token ? 'PASS' : 'FAIL', 'User:', loginAyush.data.user?.name);
  const tokenAyush = loginAyush.data.token;

  // 3. Login as Vrishti
  const loginVrishti = await request('POST', '/api/auth/login', { username: 'vrishti', password: 'vrishti123' });
  console.log('3. Vrishti login:', loginVrishti.status === 200 && loginVrishti.data.token ? 'PASS' : 'FAIL', 'User:', loginVrishti.data.user?.name);
  const tokenVrishti = loginVrishti.data.token;

  // 4. Test unauthorized account login
  const badLogin = await request('POST', '/api/auth/login', { username: 'stranger', password: 'password' });
  console.log('4. Reject unauthorized user:', badLogin.status === 401 ? 'PASS' : 'FAIL');

  // 5. Ayush sends chat message
  const sendMsg = await request('POST', '/api/chat/messages', {
    text: 'Hey Vrishti, testing backend sync from Ayush! ❤️',
  }, tokenAyush);
  console.log('5. Ayush sends message:', sendMsg.status === 201 && sendMsg.data.id ? 'PASS' : 'FAIL');
  const msgId = sendMsg.data.id;

  // 6. Vrishti retrieves chat messages
  const getMsgs = await request('GET', '/api/chat/messages', null, tokenVrishti);
  const found = getMsgs.data.some(m => m.id === msgId && m.sender_name === 'Ayush');
  console.log('6. Vrishti sees Ayush’s message:', found ? 'PASS' : 'FAIL');

  // 7. Vrishti reacts to Ayush's message
  const react = await request('POST', `/api/chat/messages/${msgId}/react`, { emoji: '❤️' }, tokenVrishti);
  console.log('7. Vrishti reacts to message:', react.status === 200 && react.data.reactions['❤️']?.includes('partner-2') ? 'PASS' : 'FAIL');

  // 8. Vrishti marks messages read
  const markRead = await request('POST', '/api/chat/read', null, tokenVrishti);
  console.log('8. Vrishti marks read:', markRead.status === 200 ? 'PASS' : 'FAIL');

  // 9. Initial Love Day counter status
  const checkinStatus1 = await request('GET', '/api/checkin', null, tokenAyush);
  console.log('9. Initial Love Day counter baseline:', checkinStatus1.data.sharedCount, '(starts at 612)');

  // 10. Ayush checks in
  const ayushCheckin = await request('POST', '/api/checkin', null, tokenAyush);
  console.log('10. Ayush check-in:', ayushCheckin.status === 200 && ayushCheckin.data.todayRecord.partner1CheckedIn ? 'PASS' : 'FAIL',
    'Ayush:', ayushCheckin.data.todayRecord.partner1CheckedIn,
    'Vrishti:', ayushCheckin.data.todayRecord.partner2CheckedIn,
    'Both:', ayushCheckin.data.todayRecord.bothCompleted,
    'Count:', ayushCheckin.data.sharedCount);

  // 11. Vrishti checks in
  const vrishtiCheckin = await request('POST', '/api/checkin', null, tokenVrishti);
  console.log('11. Vrishti check-in (both completed):', vrishtiCheckin.status === 200 && vrishtiCheckin.data.todayRecord.bothCompleted ? 'PASS' : 'FAIL',
    'Both:', vrishtiCheckin.data.todayRecord.bothCompleted,
    'Count:', vrishtiCheckin.data.sharedCount);

  // 12. Duplicate check-in on same day should not increment count
  const dupCheckin = await request('POST', '/api/checkin', null, tokenAyush);
  console.log('12. Duplicate check-in does not re-increment:', dupCheckin.data.sharedCount === vrishtiCheckin.data.sharedCount ? 'PASS' : 'FAIL',
    'Count:', dupCheckin.data.sharedCount);

  // 13. Game session state sync
  const gameSync = await request('POST', '/api/games/session/maze-test', {
    state: { player1: { x: 5, y: 10 }, player2: { x: 3, y: 8 } },
    gameTitle: 'Together Maze',
  }, tokenAyush);
  console.log('13. Game session update:', gameSync.status === 200 ? 'PASS' : 'FAIL');

  const gameFetch = await request('GET', '/api/games/session/maze-test', null, tokenVrishti);
  console.log('14. Partner reads synced game session:', gameFetch.data.state?.player1?.x === 5 ? 'PASS' : 'FAIL');

  console.log('--- Verification Suite Finished Successfully! ---');
  server.close(() => {
    process.exit(0);
  });
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  server.close(() => process.exit(1));
});
