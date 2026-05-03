/**
 * test-api.js  —  Tests all Phase 1 auth endpoints.
 * Run with: node test-api.js
 * (Server must be running in another terminal: node index.js)
 */

const http = require('http');

let savedCookie = '';

// ─── Helper: make HTTP request ───────────────────────────────────────────────
function request(method, path, body = null, useCookie = false) {
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
        ...(useCookie && savedCookie && { Cookie: savedCookie }),
      },
    };

    const req = http.request(options, (res) => {
      // Save cookie from login
      const setCookie = res.headers['set-cookie'];
      if (setCookie) {
        savedCookie = setCookie.map(c => c.split(';')[0]).join('; ');
      }

      let raw = '';
      res.on('data', chunk => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ─── Test runner ─────────────────────────────────────────────────────────────
function log(label, res) {
  const icon = res.status < 300 ? '✅' : res.status < 500 ? '⚠️ ' : '❌';
  console.log(`\n${icon}  [${res.status}] ${label}`);
  console.log('   ', JSON.stringify(res.body, null, 2).replace(/\n/g, '\n    '));
}

(async () => {
  console.log('═══════════════════════════════════════════');
  console.log('   Smart Helpdesk API — Phase 1 Tests');
  console.log('═══════════════════════════════════════════');

  // 1. Health check
  const health = await request('GET', '/');
  log('GET / (health check)', health);

  // 2. Register student
  const reg = await request('POST', '/auth/register', {
    name: 'Akhilesh Kumar',
    email: 'akhilesh@college.edu',
    password: 'Student@123',
    role: 'student',
    usn: '1RV21CS001',
  });
  log('POST /auth/register (student)', reg);

  // 3. Register staff
  const regStaff = await request('POST', '/auth/register', {
    name: 'Dr. Pavan Staff',
    email: 'pavan@college.edu',
    password: 'Staff@1234',
    role: 'staff',
    employeeId: 'EMP-2024-042',
  });
  log('POST /auth/register (staff)', regStaff);

  // 4. Try registering with invalid USN (not 11 chars)
  const badUsn = await request('POST', '/auth/register', {
    name: 'Bad Student',
    email: 'bad@college.edu',
    password: 'Student@123',
    role: 'student',
    usn: 'SHORT',
  });
  log('POST /auth/register (bad USN — should fail)', badUsn);

  // 5. Login as admin (using email)
  const loginAdmin = await request('POST', '/auth/login', {
    identifier: 'admin@helpdesk.edu',
    password: 'Admin@1234',
  });
  log('POST /auth/login (admin via email)', loginAdmin);

  // 6. GET /auth/me (should return admin info)
  const me = await request('GET', '/auth/me', null, true);
  log('GET /auth/me (with cookie)', me);

  // 7. Login as student using USN
  const loginUsn = await request('POST', '/auth/login', {
    identifier: '1RV21CS001',
    password: 'Student@123',
  });
  log('POST /auth/login (student via USN)', loginUsn);

  // 8. Login with wrong password
  const badLogin = await request('POST', '/auth/login', {
    identifier: 'admin@helpdesk.edu',
    password: 'WrongPassword',
  });
  log('POST /auth/login (wrong password — should fail)', badLogin);

  // 9. Logout
  const logoutRes = await request('POST', '/auth/logout', null, true);
  log('POST /auth/logout', logoutRes);

  // 10. GET /auth/me after logout (should fail)
  const meAfterLogout = await request('GET', '/auth/me', null, true);
  log('GET /auth/me (after logout — should fail 401)', meAfterLogout);

  // 11. seed-admin (should return 403 since admin exists)
  const seedAdmin = await request('POST', '/auth/seed-admin', {
    name: 'Another Admin',
    email: 'admin2@helpdesk.edu',
    password: 'Admin@5678',
  });
  log('POST /auth/seed-admin (should return 403)', seedAdmin);

  console.log('\n═══════════════════════════════════════════');
  console.log('   All tests complete!');
  console.log('═══════════════════════════════════════════\n');
})();
