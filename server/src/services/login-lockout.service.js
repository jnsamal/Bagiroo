const crypto = require('node:crypto');
const prisma = require('../config/prismaClient');
const { ApiError } = require('../middleware/errorHandler');

const MAX_FAILURES = 6;
const LOCK_HOURS = 6;

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function context(kind, accountIdentifier, ipAddress) {
  const account = String(accountIdentifier || '').trim().toLowerCase();
  const ip = String(ipAddress || 'unknown').trim().toLowerCase();
  return {
    keys: [digest(`${kind}:account:${account}`), digest(`${kind}:ip:${ip}`)],
  };
}

function lockedError(lockedUntil) {
  return new ApiError(429, 'Too many failed login attempts. This login is temporarily locked for 6 hours.', {
    lockedUntil: lockedUntil.toISOString(),
  });
}

async function assertAvailable(lockoutContext) {
  const now = new Date();
  const record = await prisma.authLockout.findFirst({
    where: { lockKey: { in: lockoutContext.keys }, lockedUntil: { gt: now } },
    orderBy: { lockedUntil: 'desc' },
  });
  if (record) throw lockedError(record.lockedUntil);
}

async function recordFailure(lockoutContext) {
  const now = new Date();
  const newLockedUntil = new Date(now.getTime() + LOCK_HOURS * 60 * 60 * 1000);
  const records = await prisma.$transaction(async tx => {
    const updated = [];
    for (const lockKey of lockoutContext.keys) {
      const existing = await tx.authLockout.findUnique({ where: { lockKey } });
      if (existing?.lockedUntil && existing.lockedUntil > now) {
        updated.push(existing);
        continue;
      }

      const failureCount = existing && !existing.lockedUntil
        ? existing.failureCount + 1
        : 1;
      const data = {
        failureCount,
        lockedUntil: failureCount >= MAX_FAILURES ? newLockedUntil : null,
      };
      updated.push(existing
        ? await tx.authLockout.update({ where: { lockKey }, data })
        : await tx.authLockout.create({ data: { lockKey, ...data } }));
    }
    return updated;
  }, { isolationLevel: 'Serializable' });
  const activeLocks = records.filter(record => record.lockedUntil && record.lockedUntil > now);
  return {
    locked: activeLocks.length > 0,
    lockedUntil: activeLocks.reduce((latest, record) => !latest || record.lockedUntil > latest ? record.lockedUntil : latest, null),
  };
}

async function clear(lockoutContext) {
  await prisma.authLockout.deleteMany({ where: { lockKey: { in: lockoutContext.keys } } });
}

module.exports = { MAX_FAILURES, LOCK_HOURS, context, assertAvailable, recordFailure, clear, lockedError };
