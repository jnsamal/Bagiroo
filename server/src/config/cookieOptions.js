const env = require('./env');

function baseCookieOptions() {
  return {
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
  };
}

function httpOnlyCookieOptions(maxAge) {
  return { ...baseCookieOptions(), httpOnly: true, ...(maxAge ? { maxAge } : {}) };
}

module.exports = { baseCookieOptions, httpOnlyCookieOptions };
