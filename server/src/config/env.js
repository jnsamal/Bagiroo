require('dotenv').config();
const path = require('path');

function required(key, fallback = undefined) {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`[config] Missing env var: ${key}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const cookieSameSite = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
if (!['lax', 'strict', 'none'].includes(cookieSameSite)) throw new Error('COOKIE_SAME_SITE must be lax, strict, or none.');

const env = {
  nodeEnv,
  port: Number(process.env.PORT) || 4000,
  clientUrl: required('CLIENT_URL', 'http://localhost:5173'),
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(value => value.trim().replace(/\/$/, '')).filter(Boolean),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSecret: required('COOKIE_SECRET'),
  cookieSameSite,
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : nodeEnv === 'production',

  uploadDir: path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../../uploads')),

  smsProvider: process.env.SMS_PROVIDER || 'console',
  smsApiKey: process.env.SMS_PROVIDER_API_KEY,
  smsSenderId: process.env.SMS_PROVIDER_SENDER_ID || 'BAGCO',
  otpExpiresInMinutes: Number(process.env.OTP_EXPIRES_IN_MINUTES) || 5,
  otpLength: Number(process.env.OTP_LENGTH) || 6,

  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,

  whatsappBusinessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || '',

  rateLimitWindowMinutes: Number(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15,
  rateLimitMaxAttempts: Number(process.env.RATE_LIMIT_MAX_ATTEMPTS) || 5,
};

if (nodeEnv === 'production') {
  for (const key of ['DATABASE_URL', 'JWT_SECRET', 'COOKIE_SECRET', 'CLIENT_URL']) {
    if (!process.env[key]) throw new Error(`${key} is required in production.`);
  }
  if (cookieSameSite === 'none' && !env.cookieSecure) throw new Error('COOKIE_SECURE must be true when COOKIE_SAME_SITE=none.');
}

module.exports = env;
