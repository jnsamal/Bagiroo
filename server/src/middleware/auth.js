const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');
const env = require('../config/env');

// Reads the httpOnly "bagiroo_session" cookie set at login/register.
function requireAuth(req, res, next) {
  const token = req.cookies?.bagiroo_session;
  if (!token) return next(new ApiError(401, 'Not authenticated.'));

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = payload; // { id, phone, role }
    next();
  } catch (err) {
    next(new ApiError(401, 'Session expired or invalid.'));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated.'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Not authorized for this action.'));
    }
    next();
  };
}

// Populates req.user if a valid session cookie exists, but never rejects —
// used on public routes that behave differently for logged-in users
// (e.g. merging guest cart).
function attachUserIfPresent(req, res, next) {
  const token = req.cookies?.bagiroo_session;
  if (!token) return next();
  try {
    req.user = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    // ignore invalid/expired token on optional routes
  }
  next();
}

module.exports = { requireAuth, requireRole, attachUserIfPresent };
