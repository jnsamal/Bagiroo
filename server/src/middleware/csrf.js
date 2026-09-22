const crypto = require('node:crypto');
const env = require('../config/env');
const { httpOnlyCookieOptions } = require('../config/cookieOptions');
const { ApiError } = require('./errorHandler');

const COOKIE_NAME = 'bagiroo_csrf';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function signature(nonce) {
  return crypto.createHmac('sha256', env.cookieSecret).update(nonce).digest('base64url');
}

function createToken() {
  const nonce = crypto.randomBytes(32).toString('base64url');
  return `${nonce}.${signature(nonce)}`;
}

function validToken(token) {
  if (typeof token !== 'string') return false;
  const separator = token.indexOf('.');
  if (separator < 1) return false;
  const nonce = token.slice(0, separator);
  const supplied = Buffer.from(token.slice(separator + 1));
  const expected = Buffer.from(signature(nonce));
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

const cookieOptions = {
  ...httpOnlyCookieOptions(2 * 60 * 60 * 1000),
  // Keep the strongest local/same-site policy. A direct Netlify -> Render
  // deployment explicitly opts into cross-site cookies with "none".
  sameSite: env.cookieSameSite === 'none' ? 'none' : 'strict',
};

function issueCsrfToken(req, res) {
  const existing = req.cookies?.[COOKIE_NAME];
  const token = validToken(existing) ? existing : createToken();
  res.cookie(COOKIE_NAME, token, cookieOptions);
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, data: { csrfToken: token } });
}

function protectCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const cookieToken = req.cookies?.[COOKIE_NAME];
  const headerToken = req.get('X-CSRF-Token');
  const sameToken = typeof cookieToken === 'string' && typeof headerToken === 'string'
    && cookieToken.length === headerToken.length
    && crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
  if (!sameToken || !validToken(cookieToken)) return next(new ApiError(403, 'Invalid or missing CSRF token. Refresh the page and try again.'));
  next();
}

module.exports = { COOKIE_NAME, issueCsrfToken, protectCsrf };
