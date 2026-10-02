const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

// Configure test environment with a unique test DB file
const TEST_DB_PATH = path.join(__dirname, `test_${Date.now()}.db`);
process.env.DB_PATH = TEST_DB_PATH;
process.env.ADMIN_USER = 'testadmin';
process.env.ADMIN_PASSWORD = 'testpassword123';
process.env.NODE_ENV = 'test';

const { initDb, closeDatabase } = require('../src/db');
const createApp = require('../src/app');
const { clean, escapeCsvCell } = require('../src/utils/sanitizer');

describe('Wedding Invitation App - Unit & Integration Tests', () => {
  let server;
  let baseUrl;
  const authHeader = 'Basic ' + Buffer.from('testadmin:testpassword123').toString('base64');

  before(async () => {
    initDb(TEST_DB_PATH);

    const app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    closeDatabase();

    // Clean up temporary test files
    const cleanFile = (p) => {
      try {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch (e) {}
    };
    cleanFile(TEST_DB_PATH);
    cleanFile(TEST_DB_PATH + '-wal');
    cleanFile(TEST_DB_PATH + '-shm');
  });

  describe('Sanitizer & Security Utilities', () => {
    test('clean() trims and normalizes whitespace', () => {
      assert.equal(clean('  Alice   Wonderland  ', 50), 'Alice Wonderland');
    });

    test('escapeCsvCell() prevents formula injection', () => {
      assert.equal(escapeCsvCell('=SUM(1+1)'), `"'=SUM(1+1)"`);
      assert.equal(escapeCsvCell('+cmd|...'), ` "'+cmd|..."`.trim());
      assert.equal(escapeCsvCell('Normal Guest'), `"Normal Guest"`);
    });
  });

  describe('Public API', () => {
    test('GET / serves the public guest landing page without auth', async () => {
      const res = await fetch(`${baseUrl}/`);
      assert.equal(res.status, 200);
      const text = await res.text();
      assert.ok(text.includes('Invitation'));
    });

    test('GET /api/guest/:token returns 404 for invalid token', async () => {
      const res = await fetch(`${baseUrl}/api/guest/nonexistent`);
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.error, 'Lien invalide');
    });

    test('POST /api/rsvp without token (open link)', async () => {
      const res = await fetch(`${baseUrl}/api/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Jean Dupont', status: 'accepted' }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
    });

    test('POST /api/rsvp validates input', async () => {
      const res = await fetch(`${baseUrl}/api/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Jean Dupont', status: 'invalid_status' }),
      });
      assert.equal(res.status, 400);
    });

    test('POST /api/messages and GET /api/messages', async () => {
      const postRes = await fetch(`${baseUrl}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: 'Jean Dupont', text: 'Toutes mes félicitations !' }),
      });
      assert.equal(postRes.status, 200);

      const getRes = await fetch(`${baseUrl}/api/messages`);
      assert.equal(getRes.status, 200);
      const list = await getRes.json();
      assert.ok(Array.isArray(list));
      assert.ok(list.length >= 1);
      assert.equal(list[0].text, 'Toutes mes félicitations !');
    });
  });

  describe('Admin API & Authentication', () => {
    test('GET /api/admin/summary rejects unauthenticated requests with 401', async () => {
      const res = await fetch(`${baseUrl}/api/admin/summary`);
      assert.equal(res.status, 401);
      assert.ok(res.headers.get('www-authenticate'));
    });

    test('GET /api/admin/summary succeeds with valid basic auth', async () => {
      const res = await fetch(`${baseUrl}/api/admin/summary`, {
        headers: { Authorization: authHeader },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.accepted, 1);
      assert.equal(data.total, 1);
      assert.equal(data.messages, 1);
    });

    test('POST /api/admin/guests creates guest personal links', async () => {
      const res = await fetch(`${baseUrl}/api/admin/guests`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ names: ['Julie Mbala', 'Louis Kabongo'] }),
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.created.length, 2);
      assert.ok(data.created[0].token);

      // Verify that personal link resolves via public API
      const guestRes = await fetch(`${baseUrl}/api/guest/${data.created[0].token}`);
      assert.equal(guestRes.status, 200);
      const guestData = await guestRes.json();
      assert.equal(guestData.name, 'Julie Mbala');
    });

    test('GET /api/admin/rsvps.csv exports valid CSV', async () => {
      const res = await fetch(`${baseUrl}/api/admin/rsvps.csv`, {
        headers: { Authorization: authHeader },
      });
      assert.equal(res.status, 200);
      assert.ok(res.headers.get('content-type').includes('text/csv'));
      const text = await res.text();
      assert.ok(text.includes('Jean Dupont'));
    });
  });

  describe('Static Assets (CSS and JS separation)', () => {
    test('serves public CSS stylesheet at /css/style.css', async () => {
      const res = await fetch(`${baseUrl}/css/style.css`);
      assert.equal(res.status, 200);
      const text = await res.text();
      assert.ok(text.includes('--gold'));
    });

    test('serves public JavaScript at /js/app.js', async () => {
      const res = await fetch(`${baseUrl}/js/app.js`);
      assert.equal(res.status, 200);
      const text = await res.text();
      assert.ok(text.includes('WEDDING_DATE'));
    });

    test('admin static assets require basic authentication', async () => {
      const resCss = await fetch(`${baseUrl}/admin/css/admin.css`);
      assert.equal(resCss.status, 401);

      const resJs = await fetch(`${baseUrl}/admin/js/admin.js`);
      assert.equal(resJs.status, 401);
    });

    test('admin static assets load successfully with basic authentication', async () => {
      const resCss = await fetch(`${baseUrl}/admin/css/admin.css`, {
        headers: { Authorization: authHeader },
      });
      assert.equal(resCss.status, 200);
      const cssText = await resCss.text();
      assert.ok(cssText.includes('--gold'));

      const resJs = await fetch(`${baseUrl}/admin/js/admin.js`, {
        headers: { Authorization: authHeader },
      });
      assert.equal(resJs.status, 200);
      const jsText = await resJs.text();
      assert.ok(jsText.includes('sAcc'));
    });
  });
});
