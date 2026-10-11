require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v2: cloudinary } = require('cloudinary');
const { PrismaClient } = require('@prisma/client');
const env = require('../src/config/env');
const { optimizeCloudinaryImage } = require('../src/services/media.service');

if (env.mediaStorage !== 'cloudinary') throw new Error('Set MEDIA_STORAGE=cloudinary before running this migration.');
cloudinary.config({ secure: true });
const prisma = new PrismaClient();

function localPathFor(url) {
  if (!url?.startsWith('/uploads/')) return null;
  const resolved = path.resolve(env.uploadDir, url.slice('/uploads/'.length));
  const root = path.resolve(env.uploadDir) + path.sep;
  if (!resolved.startsWith(root)) throw new Error(`Unsafe upload path: ${url}`);
  return resolved;
}

async function collectUrls() {
  const [media, variations, categories, collections, videos, testimonials, instagram, websiteSetting] = await Promise.all([
    prisma.productMedia.findMany({ select: { url: true } }),
    prisma.productVariation.findMany({ select: { imageUrl: true } }),
    prisma.category.findMany({ select: { imageUrl: true } }),
    prisma.collection.findMany({ select: { imageUrl: true } }),
    prisma.productVideo.findMany({ select: { url: true, posterUrl: true } }),
    prisma.testimonial.findMany({ select: { avatarUrl: true } }),
    prisma.instagramPost.findMany({ select: { imageUrl: true } }),
    prisma.siteSetting.findUnique({ where: { key: 'website_config' } }),
  ]);
  const urls = [
    ...media.map(item => item.url), ...variations.map(item => item.imageUrl),
    ...categories.map(item => item.imageUrl), ...collections.map(item => item.imageUrl),
    ...videos.flatMap(item => [item.url, item.posterUrl]),
    ...testimonials.map(item => item.avatarUrl), ...instagram.map(item => item.imageUrl),
  ];
  if (websiteSetting) {
    try {
      const website = JSON.parse(websiteSetting.value);
      urls.push(website.logoUrl, website.heroImage);
    } catch { /* Invalid settings are already handled by website.service defaults. */ }
  }
  return [...new Set(urls.filter(url => url?.startsWith('/uploads/')))];
}

async function replaceUrl(oldUrl, newUrl) {
  await prisma.$transaction([
    prisma.productMedia.updateMany({ where: { url: oldUrl }, data: { url: newUrl } }),
    prisma.productVariation.updateMany({ where: { imageUrl: oldUrl }, data: { imageUrl: newUrl } }),
    prisma.category.updateMany({ where: { imageUrl: oldUrl }, data: { imageUrl: newUrl } }),
    prisma.collection.updateMany({ where: { imageUrl: oldUrl }, data: { imageUrl: newUrl } }),
    prisma.productVideo.updateMany({ where: { url: oldUrl }, data: { url: newUrl } }),
    prisma.productVideo.updateMany({ where: { posterUrl: oldUrl }, data: { posterUrl: newUrl } }),
    prisma.testimonial.updateMany({ where: { avatarUrl: oldUrl }, data: { avatarUrl: newUrl } }),
    prisma.instagramPost.updateMany({ where: { imageUrl: oldUrl }, data: { imageUrl: newUrl } }),
  ]);
  const setting = await prisma.siteSetting.findUnique({ where: { key: 'website_config' } });
  if (!setting) return;
  try {
    const website = JSON.parse(setting.value);
    let changed = false;
    for (const key of ['logoUrl', 'heroImage']) {
      if (website[key] === oldUrl) { website[key] = newUrl; changed = true; }
    }
    if (changed) await prisma.siteSetting.update({ where: { key: 'website_config' }, data: { value: JSON.stringify(website) } });
  } catch { /* Leave malformed settings untouched. */ }
}

async function main() {
  const urls = await collectUrls();
  console.log(`[cloudinary] Found ${urls.length} unique local media files to migrate.`);
  for (const [index, oldUrl] of urls.entries()) {
    const filePath = localPathFor(oldUrl);
    if (!fs.existsSync(filePath)) throw new Error(`Missing local media file: ${oldUrl}`);
    const isVideo = /\.(mp4|mov|webm)$/i.test(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
    const publicId = crypto.createHash('sha256').update(oldUrl).digest('hex');
    const options = {
        resource_type: isVideo ? 'video' : 'image',
        folder: isVideo ? 'bagiroo/legacy/videos' : 'bagiroo/legacy/images',
        public_id: publicId,
        overwrite: true,
      };
    let uploaded;
    if (isVideo) {
      uploaded = await cloudinary.uploader.upload(filePath, options);
    } else {
      const originalBuffer = fs.readFileSync(filePath);
      const prepared = await optimizeCloudinaryImage({ buffer: originalBuffer, mimetype: mimeTypes[extension] || 'image/jpeg' });
      if (prepared.buffer !== originalBuffer) {
        console.log(`[cloudinary] Optimized oversized image before upload: ${oldUrl}`);
      }
      uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => error ? reject(error) : resolve(result));
        stream.end(prepared.buffer);
      });
    }
    await replaceUrl(oldUrl, uploaded.secure_url);
    console.log(`[cloudinary] Migrated ${index + 1}/${urls.length}: ${oldUrl}`);
  }
  console.log('[cloudinary] Media migration complete. Verify the storefront before removing local uploads.');
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
