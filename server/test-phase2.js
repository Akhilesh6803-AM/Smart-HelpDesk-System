/**
 * test-phase2.js  —  Tests Phase 2 endpoints (Tickets, AI, Notifications).
 * Run with: node test-phase2.js
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
  console.log('   Phase 2 Tests (Tickets & AI)');
  console.log('═══════════════════════════════════════════');

  // 1. Login as admin
  const loginAdmin = await request('POST', '/auth/login', {
    identifier: 'admin@helpdesk.edu',
    password: 'Admin@1234',
  });
  if (loginAdmin.headers['set-cookie']) {
    adminCookie = loginAdmin.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
  }

  // 1.5 Register the student
  await request('POST', '/auth/register', {
    name: 'Akhilesh Kumar',
    email: 'akhilesh2@college.edu',
    password: 'Student@123',
    role: 'student',
    usn: '1RV21CS0001',
  });

  // 2. Login as student
  const loginStudent = await request('POST', '/auth/login', {
    identifier: '1RV21CS0001',
    password: 'Student@123',
  });
  if (loginStudent.headers['set-cookie']) {
    studentCookie = loginStudent.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
  }

  if (!studentCookie) {
    console.log('❌ Failed to login student. Exiting tests.', loginStudent.body);
    return;
  }

  // 3. Test AI Suggestion
  const suggest = await request('POST', '/ai/suggest', {
    title: 'Wi-Fi not working',
    description: 'I cannot connect to the campus Wi-Fi in the library.',
    category: 'Technical Issues'
  }, studentCookie);
  log('POST /ai/suggest (Wi-Fi issue)', suggest);

  // 4. Create Normal Ticket (Should be High Priority due to "not working")
  const create1 = await request('POST', '/tickets/create', {
    title: 'Wi-Fi not working',
    description: 'I cannot connect to the campus Wi-Fi in the library.',
    category: 'Technical Issues'
  }, studentCookie);
  log('POST /tickets/create (Normal ticket, High Priority)', create1);
  const ticket1Id = create1.body?.ticket?._id;

  // 5. Create Sensitive Ticket (Should be Critical Priority)
  const create2 = await request('POST', '/tickets/create', {
    title: 'Facing harassment',
    description: 'Some seniors are doing ragging in the hostel.',
    category: 'Student Welfare & Complaints'
  }, studentCookie);
  log('POST /tickets/create (Sensitive ticket, Critical Priority)', create2);

  // 6. Get Student Tickets
  const getStudentTickets = await request('GET', '/tickets', null, studentCookie);
  log('GET /tickets (Student view)', getStudentTickets);

  // 7. Get Admin Tickets
  const getAdminTickets = await request('GET', '/tickets', null, adminCookie);
  log('GET /tickets (Admin view)', getAdminTickets);

  if (ticket1Id) {
    // 8. Admin reply to ticket
    const replyTicket = await request('PATCH', `/tickets/${ticket1Id}/reply`, {
      adminResponse: 'We have reset the router. Please try connecting again.'
    }, adminCookie);
    log('PATCH /tickets/:id/reply (Admin reply)', replyTicket);

    // 9. Admin update ticket status
    const updateStatus = await request('PATCH', `/tickets/${ticket1Id}/status`, {
      status: 'Closed'
    }, adminCookie);
    log('PATCH /tickets/:id/status (Admin close)', updateStatus);
  }

  // 10. Check Student Notifications
  const studentNotifications = await request('GET', '/notifications', null, studentCookie);
  log('GET /notifications (Student)', studentNotifications);

  // 11. Check Admin Notifications
  const adminNotifications = await request('GET', '/notifications', null, adminCookie);
  log('GET /notifications (Admin)', adminNotifications);

  console.log('\n═══════════════════════════════════════════');
  console.log('   All Phase 2 tests complete!');
  console.log('═══════════════════════════════════════════\n');
})();
