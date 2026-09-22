const { PrismaClient } = require('@prisma/client');

// Reuse a single client across hot reloads in dev to avoid exhausting
// MySQL connections.
const globalForPrisma = globalThis;

const prisma = globalForPrisma.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

module.exports = prisma;
