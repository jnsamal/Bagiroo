require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const manifest = require('./image-manifest.json');
const prisma = new PrismaClient();

async function main() {
  const variations = await prisma.productVariation.findMany();
  let assigned = 0;
  for (const variation of variations) {
    const urls = (manifest[variation.sku] || []).map((image) => image.url);
    if (!urls.length) continue;
    const result = await prisma.productMedia.updateMany({ where: { productId: variation.productId, variationId: null, url: { in: urls } }, data: { variationId: variation.id } });
    assigned += result.count;
  }
  console.log(`Assigned ${assigned} existing images to their catalogue colours.`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
