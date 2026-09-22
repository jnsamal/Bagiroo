// Payment-provider adapter interface (spec requirement: pluggable gateway).
// Decision on file: Razorpay. Swapping providers later means implementing
// this same interface, not touching checkout/order logic.
//
// Interface: createOrder(amountMinor, currency, receipt) -> { providerOrderId }
//            verifySignature(orderId, paymentId, signature) -> boolean

const Razorpay = require('razorpay');
const crypto = require('crypto');
const env = require('../config/env');

let client = null;
function getClient() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new Error(
      'Razorpay credentials are not configured. Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET.'
    );
  }
  if (!client) {
    client = new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret });
  }
  return client;
}

async function createOrder(amountMinor, currency, receipt) {
  const order = await getClient().orders.create({
    amount: amountMinor,
    currency,
    receipt,
  });
  return { providerOrderId: order.id };
}

function verifySignature(providerOrderId, providerPaymentId, signature) {
  const expected = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${providerOrderId}|${providerPaymentId}`)
    .digest('hex');
  return expected === signature;
}

module.exports = { createOrder, verifySignature };
