require('dotenv').config();

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const { PrismaClient } = require('@prisma/client');
const env = require('../src/config/env');

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');
const confirmed = process.argv.includes('--confirm');
const reportDir = path.resolve(__dirname, '../output');

function parseCloudinaryUrl(value) {
  if (!value) throw new Error('CLOUDINARY_URL is missing. Add the client Cloudinary API environment variable to server/.env.');
  const match = value.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^/?#]+)$/);
  if (!match) throw new Error('CLOUDINARY_URL must use cloudinary://API_KEY:API_SECRET@CLOUD_NAME format.');
  return { apiKey: match[1], apiSecret: match[2], cloudName: match[3] };
}

const target = parseCloudinaryUrl(env.cloudinaryUrl);
cloudinary.config({ cloud_name: target.cloudName, api_key: target.apiKey, api_secret: target.apiSecret, secure: true });

function isTargetCloudinaryUrl(value) {
  if (!value || typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return parsed.hostname === 'res.cloudinary.com' && parsed.pathname.split('/')[1] === target.cloudName;
  } catch {
    return false;
  }
}

function localPathFor(value) {
  if (!value?.startsWith('/uploads/')) return null;
  const resolved = path.resolve(env.uploadDir, value.slice('/uploads/'.length));
  const root = `${path.resolve(env.uploadDir)}${path.sep}`;
  if (!resolved.startsWith(root)) throw new Error(`Unsafe local upload path: ${value}`);
  return resolved;
}

function resourceTypeFor(value, hints) {
  if (hints.has('video')) return 'video';
  try {
    const parsed = new URL(value);
    if (/\/video\/upload\//.test(parsed.pathname)) return 'video';
  } catch { /* Local URL. */ }
  return /\.(mp4|mov|webm)(?:$|[?#])/i.test(value) ? 'video' : 'image';
}

function addReference(map, value, hint = 'image') {
  if (!value || typeof value !== 'string') return;
  if (!value.startsWith('/uploads/') && !/^https?:\/\//i.test(value)) return;
  if (!map.has(value)) map.set(value, new Set());
  map.get(value).add(hint);
}

async function collectMedia() {
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

  const result = new Map();
  media.forEach(item => addReference(result, item.url));
  variations.forEach(item => addReference(result, item.imageUrl));
  categories.forEach(item => addReference(result, item.imageUrl));
  collections.forEach(item => addReference(result, item.imageUrl));
  videos.forEach(item => {
    addReference(result, item.url, 'video');
    addReference(result, item.posterUrl);
  });
  testimonials.forEach(item => addReference(result, item.avatarUrl));
  instagram.forEach(item => addReference(result, item.imageUrl));

  if (websiteSetting) {
    try {
      const website = JSON.parse(websiteSetting.value);
      addReference(result, website.logoUrl);
      addReference(result, website.heroImage);
      if (Array.isArray(website.heroSlides)) {
        website.heroSlides.forEach(slide => addReference(result, slide?.url, slide?.type === 'video' ? 'video' : 'image'));
      }
    } catch {
      throw new Error('The website_config setting is not valid JSON. Fix it before migrating media.');
    }
  }
  return result;
}

async function replaceWebsiteUrl(oldUrl, newUrl) {
  const setting = await prisma.siteSetting.findUnique({ where: { key: 'website_config' } });
  if (!setting) return;
  const website = JSON.parse(setting.value);
  let changed = false;
  for (const key of ['logoUrl', 'heroImage']) {
    if (website[key] === oldUrl) {
      website[key] = newUrl;
      changed = true;
    }
  }
  if (Array.isArray(website.heroSlides)) {
    website.heroSlides = website.heroSlides.map(slide => {
      if (slide?.url !== oldUrl) return slide;
      changed = true;
      return { ...slide, url: newUrl };
    });
  }
  if (changed) {
    await prisma.siteSetting.update({ where: { key: 'website_config' }, data: { value: JSON.stringify(website) } });
  }
}

async function replaceDatabaseUrl(oldUrl, newUrl) {
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
  await replaceWebsiteUrl(oldUrl, newUrl);
}

async function uploadAsset(sourceUrl, hints) {
  const resourceType = resourceTypeFor(sourceUrl, hints);
  const localPath = localPathFor(sourceUrl);
  if (localPath && !fs.existsSync(localPath)) throw new Error(`Local file does not exist: ${sourceUrl}`);
  const hash = crypto.createHash('sha256').update(sourceUrl).digest('hex');
  const publicId = `bagiroo/migrated/${resourceType}/${hash}`;
  return cloudinary.uploader.upload(localPath || sourceUrl, {
    resource_type: resourceType,
    public_id: publicId,
    overwrite: true,
    invalidate: true,
  });
}

async function writeReport(report) {
  fs.mkdirSync(reportDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `cloudinary-account-migration-${stamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  return reportPath;
}

async function main() {
  if (!dryRun && !confirmed) {
    throw new Error('Run with --dry-run first. When the list is correct, run again with --confirm.');
  }

  const media = await collectMedia();
  const pending = [...media.entries()].filter(([url]) => !isTargetCloudinaryUrl(url));
  const skipped = [...media.keys()].filter(isTargetCloudinaryUrl);
  console.log(`[cloudinary] Client cloud: ${target.cloudName}`);
  console.log(`[cloudinary] Found ${media.size} referenced media assets: ${pending.length} to migrate, ${skipped.length} already in the client cloud.`);

  if (dryRun) {
    pending.forEach(([url, hints], index) => console.log(`[dry-run] ${index + 1}. ${[...hints].join('/')} ${url}`));
    console.log('[dry-run] No uploads or database changes were made.');
    return;
  }

  const report = {
    startedAt: new Date().toISOString(),
    targetCloud: target.cloudName,
    migrated: [],
    skipped,
    failed: [],
  };

  for (const [index, [oldUrl, hints]] of pending.entries()) {
    try {
      const uploaded = await uploadAsset(oldUrl, hints);
      await replaceDatabaseUrl(oldUrl, uploaded.secure_url);
      report.migrated.push({ oldUrl, newUrl: uploaded.secure_url, publicId: uploaded.public_id, resourceType: uploaded.resource_type });
      console.log(`[cloudinary] Migrated ${index + 1}/${pending.length}: ${oldUrl}`);
    } catch (error) {
      report.failed.push({ oldUrl, error: error.message });
      console.error(`[cloudinary] Failed ${index + 1}/${pending.length}: ${oldUrl}\n  ${error.message}`);
    }
  }

  report.finishedAt = new Date().toISOString();
  const reportPath = await writeReport(report);
  console.log(`[cloudinary] Complete: ${report.migrated.length} migrated, ${report.failed.length} failed.`);
  console.log(`[cloudinary] Report: ${reportPath}`);
  if (report.failed.length) process.exitCode = 1;
}

main()
  .catch(error => {
    console.error(`[cloudinary] ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
