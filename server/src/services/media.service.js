const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const env = require('../config/env');

// Safe generated filenames (never trust the client's original filename),
// MIME + size validated below, per the spec's media-handling requirements.
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
fs.mkdirSync(env.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type.'));
    }
    cb(null, true);
  },
});

module.exports = { upload };
