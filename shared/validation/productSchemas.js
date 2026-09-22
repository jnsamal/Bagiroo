const { z } = require('zod');

const boolFromQuery = z
  .union([z.literal('true'), z.literal('false')])
  .transform((v) => v === 'true')
  .optional();

const productQuerySchema = z.object({
  category: z.string().optional(),
  slugs: z.string().max(2400).transform((value) => value.split(',').filter(Boolean)).refine((value) => value.length <= 12, 'At most 12 products may be requested.').optional(),
  collection: z.string().optional(),
  sort: z.enum(['latest', 'price_asc', 'price_desc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(48).optional(),
  q: z.string().optional(),
  bestSeller: boolFromQuery,
  newArrival: boolFromQuery,
});

module.exports = { productQuerySchema };
