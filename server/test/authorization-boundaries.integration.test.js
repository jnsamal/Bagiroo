const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = require('../src/config/prismaClient');
const app = require('../src/app');
const { signSession } = require('../src/services/jwt.service');
const { createCsrfContext } = require('./csrf-helper');

test('customer endpoints cannot read or mutate another customer records', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const csrf = await createCsrfContext(base);
  const suffix = crypto.randomUUID();
  const product = await prisma.product.findFirst({ where: { isPublished: true, deletedAt: null } });
  assert(product, 'A published product is required for this integration test');

  const userA = await prisma.user.create({ data: { phone: `+914${Date.now().toString().slice(-9)}`, name: 'Customer A' } });
  const userB = await prisma.user.create({ data: { phone: `+913${Date.now().toString().slice(-9)}`, name: 'Customer B' } });
  const cookieA = `bagiroo_session=${signSession(userA)}`;
  const cookieB = `bagiroo_session=${signSession(userB)}`;
  const addressA = await prisma.userAddress.create({ data: { userId: userA.id, fullName: 'Customer A', phone: userA.phone, line1: 'A street', city: 'Delhi', state: 'Delhi', postalCode: '110001' } });
  const orderA = await prisma.order.create({
    data: {
      orderNumber: `AUTH-A-${suffix}`, userId: userA.id, status: 'DELIVERED', subtotalMinor: 10000, totalMinor: 10000,
      items: { create: [{ productId: product.id, titleSnapshot: product.title, priceMinor: 10000, quantity: 1 }] },
      payments: { create: [{ providerOrderId: `provider-a-${suffix}`, amountMinor: 10000 }] },
    },
    include: { items: true },
  });
  const orderB = await prisma.order.create({
    data: {
      orderNumber: `AUTH-B-${suffix}`, userId: userB.id, status: 'DELIVERED', subtotalMinor: 10000, totalMinor: 10000,
      items: { create: [{ productId: product.id, titleSnapshot: product.title, priceMinor: 10000, quantity: 1 }] },
      payments: { create: [{ providerOrderId: `provider-b-${suffix}`, amountMinor: 10000 }] },
    },
    include: { items: true },
  });
  const cartA = await prisma.cart.create({ data: { userId: userA.id } });
  const cartB = await prisma.cart.create({ data: { userId: userB.id } });
  const cartItemA = await prisma.cartItem.create({ data: { cartId: cartA.id, productId: product.id, quantity: 1 } });

  async function request(endpoint, { method = 'GET', body, cookie = cookieB } = {}) {
    const response = await fetch(base + endpoint, {
      method,
      headers: csrf.headers(body ? { 'Content-Type': 'application/json' } : {}, cookie),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: response.headers.get('content-type')?.includes('json') ? await response.json() : null };
  }

  try {
    assert.equal((await request(`/account/orders/${orderA.id}`)).status, 404);
    assert.equal((await request(`/account/orders/${orderA.id}/invoice`)).status, 404);
    assert.equal((await request(`/account/addresses/${addressA.id}`, { method: 'PATCH', body: { city: 'Changed' } })).status, 404);
    assert.equal((await request(`/account/addresses/${addressA.id}`, { method: 'DELETE' })).status, 404);
    assert.equal((await prisma.userAddress.findUnique({ where: { id: addressA.id } })).city, 'Delhi');

    const paymentBody = { razorpayOrderId: `provider-a-${suffix}`, razorpayPaymentId: 'payment-from-other-user', razorpaySignature: 'invalid' };
    assert.equal((await request(`/orders/${orderA.id}/verify-payment`, { method: 'POST', body: paymentBody })).status, 404);
    assert.equal((await request(`/orders/${orderA.id}/verify-payment`, { method: 'POST', body: paymentBody, cookie: '' })).status, 404);
    assert.equal((await request(`/orders/${orderB.id}/verify-payment`, { method: 'POST', body: paymentBody })).status, 404, 'a provider order cannot be applied to another local order');
    assert.equal((await prisma.order.findUnique({ where: { id: orderA.id } })).status, 'DELIVERED');

    assert.equal((await request('/account/returns', {
      method: 'POST',
      body: { orderId: orderB.id, reason: 'Cross-order item test', items: [{ orderItemId: orderA.items[0].id, quantity: 1 }] },
    })).status, 400);
    assert.equal(await prisma.return.count({ where: { orderId: orderB.id } }), 0);

    assert.equal((await request(`/cart/items/${cartItemA.id}`, { method: 'PATCH', body: { quantity: 9 } })).status, 404);
    assert.equal((await prisma.cartItem.findUnique({ where: { id: cartItemA.id } })).quantity, 1);
  } finally {
    await prisma.returnItem.deleteMany({ where: { return: { orderId: { in: [orderA.id, orderB.id] } } } });
    await prisma.return.deleteMany({ where: { orderId: { in: [orderA.id, orderB.id] } } });
    await prisma.payment.deleteMany({ where: { orderId: { in: [orderA.id, orderB.id] } } });
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: [orderA.id, orderB.id] } } });
    await prisma.orderAddress.deleteMany({ where: { orderId: { in: [orderA.id, orderB.id] } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: [orderA.id, orderB.id] } } });
    await prisma.order.deleteMany({ where: { id: { in: [orderA.id, orderB.id] } } });
    await prisma.cartItem.deleteMany({ where: { cartId: { in: [cartA.id, cartB.id] } } });
    await prisma.cart.deleteMany({ where: { id: { in: [cartA.id, cartB.id] } } });
    await prisma.userAddress.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
    await new Promise(resolve => server.close(resolve));
    await prisma.$disconnect();
  }
});
