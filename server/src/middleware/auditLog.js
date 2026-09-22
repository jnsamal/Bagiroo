const prisma = require('../config/prismaClient');

// Lightweight audit trail for sensitive admin writes, per the spec.
// Applied selectively (not on every GET) — see admin.routes.js for where
// it's used. Never blocks the response on a logging failure.
function auditLog(action, entityType) {
  return async (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        prisma.auditLog
          .create({
            data: {
              userId: req.user?.id,
              action,
              entityType,
              entityId: req.params.id || null,
              metadata: { body: req.body, method: req.method, path: req.originalUrl },
            },
          })
          .catch(() => {}); // best-effort — never fail the request over logging
      }
    });
    next();
  };
}

module.exports = { auditLog };
