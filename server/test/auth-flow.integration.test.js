const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const prisma = require('../src/config/prismaClient');
const app = require('../src/app');
const { createCsrfContext } = require('./csrf-helper');

test('OTP login distinguishes new and returning customers', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const csrf = await createCsrfContext(base);
  const phone = `+919${Date.now().toString().slice(-9)}`;
  const code = '482915';
  let userId;
  async function addOtp() {
    await prisma.otpToken.create({ data: { phone, purpose: 'LOGIN', codeHash: await bcrypt.hash(code, 4), expiresAt: new Date(Date.now() + 60000) } });
  }
  async function post(endpoint, body, cookie = '') {
    const response = await fetch(base + endpoint, { method: endpoint === '/account' ? 'PATCH' : 'POST', headers: csrf.headers({ 'Content-Type': 'application/json' }, cookie), body: JSON.stringify(body) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] || '' };
  }
  try {
    await addOtp();
    const first = await post('/auth/otp/verify', { phone, code, purpose: 'LOGIN' });
    assert.equal(first.status, 200);
    assert.equal(first.body.data.isNewUser, true);
    assert.equal(first.body.data.needsProfile, true);
    userId = first.body.data.user.id;
    const profile = await post('/account', { name: 'Flow Test Customer', email: `flow-${Date.now()}@example.com` }, first.cookie);
    assert.equal(profile.status, 200);
    await addOtp();
    const returning = await post('/auth/otp/verify', { phone, code, purpose: 'LOGIN' });
    assert.equal(returning.status, 200);
    assert.equal(returning.body.data.isNewUser, false);
    assert.equal(returning.body.data.needsProfile, false);
    assert.equal(returning.body.data.user.name, 'Flow Test Customer');
  } finally {
    await prisma.otpToken.deleteMany({ where: { phone } });
    if (userId) {
      await prisma.cart.deleteMany({ where: { userId } });
      await prisma.wishlist.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await new Promise(resolve => server.close(resolve));
    await prisma.$disconnect();
  }
});
