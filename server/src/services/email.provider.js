const env = require('../config/env');

function otpEmailHtml(code) {
  return `<div style="font-family:Arial,sans-serif;color:#111"><h2>Bagiroo &amp; Co.</h2><p>Use this code to sign in:</p><p style="font-size:30px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in ${env.otpExpiresInMinutes} minutes. If you did not request it, you can ignore this email.</p></div>`;
}

async function providerError(response, providerName) {
  const body = await response.text();
  // Keep provider diagnostics in server logs; they can contain infrastructure
  // details such as an API allowlisted IP and should not be rendered publicly.
  console.error(`[email:${providerName.toLowerCase()}] ${response.status}: ${body.slice(0, 500)}`);
  if (providerName === 'Brevo' && response.status === 401) {
    throw new Error('The email service is not authorized from this server. Please try again later.');
  }
  throw new Error(`${providerName} rejected the OTP message (${response.status}): ${body.slice(0, 300)}`);
}

const consoleAdapter = {
  async sendOtp(email, code) {
    // Development adapter: keep local authentication usable without an
    // external email account while never returning the code to the browser.
    // eslint-disable-next-line no-console
    console.log(`[email:console] OTP for ${email}: ${code}`);
  },
};

const resendAdapter = {
  async sendOtp(email, code) {
    if (!env.resendApiKey) throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend.');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.resendApiKey}` },
      body: JSON.stringify({
        from: env.emailFrom,
        to: [email],
        subject: 'Your Bagiroo & Co. login code',
        html: otpEmailHtml(code),
      }),
    });
    if (!response.ok) await providerError(response, 'Resend');
  },
};

const brevoAdapter = {
  async sendOtp(email, code) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': env.brevoApiKey,
      },
      body: JSON.stringify({
        sender: { name: env.emailFromName, email: env.emailFromAddress },
        to: [{ email }],
        subject: 'Your Bagiroo & Co. login code',
        htmlContent: otpEmailHtml(code),
      }),
    });
    if (!response.ok) await providerError(response, 'Brevo');
  },
};

const adapters = { console: consoleAdapter, resend: resendAdapter, brevo: brevoAdapter };
module.exports = adapters[env.emailProvider];
