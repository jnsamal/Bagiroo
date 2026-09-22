const prisma = require('../config/prismaClient');
const otpService = require('../services/otp.service');
const { signSession, sessionCookieOptions, sessionCookieClearOptions } = require('../services/jwt.service');
const { mergeGuestCartIntoUser } = require('../services/cart.service');
const { mergeGuestWishlistIntoUser } = require('../services/wishlist.service');
const { ApiError } = require('../middleware/errorHandler');
const asyncHandler = require('../middleware/asyncHandler');
const { phoneSchema, otpVerifySchema } = require('../../../shared/validation/authSchemas');
const loginLockout = require('../services/login-lockout.service');

// POST /api/v1/auth/otp/request
// Body: { phone, purpose: 'LOGIN' | 'REGISTER' }
const requestOtp = asyncHandler(async (req, res) => {
  const { phone, purpose } = phoneSchema.parse(req.body);

  await otpService.requestOtp(phone, purpose);
  res.json({ success: true, data: { message: 'OTP sent.' } });
});

// POST /api/v1/auth/otp/verify
// Body: { phone, code, purpose, name? }
const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, code, purpose, name } = otpVerifySchema.parse(req.body);

  const lockout = loginLockout.context('customer', phone, req.ip);
  await loginLockout.assertAvailable(lockout);
  try {
    await otpService.verifyOtp(phone, code, purpose);
  } catch (error) {
    if (error.isAuthenticationFailure) {
      const result = await loginLockout.recordFailure(lockout);
      if (result.locked) throw loginLockout.lockedError(result.lockedUntil);
    }
    throw error;
  }
  await loginLockout.clear(lockout);

  let user = await prisma.user.findUnique({ where: { phone } });
  const isNewUser = !user;

  if (!user) {
    user = await prisma.user.create({ data: { phone, name } });
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
