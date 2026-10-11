const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('../src/app');
const prisma = require('../src/config/prismaClient');

test('public endpoints respond and protected endpoint groups reject anonymous access', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const api = `${origin}/api/v1`;

  async function expectJson(pathname, expectedStatus = 200) {
    const response = await fetch(origin + pathname);
    assert.equal(response.status, expectedStatus, `${pathname} returned ${response.status}`);
    assert.match(response.headers.get('content-type') || '', /application\/json/);
    const body = await response.json();
    assert.equal(body.success, expectedStatus < 400);
    return body;
  }

  try {
    await expectJson('/health');
    for (const pathname of [
      '/csrf',
      '/navigation',
      '/products?perPage=2',
      '/categories',
      '/collections',
      '/homepage',
      '/videos',
      '/testimonials',
      '/settings/public',
      '/cart',
      '/wishlist',
    ]) {
      await expectJson(`/api/v1${pathname}`);
    }

    for (const pathname of [
      '/auth/me',
      '/account',
      '/account/orders',
      '/account/addresses',
      '/account/returns',
      '/admin/me',
      '/admin/products',
      '/admin/orders',
      '/admin/customers',
      '/admin/returns',
      '/admin/settings',
      '/admin/website',
    ]) {
      await expectJson(`/api/v1${pathname}`, 401);
    }

    await expectJson('/api/v1/route-that-does-not-exist', 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await prisma.$disconnect();
  }
});
