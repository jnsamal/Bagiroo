const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = require('../src/config/prismaClient');
const app = require('../src/app');
const loginLockout = require('../src/services/login-lockout.service');
const { createCsrfContext } = require('./csrf-helper');

test('customer and admin logins lock by account and IP after six failures', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const csrf = await createCsrfContext(base);
  const suffix = crypto.randomUUID();
  const password = 'correct-password-' + suffix;
  const adminA = await prisma.user.create({ data: { phone: `+917${Date.now().toString().slice(-9)}`, loginId: `lock-a-${suffix}`, passwordHash: await bcrypt.hash(password, 4), role: 'ADMIN' } });
  const adminB = await prisma.user.create({ data: { phone: `+918${Date.now().toString().slice(-9)}`, loginId: `lock-b-${suffix}`, passwordHash: await bcrypt.hash(password, 4), role: 'ADMIN' } });
  const customerPhone = `+916${Date.now().toString().slice(-9)}`;
  const otherPhone = `+915${Date.now().toString().slice(-9)}`;
  const code = '482915';
  const contexts = [];

  async function post(endpoint, body, ip) {
    const response = await fetch(base + endpoint, {
      method: 'POST',
      headers: csrf.headers({ 'Content-Type': 'application/json', 'X-Forwarded-For': ip }),
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  }

  async function addOtp(phone) {
    await prisma.otpToken.create({ data: { phone, purpose: 'LOGIN', codeHash: await bcrypt.hash(code, 4), expiresAt: new Date(Date.now() + 60000) } });
  }

  try {
    const adminIp = '203.0.113.10';
    const alternateAdminIp = '203.0.113.11';
    contexts.push(loginLockout.context('admin', adminA.loginId, adminIp));
    contexts.push(loginLockout.context('admin', adminA.loginId, alternateAdminIp));
    contexts.push(loginLockout.context('admin', adminB.loginId, adminIp));
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      assert.equal((await post('/admin/login', { loginId: adminA.loginId, password: 'wrong-password' }, adminIp)).status, 401);
    }
    const sixthAdminFailure = await post('/admin/login', { loginId: adminA.loginId, password: 'wrong-password' }, adminIp);
    assert.equal(sixthAdminFailure.status, 429);
    assert.match(sixthAdminFailure.body.error.message, /6 hours/);
    assert.equal((await post('/admin/login', { loginId: adminA.loginId, password }, alternateAdminIp)).status, 429, 'account lock follows the account to another IP');
    assert.equal((await post('/admin/login', { loginId: adminB.loginId, password }, adminIp)).status, 429, 'IP lock applies to another account');

    const customerIp = '198.51.100.20';
    const alternateCustomerIp = '198.51.100.21';
    contexts.push(loginLockout.context('customer', customerPhone, customerIp));
    contexts.push(loginLockout.context('customer', customerPhone, alternateCustomerIp));
    contexts.push(loginLockout.context('customer', otherPhone, customerIp));
    await addOtp(customerPhone);
    await addOtp(otherPhone);
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      assert.equal((await post('/auth/otp/verify', { phone: customerPhone, code: '000000', purpose: 'LOGIN' }, customerIp)).status, 400);
    }
    const sixthCustomerFailure = await post('/auth/otp/verify', { phone: customerPhone, code: '000000', purpose: 'LOGIN' }, customerIp);
    assert.equal(sixthCustomerFailure.status, 429);
    assert.match(sixthCustomerFailure.body.error.message, /6 hours/);
    assert.equal((await post('/auth/otp/verify', { phone: customerPhone, code, purpose: 'LOGIN' }, alternateCustomerIp)).status, 429, 'customer account lock follows the account to another IP');
    assert.equal((await post('/auth/otp/verify', { phone: otherPhone, code, purpose: 'LOGIN' }, customerIp)).status, 429, 'customer IP lock applies to another account');
  } finally {
    const keys = [...new Set(contexts.flatMap(item => item.keys))];
    if (keys.length) await prisma.authLockout.deleteMany({ where: { lockKey: { in: keys } } });
    await prisma.otpToken.deleteMany({ where: { phone: { in: [customerPhone, otherPhone] } } });
    await prisma.user.deleteMany({ where: { id: { in: [adminA.id, adminB.id] } } });
    await new Promise(resolve => server.close(resolve));
    await prisma.$disconnect();
  }
});
