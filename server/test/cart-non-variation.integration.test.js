const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = require('../src/config/prismaClient');
const app = require('../src/app');
const { createCsrfContext } = require('./csrf-helper');

test('a product without colour variations can be added to a guest cart repeatedly', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const csrf = await createCsrfContext(base);
  const suffix = crypto.randomUUID();
  const product = await prisma.product.create({
    data: {
      title: `Cart test ${suffix}`,
      slug: `cart-test-${suffix}`,
      sku: `CART-${suffix}`,
      priceMinor: 399900,
      isPublished: true,
      hasColorVariations: false,
    },
  });
  let guestCookie = '';
  let cartId = '';

  async function add(quantity) {
    const response = await fetch(`${base}/cart/items`, {
      method: 'POST',
      headers: csrf.headers({ 'Content-Type': 'application/json' }, guestCookie),
      body: JSON.stringify({ productId: product.id, quantity }),
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) guestCookie = setCookie.split(';')[0];
    return { status: response.status, body: await response.json() };
  }

  try {
    const first = await add(1);
    assert.equal(first.status, 201);
    cartId = first.body.data.id;
    assert.equal(first.body.data.items.length, 1);
    assert.equal(first.body.data.items[0].variationId, null);

    const second = await add(2);
    assert.equal(second.status, 201);
    assert.equal(second.body.data.items.length, 1);
    assert.equal(second.body.data.items[0].quantity, 3);
  } finally {
    await prisma.cartItem.deleteMany({ where: { productId: product.id } });
    if (cartId) await prisma.cart.deleteMany({ where: { id: cartId } });
    await prisma.product.delete({ where: { id: product.id } });
    await new Promise(resolve => server.close(resolve));
    await prisma.$disconnect();
  }
});
