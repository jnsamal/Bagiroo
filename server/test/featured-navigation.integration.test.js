const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = require('../src/config/prismaClient');
const app = require('../src/app');

test('featured navigation links to the featured collection and lists its published products', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  try {
    const [navigationResponse, settingsResponse, collectionResponse, collection] = await Promise.all([
      fetch(`${base}/navigation`).then(response => response.json()),
      fetch(`${base}/settings/public`).then(response => response.json()),
      fetch(`${base}/collections/featured-collection`).then(response => response.json()),
      prisma.collection.findUnique({
        where: { slug: 'featured-collection' },
        include: { products: { where: { product: { isPublished: true, deletedAt: null } }, include: { product: true } } },
      }),
    ]);

    const featuredLink = settingsResponse.data.website.navigation.find(item => item.key === 'featured-collections');
    assert.equal(featuredLink.to, '/collections/featured-collection');
    assert.equal(featuredLink.megaMenu, true);

    const expectedSlugs = (collection?.products || []).map(entry => entry.product.slug).sort();
    const menuSlugs = navigationResponse.data['featured-collections'].map(item => item.slug).sort();
    assert.deepEqual(menuSlugs, expectedSlugs);
    assert(navigationResponse.data['featured-collections'].every(item => item.to === `/product/${item.slug}`));
    assert(collectionResponse.data.products.every(product => product.isPublished && product.deletedAt === null));
  } finally {
    await new Promise(resolve => server.close(resolve));
    await prisma.$disconnect();
  }
});
