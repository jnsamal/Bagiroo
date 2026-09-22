const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { httpOnlyCookieOptions } = require('../config/cookieOptions');

function signSession(user) {
  return jwt.sign(
    { id: user.id, phone: user.phone, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

// SameSite + httpOnly + secure(prod) cookie, per the security requirements.
function sessionCookieOptions() {
  return httpOnlyCookieOptions(7 * 24 * 60 * 60 * 1000);
}

function sessionCookieClearOptions() {
  const { maxAge, ...options } = sessionCookieOptions();
  return options;
}

module.exports = { signSession, sessionCookieOptions, sessionCookieClearOptions };
