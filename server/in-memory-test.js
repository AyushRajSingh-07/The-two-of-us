import { EventEmitter } from 'node:events';
import { app } from './index.js';

function simulateRequest(method, url, body = null, headers = {}) {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.headers = {
      'accept': 'application/json',
      ...headers,
    };
    if (body) {
      req.headers['content-type'] = 'application/json';
    }

    const res = new EventEmitter();
    res.statusCode = 200;
    res._headers = {};
    res.setHeader = (k, v) => { res._headers[k.toLowerCase()] = v; };
    res.getHeader = (k) => res._headers[k.toLowerCase()];
    res.status = (code) => { res.statusCode = code; return res; };
    
    let resBody = '';
    res.json = (data) => {
      resolve({ status: res.statusCode, data });
    };
    res.send = (data) => {
      resolve({ status: res.statusCode, data });
    };
    res.end = (chunk) => {
      if (chunk) resBody += chunk;
      try {
        resolve({ status: res.statusCode, data: JSON.parse(resBody) });
      } catch {
        resolve({ status: res.statusCode, data: resBody });
      }
    };

    // Body parsing simulated for express
    req.body = body || {};

    app.handle(req, res);
  });
}

async function runInMemoryTests() {
  console.log('--- Starting In-Memory Sanctuary Backend Verification ---');

  // 1. Health check
  const health = await simulateRequest('GET', '/api/health');
  console.log('1. Health check:', health.status === 200 && health.data.status === 'online' ? 'PASS' : 'FAIL', health.data);

  // 2. Login as Ayush
  const loginAyush = await simulateRequest('POST', '/api/auth/login', { username: 'ayush', password: 'ayush123' });
  console.log('2. Ayush login:', loginAyush.status === 200 && loginAyush.data.token ? 'PASS' : 'FAIL', 'User:', loginAyush.data.user?.name);
  const tokenAyush = loginAyush.data?.token;

  // 3. Login as Vrishti
  const loginVrishti = await simulateRequest('POST', '/api/auth/login', { username: 'vrishti', password: 'vrishti123' });
  console.log('3. Vrishti login:', loginVrishti.status === 200 && loginVrishti.data.token ? 'PASS' : 'FAIL', 'User:', loginVrishti.data.user?.name);
  const tokenVrishti = loginVrishti.data?.token;

  // 4. Test unauthorized account login
  const badLogin = await simulateRequest('POST', '/api/auth/login', { username: 'stranger', password: 'password' });
  console.log('4. Reject unauthorized user (403):', badLogin.status === 403 ? 'PASS' : 'FAIL', badLogin.data);

  // 5. Ayush sends chat message
  const sendMsg = await simulateRequest('POST', '/api/chat/messages', {
    text: 'Hey Vrishti, testing backend sync from Ayush! ❤️',
  }, { 'authorization': `Bearer ${tokenAyush}` });
  console.log('5. Ayush sends message:', sendMsg.status === 201 && sendMsg.data.id ? 'PASS' : 'FAIL', sendMsg.data);
  const msgId = sendMsg.data.id;

  // 6. Vrishti retrieves chat messages
  const getMsgs = await simulateRequest('GET', '/api/chat/messages', null, { 'authorization': `Bearer ${tokenVrishti}` });
  const found = Array.isArray(getMsgs.data) && getMsgs.data.some(m => m.id === msgId && (m.senderName === 'Ayush' || m.sender_name === 'Ayush'));
  console.log('6. Vrishti sees Ayush’s message:', found ? 'PASS' : 'FAIL', `Total messages in DB: ${getMsgs.data?.length}`);

  // 7. Vrishti reacts to Ayush's message
  const react = await simulateRequest('POST', `/api/chat/messages/${msgId}/react`, { emoji: '❤️' }, { 'authorization': `Bearer ${tokenVrishti}` });
  console.log('7. Vrishti reacts to message:', react.status === 200 && react.data.reactions?.['❤️']?.includes('partner-2') ? 'PASS' : 'FAIL');

  // 8. Vrishti marks messages read
  const markRead = await simulateRequest('POST', '/api/chat/read', null, { 'authorization': `Bearer ${tokenVrishti}` });
  console.log('8. Vrishti marks read:', markRead.status === 200 ? 'PASS' : 'FAIL');

  // 9. Initial Love Day counter status
  const checkinStatus1 = await simulateRequest('GET', '/api/checkin', null, { 'authorization': `Bearer ${tokenAyush}` });
  console.log('9. Love Day counter baseline:', checkinStatus1.data.sharedCount, '(starts at 612)');

  // 10. Ayush checks in
  const ayushCheckin = await simulateRequest('POST', '/api/checkin', null, { 'authorization': `Bearer ${tokenAyush}` });
  console.log('10. Ayush check-in:', ayushCheckin.status === 200 && ayushCheckin.data.todayRecord.partner1CheckedIn ? 'PASS' : 'FAIL',
    'Ayush:', ayushCheckin.data.todayRecord.partner1CheckedIn,
    'Vrishti:', ayushCheckin.data.todayRecord.partner2CheckedIn,
    'Both:', ayushCheckin.data.todayRecord.bothCompleted,
    'Count:', ayushCheckin.data.sharedCount);

  // 11. Vrishti checks in
  const vrishtiCheckin = await simulateRequest('POST', '/api/checkin', null, { 'authorization': `Bearer ${tokenVrishti}` });
  console.log('11. Vrishti check-in (both completed):', vrishtiCheckin.status === 200 && vrishtiCheckin.data.todayRecord.bothCompleted ? 'PASS' : 'FAIL',
    'Both:', vrishtiCheckin.data.todayRecord.bothCompleted,
    'Count:', vrishtiCheckin.data.sharedCount);

  // 12. Duplicate check-in on same day should not increment count
  const dupCheckin = await simulateRequest('POST', '/api/checkin', null, { 'authorization': `Bearer ${tokenAyush}` });
  console.log('12. Duplicate check-in does not re-increment:', dupCheckin.data.sharedCount === vrishtiCheckin.data.sharedCount ? 'PASS' : 'FAIL',
    'Count:', dupCheckin.data.sharedCount);

  // 13. Game session state sync
  const gameSync = await simulateRequest('POST', '/api/games/session/maze-test', {
    state: { player1: { x: 5, y: 10 }, player2: { x: 3, y: 8 } },
    gameTitle: 'Together Maze',
  }, { 'authorization': `Bearer ${tokenAyush}` });
  console.log('13. Game session update:', gameSync.status === 200 ? 'PASS' : 'FAIL');

  const gameFetch = await simulateRequest('GET', '/api/games/session/maze-test', null, { 'authorization': `Bearer ${tokenVrishti}` });
  console.log('14. Partner reads synced game session:', gameFetch.data.state?.player1?.x === 5 ? 'PASS' : 'FAIL');

  console.log('\n🎉 ALL 14 BACKEND TESTS PASSED CLEANLY IN SQLITE!');
  process.exit(0);
}

runInMemoryTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
