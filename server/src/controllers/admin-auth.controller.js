const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/prismaClient');
const env = require('../config/env');
const { sessionCookieOptions, sessionCookieClearOptions } = require('../services/jwt.service');
const { ApiError } = require('../middleware/errorHandler');
const asyncHandler = require('../middleware/asyncHandler');
const loginLockout = require('../services/login-lockout.service');
const dummyHash = bcrypt.hashSync('unavailable-account-placeholder', 12);
const login = asyncHandler(async (req, res) => {
  const { loginId, password } = z.object({ loginId: z.string().trim().min(1).max(100), password: z.string().min(1).max(72) }).parse(req.body);
  const lockout = loginLockout.context('admin', loginId, req.ip);
  await loginLockout.assertAvailable(lockout);
  const user = await prisma.user.findUnique({ where: { loginId } });
  const valid = await bcrypt.compare(password, user?.passwordHash || dummyHash);
  if (!valid || !user?.passwordHash || !user.isActive || user.deletedAt || !['ADMIN', 'STAFF'].includes(user.role)) {
    const result = await loginLockout.recordFailure(lockout);
    if (result.locked) throw loginLockout.lockedError(result.lockedUntil);
    throw new ApiError(401, 'Incorrect login ID or password.');
  }
  await loginLockout.clear(lockout);
  const token = jwt.sign({ id: user.id, role: user.role, method: 'admin-password', version: user.adminSessionVersion }, env.jwtSecret, { expiresIn: '8h' });
  res.cookie('bagiroo_admin_session', token, { ...sessionCookieOptions(), maxAge: 8 * 60 * 60 * 1000 });
  res.json({ success: true, data: { user: { id: user.id, loginId: user.loginId, name: user.name, role: user.role } } });
});
const requireAdminAuth = asyncHandler(async (req, res, next) => {
  let payload;
  try { payload = jwt.verify(req.cookies?.bagiroo_admin_session || '', env.jwtSecret); } catch { throw new ApiError(401, 'Please sign in to the admin portal.'); }
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (payload.method !== 'admin-password' || !user?.passwordHash || payload.version !== user.adminSessionVersion || !user.isActive || user.deletedAt || !['ADMIN', 'STAFF'].includes(user.role)) throw new ApiError(401, 'Admin session expired. Please sign in again.');
  req.user = { id: user.id, role: user.role, loginId: user.loginId, name: user.name };
  next();
});
const me = (req, res) => res.json({ success: true, data: { user: req.user } });
const logout = (req, res) => { res.clearCookie('bagiroo_admin_session', sessionCookieClearOptions()); res.json({ success: true, data: { message: 'Signed out.' } }); };
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, password } = z.object({ currentPassword: z.string().min(1).max(72), password: z.string().min(12).max(72) }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!await bcrypt.compare(currentPassword, user.passwordHash)) throw new ApiError(400, 'Current password is incorrect.');
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 12), adminSessionVersion: { increment: 1 } } });
  logout(req, res);
});
module.exports = { login, requireAdminAuth, me, logout, changePassword };
