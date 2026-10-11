const { z } = require('zod');
const { phoneNumber } = require('./authSchemas');

const updateAccountSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: phoneNumber.optional(),
});

module.exports = { updateAccountSchema };
