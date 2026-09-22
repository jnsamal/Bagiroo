const prisma = require('../config/prismaClient');
const { ApiError } = require('../middleware/errorHandler');
const { computeTotals, lineItemPrice } = require('./pricing.service');
const { reserveStock, finalizeReservation } = require('./inventory.service');
const { recordCouponUsage } = require('./coupon.service');
const paymentProvider = require('./payment.provider');

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BAG-${stamp}-${rand}`;
}

// Creates an order from the current cart: recomputes every price and
// stock check server-side (never trusts the client), reserves inventory,
// and opens a Razorpay order for payment. Everything happens in one
// transaction so a stock failure partway through leaves no orphaned rows.
async function createOrderFromCart({ cart, user, guestEmail, guestPhone, shippingAddress, billingAddress }) {
  if (!cart.items.length) throw new ApiError(400, 'Your cart is empty.');

  const totals = await computeTotals(cart);
  if (totals.hasUnpriceableItems) {
    throw new ApiError(
      409,
      'One or more items in your cart do not have a price configured yet and cannot be ordered.'
    );
  }
  if (totals.subtotalMinor <= 0) throw new ApiError(400, 'Your cart total must be greater than zero.');

  const order = await prisma.$transaction(async (tx) => {
    // Reserve stock for every line item before creating anything else.
    for (const item of cart.items) {
      await reserveStock(tx, item.productId, item.variationId, item.quantity);
    }

    const newOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user?.id,
        guestEmail: user ? undefined : guestEmail,
        guestPhone: user ? undefined : guestPhone,
        status: 'PENDING',
        subtotalMinor: totals.subtotalMinor,
        discountMinor: totals.discountMinor,
        shippingMinor: totals.shippingMinor,
        taxMinor: totals.taxMinor,
        totalMinor: totals.totalMinor,
        couponCode: totals.appliedCoupon?.code,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            variationId: item.variationId,
            titleSnapshot: item.product.title,
            priceMinor: lineItemPrice(item),
            quantity: item.quantity,
          })),
        },
        addresses: {
          create: [
            { type: 'SHIPPING', ...shippingAddress },
            ...(billingAddress ? [{ type: 'BILLING', ...billingAddress }] : []),
          ],
        },
        statusHistory: { create: [{ status: 'PENDING', note: 'Order created, awaiting payment.' }] },
      },
    });

    if (totals.appliedCoupon) {
      await recordCouponUsage(totals.appliedCoupon.id, user?.id, newOrder.id);
    }

    return newOrder;
  });

  // Razorpay order creation happens outside the DB transaction (external
  // API call) but before we hand back a response — if it fails, we still
  // want the order+reservation to exist so the customer can retry payment
  // rather than losing their place in the queue.
  let providerOrderId = null;
  try {
    const result = await paymentProvider.createOrder(order.totalMinor, order.currency, order.orderNumber);
    providerOrderId = result.providerOrderId;
    await prisma.payment.create({
      data: { orderId: order.id, providerOrderId, amountMinor: order.totalMinor, status: 'CREATED' },
    });
  } catch (err) {
    // Razorpay not configured yet in dev — order still exists as PENDING;
    // surface this clearly rather than pretending payment was initiated.
    // eslint-disable-next-line no-console
    console.warn('[order.service] Razorpay order creation failed:', err.message);
  }

  // Empty the cart now that it's become an order.
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });

  return { order, providerOrderId };
}

// Called from the payment-verify endpoint.
async function confirmPayment(orderId, { razorpayOrderId, razorpayPaymentId, razorpaySignature }, requesterUserId = null) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: requesterUserId },
    include: { items: true, payments: true },
  });
  if (!order) throw new ApiError(404, 'Order not found.');

  // The provider order ID is the guest checkout capability and must belong to
  // this exact local order. Never apply a valid payment from one order to another.
  const payment = order.payments.find((entry) => entry.providerOrderId === razorpayOrderId);
  if (!payment) throw new ApiError(404, 'Payment not found.');

  const isValid = paymentProvider.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) throw new ApiError(400, 'Payment verification failed.');

  if (payment.status === 'CAPTURED' && order.status === 'PAID') return order;

  return prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'CAPTURED', providerPaymentId: razorpayPaymentId, providerSignature: razorpaySignature },
    });

    for (const item of order.items) {
      await finalizeReservation(tx, item.productId, item.variationId, item.quantity);
    }

    const updatedOrder = await tx.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
    await tx.orderStatusHistory.create({ data: { orderId: order.id, status: 'PAID', note: 'Payment confirmed.' } });

    return updatedOrder;
  });
}

module.exports = { createOrderFromCart, confirmPayment };
