const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('../src/app');

test('all unsafe HTTP methods require a valid signed CSRF token', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  try {
    const tokenResponse = await fetch(`${base}/csrf`);
    const tokenBody = await tokenResponse.json();
    const setCookie = tokenResponse.headers.get('set-cookie');
    const cookie = setCookie.split(';')[0];
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Strict/i);
    assert(tokenBody.data.csrfToken);

    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      const missing = await fetch(`${base}/does-not-exist`, { method });
      assert.equal(missing.status, 403, `${method} must reject a missing token before routing`);

      const wrong = await fetch(`${base}/does-not-exist`, { method, headers: { Cookie: cookie, 'X-CSRF-Token': 'wrong-token' } });
      assert.equal(wrong.status, 403, `${method} must reject a mismatched token`);

      const valid = await fetch(`${base}/does-not-exist`, { method, headers: { Cookie: cookie, 'X-CSRF-Token': tokenBody.data.csrfToken } });
      assert.equal(valid.status, 404, `${method} with a valid token must reach routing`);
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
