const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const sharp = require('sharp');
const { v2: cloudinary } = require('cloudinary');
const env = require('../config/env');

// Safe generated filenames (never trust the client's original filename),
// MIME + size validated below, per the spec's media-handling requirements.
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
// Cloudinary's free plan rejects images above 10 MiB. Keep a little headroom
// for provider-side metadata and multipart handling.
const CLOUDINARY_IMAGE_TARGET_BYTES = Math.floor(9.5 * 1024 * 1024);
if (env.mediaStorage === 'local') fs.mkdirSync(env.uploadDir, { recursive: true });
if (env.mediaStorage === 'cloudinary') cloudinary.config({ secure: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage: env.mediaStorage === 'cloudinary' ? multer.memoryStorage() : storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type.'));
    }
    cb(null, true);
  },
});

async function optimizeCloudinaryImage(file) {
  if (!file.mimetype.startsWith('image/') || file.buffer.length <= CLOUDINARY_IMAGE_TARGET_BYTES) return file;

  let width = 3000;
  for (const quality of [82, 72, 62, 52]) {
    const buffer = await sharp(file.buffer, { failOn: 'warning' })
      .rotate()
      .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 5 })
      .toBuffer();
    if (buffer.length <= CLOUDINARY_IMAGE_TARGET_BYTES) {
      return { ...file, buffer, mimetype: 'image/webp' };
    }
    width = Math.floor(width * 0.8);
  }
  throw new Error('Image could not be optimized below Cloudinary\'s 10 MB upload limit.');
}

async function uploadCloudinaryBuffer(file) {
  const preparedFile = await optimizeCloudinaryImage(file);
  const folder = preparedFile.mimetype.startsWith('video/') ? 'bagiroo/videos' : 'bagiroo/images';
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      resource_type: 'auto',
      folder,
      public_id: crypto.randomUUID(),
      overwrite: false,
    }, (error, result) => error ? reject(error) : resolve(result));
    stream.end(preparedFile.buffer);
  });
}

async function storeUploadedFile(file) {
  if (env.mediaStorage === 'local') {
    return { url: `/uploads/${file.filename}`, filename: file.filename, resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image' };
  }
  const result = await uploadCloudinaryBuffer(file);
  return { url: result.secure_url, filename: result.public_id, publicId: result.public_id, resourceType: result.resource_type };
}

function cloudinaryIdentity(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'res.cloudinary.com') return null;
    const match = parsed.pathname.match(/^\/[^/]+\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return null;
    const resourceType = match[1];
    const publicId = resourceType === 'raw' ? match[2] : match[2].replace(/\.[^/.]+$/, '');
    return { publicId: decodeURIComponent(publicId), resourceType };
  } catch {
    return null;
  }
}

async function deleteStoredMedia(url) {
  const identity = cloudinaryIdentity(url);
  if (!identity) return false;
  await cloudinary.uploader.destroy(identity.publicId, { resource_type: identity.resourceType, invalidate: true });
  return true;
}

module.exports = { upload, storeUploadedFile, deleteStoredMedia, cloudinaryIdentity, optimizeCloudinaryImage };
