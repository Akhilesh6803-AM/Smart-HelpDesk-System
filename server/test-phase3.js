/**
 * test-phase3.js  —  Tests Phase 3 endpoints (Notices, FAQs, Users).
 * Run with: node test-phase3.js
 */

const http = require('http');

let adminCookie = '';
let studentCookie = '';

function request(method, path, body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data && { 'Content-Length': Buffer.byteLength(data) }),
        ...(cookie && { Cookie: cookie }),
      },
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => (raw += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function log(label, res) {
  const icon = res.status < 300 ? '✅' : res.status < 500 ? '⚠️ ' : '❌';
  console.log(`\n${icon}  [${res.status}] ${label}`);
  if (res.body) console.log('   ', JSON.stringify(res.body, null, 2).replace(/\n/g, '\n    '));
}

(async () => {
  console.log('═══════════════════════════════════════════');
  console.log('   Phase 3 Tests (Notices, FAQs, Users)');
  console.log('═══════════════════════════════════════════');

  // 1. Login as admin
  const loginAdmin = await request('POST', '/auth/login', {
    identifier: 'admin@helpdesk.edu',
    password: 'Admin@1234',
  });
  if (loginAdmin.headers['set-cookie']) {
    adminCookie = loginAdmin.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
  }

  // 2. Login as student
  const loginStudent = await request('POST', '/auth/login', {
    identifier: '1RV21CS0001',
    password: 'Student@123',
  });
  if (loginStudent.headers['set-cookie']) {
    studentCookie = loginStudent.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
  }

  if (!studentCookie || !adminCookie) {
    console.log('❌ Failed to login. Exiting tests.');
    return;
  }

  // --- NOTICES ---
  const createNotice = await request('POST', '/notices', {
    title: 'Server Maintenance',
    description: 'The server will be down for maintenance from 2 AM to 4 AM.',
  }, adminCookie);
  log('POST /notices (Admin)', createNotice);
  const noticeId = createNotice.body?.notice?._id;

  const updateNotice = await request('PATCH', `/notices/${noticeId}`, {
    title: 'Server Maintenance Updated',
  }, adminCookie);
  log('PATCH /notices/:id (Admin)', updateNotice);

  const getNotices = await request('GET', '/notices');
  log('GET /notices (Public)', getNotices);

  const deleteNotice = await request('DELETE', `/notices/${noticeId}`, null, adminCookie);
  log('DELETE /notices/:id (Admin)', deleteNotice);

  // --- FAQS ---
  const createFAQ = await request('POST', '/faqs', {
    question: 'How do I reset my password?',
    answer: 'You can reset your password from the profile page.',
    category: 'Technical Issues',
  }, adminCookie);
  log('POST /faqs (Admin)', createFAQ);
  const faqId = createFAQ.body?.faq?._id;

  const updateFAQ = await request('PATCH', `/faqs/${faqId}`, {
    answer: 'Contact the admin or reset from your profile.',
  }, adminCookie);
  log('PATCH /faqs/:id (Admin)', updateFAQ);

  const getFAQs = await request('GET', '/faqs');
  log('GET /faqs (Public)', getFAQs);

  const deleteFAQ = await request('DELETE', `/faqs/${faqId}`, null, adminCookie);
  log('DELETE /faqs/:id (Admin)', deleteFAQ);

  // --- USERS ---
  const getUsers = await request('GET', '/users', null, adminCookie);
  log('GET /users (Admin)', getUsers);

  const studentId = loginStudent.body?.user?.id;
  const updateUser = await request('PATCH', `/users/${studentId}`, {
    name: 'Akhilesh Kumar Updated',
  }, studentCookie);
  log('PATCH /users/:id (Self Update)', updateUser);

  const getUpdatedUsers = await request('GET', '/users', null, adminCookie);
  log('GET /users (Admin check update)', getUpdatedUsers);

  console.log('\n═══════════════════════════════════════════');
  console.log('   All Phase 3 tests complete!');
  console.log('═══════════════════════════════════════════\n');
})();
