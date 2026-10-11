const prisma = require('../config/prismaClient');
const otpService = require('../services/otp.service');
const { signSession, sessionCookieOptions, sessionCookieClearOptions } = require('../services/jwt.service');
const { mergeGuestCartIntoUser } = require('../services/cart.service');
const { mergeGuestWishlistIntoUser } = require('../services/wishlist.service');
const { ApiError } = require('../middleware/errorHandler');
const asyncHandler = require('../middleware/asyncHandler');
const { emailOtpRequestSchema, otpVerifySchema } = require('../../../shared/validation/authSchemas');
const loginLockout = require('../services/login-lockout.service');

// POST /api/v1/auth/otp/request
// Body: { email, purpose: 'LOGIN' | 'REGISTER' }
const requestOtp = asyncHandler(async (req, res) => {
  const { email, purpose } = emailOtpRequestSchema.parse(req.body);

  await otpService.requestOtp(email, purpose);
  res.json({ success: true, data: { message: 'OTP sent to your email.' } });
});

// POST /api/v1/auth/otp/verify
// Body: { email, code, purpose }
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code, purpose } = otpVerifySchema.parse(req.body);

  const lockout = loginLockout.context('customer', email, req.ip);
  await loginLockout.assertAvailable(lockout);
  try {
    await otpService.verifyOtp(email, code, purpose);
  } catch (error) {
    if (error.isAuthenticationFailure) {
      const result = await loginLockout.recordFailure(lockout);
      if (result.locked) throw loginLockout.lockedError(result.lockedUntil);
    }
    throw error;
  }
  await loginLockout.clear(lockout);

  let user = await prisma.user.findUnique({ where: { email } });
  const isNewUser = !user;

  if (!user) {
    user = await prisma.user.create({ data: { email } });
  }

  const token = signSession(user);
  res.cookie('bagiroo_session', token, sessionCookieOptions());

  // Fold anything added while browsing as a guest into the now-known user.
  await mergeGuestCartIntoUser(req, res, user.id);
  await mergeGuestWishlistIntoUser(req, res, user.id);

  res.json({
    success: true,
    data: { user: { id: user.id, phone: user.phone, name: user.name, email: user.email, role: user.role }, isNewUser, needsProfile: !user.name },
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('bagiroo_session', sessionCookieClearOptions());
  res.clearCookie('bagiroo_admin_session', sessionCookieClearOptions());
  res.json({ success: true, data: { message: 'Logged out.' } });
});

const me = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'Not authenticated.');
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new ApiError(401, 'Not authenticated.');
  res.json({
    success: true,
    data: { user: { id: user.id, phone: user.phone, name: user.name, email: user.email, role: user.role } },
  });
});

module.exports = { requestOtp, verifyOtp, logout, me };
