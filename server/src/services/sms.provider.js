// SMS/OTP provider adapter interface. Swap the implementation here (MSG91,
// Twilio Verify, etc.) without touching auth.controller.js or otp.service.js.
//
// Every adapter must expose: async sendOtp(phone, code) -> Promise<void>

const env = require('../config/env');

const consoleAdapter = {
  async sendOtp(phone, code) {
    // Dev-only stub: prints the OTP instead of sending a real SMS.
    // eslint-disable-next-line no-console
    console.log(`[sms:console] OTP for ${phone}: ${code}`);
  },
};

// TODO: implement real adapters once a provider is chosen, e.g.:
// const msg91Adapter = { async sendOtp(phone, code) { ...call MSG91 API... } };

const adapters = {
  console: consoleAdapter,
  // msg91: msg91Adapter,
};

module.exports = adapters[env.smsProvider] || consoleAdapter;
