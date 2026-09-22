const rateLimit = require('express-rate-limit');
const env = require('../config/env');

// Applied to OTP request/verify and other sensitive endpoints per the spec's
// "rate limiting for authentication and sensitive endpoints" requirement.
const commonOptions = {
  windowMs: env.rateLimitWindowMinutes * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many attempts. Please try again later.' },
  },
};

// Each sensitive action gets an independent counter. A successful admin
// login or OTP verification must not consume the SMS-request allowance.
const authRateLimiter = rateLimit({ ...commonOptions, max: env.rateLimitMaxAttempts });
const otpRequestRateLimiter = rateLimit({ ...commonOptions, max: env.rateLimitMaxAttempts });
const otpVerifyRateLimiter = rateLimit({ ...commonOptions, max: Math.max(10, env.rateLimitMaxAttempts * 2), skipSuccessfulRequests: true });

module.exports = { authRateLimiter, otpRequestRateLimiter, otpVerifyRateLimiter };
