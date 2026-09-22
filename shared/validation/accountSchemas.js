const { z } = require('zod');
const { addressSchema } = require('./orderSchemas');

const updateAccountSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
});

module.exports = { updateAccountSchema, addressSchema };
