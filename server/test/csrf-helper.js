async function createCsrfContext(base) {
  const response = await fetch(`${base}/csrf`);
  const body = await response.json();
  const cookie = response.headers.get('set-cookie').split(';')[0];
  return {
    token: body.data.csrfToken,
    cookie,
    headers(extra = {}, sessionCookie = '') {
      return {
        ...extra,
        'X-CSRF-Token': body.data.csrfToken,
        Cookie: [cookie, sessionCookie].filter(Boolean).join('; '),
      };
    },
  };
}

module.exports = { createCsrfContext };
