const bcrypt = require('bcryptjs');
const prisma = require('../config/prismaClient');
const smsProvider = require('./sms.provider');
const env = require('../config/env');
const { ApiError } = require('../middleware/errorHandler');

function generateNumericCode(length) {
  const max = 10 ** length;
  const code = Math.floor(Math.random() * max)
    .toString()
    .padStart(length, '0');
  return code;
}

async function requestOtp(phone, purpose) {
  const code = generateNumericCode(env.otpLength);
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + env.otpExpiresInMinutes * 60 * 1000);

  await prisma.otpToken.create({
    data: { phone, codeHash, purpose, expiresAt },
  });

  await smsProvider.sendOtp(phone, code);
}

async function verifyOtp(phone, code, purpose) {
  const token = await prisma.otpToken.findFirst({
    where: { phone, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!token) throw new ApiError(400, 'No OTP request found. Please request a new code.');
  if (token.expiresAt < new Date()) throw new ApiError(400, 'This code has expired.');
  if (token.attempts >= 6) throw new ApiError(429, 'Too many failed login attempts. This login is temporarily locked for 6 hours.');

  const isValid = await bcrypt.compare(code, token.codeHash);

  if (!isValid) {
    await prisma.otpToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });
    const error = new ApiError(400, 'Incorrect code. Please try again.');
    error.isAuthenticationFailure = true;
    throw error;
  }

  await prisma.otpToken.update({
    where: { id: token.id },
    data: { consumedAt: new Date() },
  });

  return true;
}

module.exports = { requestOtp, verifyOtp };
