// Development seed data -- rewritten to use the client's real WooCommerce
// export (woocommerce_bags_catalogue.xlsx) and real product photography
// (Website.zip, copied into /uploads/products by a one-off script and
// mapped here via image-manifest.json). Titles, SKUs, prices, categories
// and descriptions below are taken directly from that spreadsheet -- NOT
// invented. See docs/known-limitations.md for the couple of fields (e.g.
// generic 100x100x100cm dimensions applied to every product) that look
// like placeholder values in the source sheet itself.

const { PrismaClient } = require('@prisma/client');
const imageManifest = require('./image-manifest.json');
const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Totes', slug: 'totes', imageUrl: '/uploads/categories/totes.png' },
  { name: 'Crossbody Bags', slug: 'crossbody-bags', imageUrl: '/uploads/categories/crossbody-bags.png' },
  { name: 'Shoulder Bags', slug: 'shoulder-bags', imageUrl: '/uploads/categories/shoulder-bags.png' },
  { name: 'Handbags', slug: 'handbags', imageUrl: '/uploads/categories/handbags.png' },
];

// Regular/sale price from the sheet applies uniformly: Rs 4,999 regular,
// Rs 3,999 sale -- so priceMinor (what the customer pays) is the sale
// price, compareAtMinor (struck through) is the regular price.
const SALE_PRICE_MINOR = 399900;
const REGULAR_PRICE_MINOR = 499900;
const STOCK_QTY = 100;
// The sheet applies these same weight/dimension values to every single
// product and variation -- almost certainly a placeholder pending real
// measurements, but it's what the client's sheet says, so it's seeded
// as-is rather than guessed at differently.
const WEIGHT_GRAMS = 500;
const DIMENSIONS = 'L100 x W100 x H100 cm';

const PRODUCTS = [
  {
    title: 'Wave Scalloped Crossbody Bag',
    slug: 'wave-scalloped-crossbody-bag',
    parentSku: 'CB-WAVE',
    category: 'crossbody-bags',
    shortDescription: 'Scalloped-flap crossbody bag with a long adjustable strap.',
    description:
      'A compact flap bag with a distinctive wave/scalloped edge and gold-tone hardware. The long, thin adjustable strap can be worn crossbody or on the shoulder, making this a versatile going-out bag that layers easily over any outfit.',
    variations: [
      { sku: 'CB-WAVE-BLK', colorName: 'Black', colorHex: '#171716' },
      { sku: 'CB-WAVE-ORG', colorName: 'Orange', colorHex: '#D96A2B' },
      { sku: 'CB-WAVE-PGR', colorName: 'Parrot Green', colorHex: '#8BC34A' },
    ],
  },
  {
    title: 'Circled Round-Handle Handbag',
    slug: 'circled-round-handle-handbag',
    parentSku: 'HB-CIRC',
    category: 'handbags',
    shortDescription: 'Structured handbag with a signature round cut-out handle and ribbed quilted body.',
    description:
      'A compact, structured handbag built around a bold circular cut-out top handle and a ribbed/quilted body. A zip-top closure keeps contents secure, and a detachable, adjustable strap lets it convert between handheld and crossbody/shoulder carry. Smart, compact and versatile for everyday use.',
    variations: [
      { sku: 'HB-CIRC-BLK', colorName: 'Black', colorHex: '#171716' },
      { sku: 'HB-CIRC-PUR', colorName: 'Purple', colorHex: '#7C5295' },
    ],
  },
  {
    title: 'Colour Block Tote Bag',
    slug: 'colour-block-tote-bag',
    parentSku: 'TB-BLOCK',
    category: 'totes',
    shortDescription: 'Colour-block tote with tall dual shoulder handles and a wide open top.',
    description:
      "A wide, open-top tote in a black colour-block design with a contrasting centre panel and tall dual shoulder handles with buckle detailing. Roomy and unstructured, it's built for everyday and work use, and comes in two colour-block combinations.",
    variations: [
      { sku: 'TB-BLOCK-BLU', colorName: 'Blue Block', colorHex: '#6E8CAE' },
      { sku: 'TB-BLOCK-PNK', colorName: 'Pink Block', colorHex: '#E7B8BE' },
    ],
  },
  {
    title: 'Frido Kahlo Canvas Tote Bag',
    slug: 'frido-kahlo-canvas-tote-bag',
    parentSku: 'TB-FRIDO',
    category: 'totes',
    shortDescription: 'Structured canvas-and-leather tote with bold embroidered branding.',
    description:
      'A structured canvas tote with contrasting leather trim, rolled top handles and bold embroidered script branding across the front. A wide, open top and roomy interior make it a practical daily or work tote, finished with a matching leather tag.',
    variations: [
      { sku: 'TB-FRIDO-BLK', colorName: 'Black', colorHex: '#171716' },
      { sku: 'TB-FRIDO-CRM', colorName: 'Creme', colorHex: '#EFE4D0' },
    ],
  },
  {
    title: 'V-Shaped Ribbed Shoulder Bag',
    slug: 'v-shaped-ribbed-shoulder-bag',
    parentSku: 'SB-VSHP',
    category: 'shoulder-bags',
    shortDescription: 'Ribbed shoulder bag with a distinctive V-shaped top opening and double comfort handles.',
    description:
      'A structured shoulder bag with a signature V-shaped top opening, ribbed/quilted body and contrast trim. Comfortable double shoulder handles and a roomy interior make it an easy everyday carry, and the bag ships with a coordinating scarf/bow accent for extra styling.',
    variations: [
      { sku: 'SB-VSHP-CHR', colorName: 'Cherry', colorHex: '#5C1A24' },
      { sku: 'SB-VSHP-WHT', colorName: 'White', colorHex: '#F5F1EA' },
    ],
  },
  {
    title: 'Classic Structured Tote Bag',
    slug: 'classic-structured-tote-bag',
    parentSku: 'TB-CLASSIC-BLK',
    category: 'totes',
    shortDescription: 'Structured canvas tote with brown leather trim and a bonus crossbody strap.',
    description:
      'A structured tote in black canvas with contrasting brown leather trim, rolled top handles and an embroidered logo emblem on the front panel. A long, detachable strap is included so the bag can also be carried crossbody. Practical corner leather guards and a wide base keep it steady as an everyday or work tote.',
    variations: [],
  },
  {
    title: 'Structured Twist-Lock Handbag',
    slug: 'structured-twist-lock-handbag',
    parentSku: 'HB-LOCK-BLK',
    category: 'handbags',
    shortDescription: 'Compact structured box handbag with a gold-tone twist-lock closure and detachable strap.',
    description:
      'A structured, box-style handbag in black with a polished gold-tone twist-lock clasp on the flap. Carries by its curved top handle or via the included detachable, adjustable shoulder strap. Opens to a spacious lined interior that fits daily essentials (phone, cardholder, cosmetics), making it equally suited to daytime errands and evening wear.',
    variations: [],
  },
  {
    title: 'Brown Wing Tote Bag',
    slug: 'brown-wing-tote-bag',
    parentSku: 'TB-BROWN',
    category: 'totes',
    shortDescription: 'Wing-sided structured tote with a flap-over front panel.',
    description:
      'A structured, wing-sided tote in brown with a flap-over front panel and rolled double top handles. The wide, tapered silhouette gives it a clean, minimal profile while keeping a roomy interior for daily carry.',
    variations: [],
  },
];

// Matches the earlier (pre-real-data) homepage behaviour, which the Phase 1
// audit flagged: Best Sellers and New Arrivals both show this same set of
// Tote-category products on the live site. Reproduced here for continuity;
// reassign via the admin panel once real curated picks are decided.
const HOMEPAGE_FEATURED_SLUGS = [
  'frido-kahlo-canvas-tote-bag',
  'colour-block-tote-bag',
  'brown-wing-tote-bag',
  'classic-structured-tote-bag',
];

// Homepage "Shop by Video" mapping, confirmed in the Phase 1 audit.
const VIDEO_MAP = {
  'v-shaped-ribbed-shoulder-bag': { caption: 'V-Shaped Ribbed Shoulder Bag' },
  'wave-scalloped-crossbody-bag': { caption: 'Wave Scalloped Crossbody Bag' },
};

async function main() {
  console.log('[seed] Creating categories...');
  const categoryRecords = {};
  for (const cat of CATEGORIES) {
    categoryRecords[cat.slug] = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { imageUrl: cat.imageUrl },
      create: cat,
    });
  }

  console.log('[seed] Creating products from the real WooCommerce catalogue...');
  for (const p of PRODUCTS) {
    const isFeatured = HOMEPAGE_FEATURED_SLUGS.includes(p.slug);
    const hasVariations = p.variations.length > 0;

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        title: p.title,
        slug: p.slug,
        sku: p.parentSku,
        shortDescription: p.shortDescription,
        description: p.description,
        priceMinor: hasVariations ? null : SALE_PRICE_MINOR,
        compareAtMinor: hasVariations ? null : REGULAR_PRICE_MINOR,
        currency: 'INR',
        weightGrams: WEIGHT_GRAMS,
        dimensions: DIMENSIONS,
        isPublished: true,
        isBestSeller: isFeatured,
        isNewArrival: isFeatured,
        categories: { create: [{ categoryId: categoryRecords[p.category].id }] },
        variations: {
          create: p.variations.map((v, i) => ({
            sku: v.sku,
            colorName: v.colorName,
            colorHex: v.colorHex,
            priceMinor: SALE_PRICE_MINOR,
            compareAtMinor: REGULAR_PRICE_MINOR,
            imageUrl: imageManifest[v.sku]?.find((img) => img.isPrimary)?.url || imageManifest[v.sku]?.[0]?.url,
            isDefault: i === 0,
          })),
        },
      },
    });

    // Images remain on the product and are explicitly assigned by variation SKU.
    const mediaVariations = await prisma.productVariation.findMany({ where: { productId: product.id } });
    const imageSkuKeys = hasVariations ? p.variations.map((v) => v.sku) : [p.parentSku];
    let sortOrder = 0;
    for (const key of imageSkuKeys) {
      for (const img of imageManifest[key] || []) {
        const variationId = mediaVariations.find((v) => v.sku === key)?.id || null;
        const existingMedia = await prisma.productMedia.findFirst({ where: { productId: product.id, url: img.url } });
        if (existingMedia) {
          if (!existingMedia.variationId && variationId) await prisma.productMedia.update({ where: { id: existingMedia.id }, data: { variationId } });
          sortOrder += 1;
          continue;
        }
        await prisma.productMedia.create({
          data: {
            productId: product.id,
            variationId,
            url: img.url,
            altText: p.title + (hasVariations ? (' - ' + key) : ''),
            sortOrder: img.isPrimary ? -1 : sortOrder, // primary image(s) sort first
          },
        });
        sortOrder += 1;
      }
    }

    // Inventory: one row per variation, or one row on the product itself
    // for simple products (matches the Inventory model's two optional FKs).
    const createdProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: { variations: true },
    });

    if (createdProduct.variations.length > 0) {
      for (const v of createdProduct.variations) {
        await prisma.inventory.upsert({
          where: { variationId: v.id },
          update: {},
          create: { variationId: v.id, quantityAvailable: STOCK_QTY },
        });
      }
    } else {
      await prisma.inventory.upsert({
        where: { productId: product.id },
        update: {},
        create: { productId: product.id, quantityAvailable: STOCK_QTY },
      });
    }

    if (VIDEO_MAP[p.slug]) {
      await prisma.productVideo.create({
        data: {
          productId: product.id,
          url: '', // real video file still to be supplied -- see known-limitations.md
          caption: VIDEO_MAP[p.slug].caption,
        },
      });
    }
  }

  console.log('[seed] Creating a dev admin user...');
  await prisma.user.upsert({
    where: { phone: '+910000000000' },
    update: { role: 'ADMIN' },
    create: { phone: '+910000000000', name: 'Bagiroo Admin', role: 'ADMIN' },
  });

  console.log('[seed] Creating a sample dev coupon (WELCOME10)...');
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: '10% off - dev/test coupon',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      isActive: true,
    },
  });

  console.log('[seed] Creating announcement bar message...');
  await prisma.announcementOffer.createMany({
    data: [{ message: 'NEW ARRIVALS NOW LIVE', sortOrder: 1, isActive: true }],
    skipDuplicates: true,
  });

  console.log('[seed] Creating placeholder testimonials (matches live Lorem Ipsum seed)...');
  await prisma.testimonial.createMany({
    data: [
      { authorName: 'Jimmy Smith', rating: 4, quote: 'Lorem ipsum is simply dummy text...', isPlaceholder: true },
      { authorName: 'Clara', rating: 5, quote: 'Lorem ipsum is simply dummy text...', isPlaceholder: true },
      { authorName: 'Clara', rating: 5, quote: 'Lorem ipsum is simply dummy text...', isPlaceholder: true },
    ],
    skipDuplicates: true,
  });

  console.log('[seed] Creating empty Instagram + Featured Collection placeholder slots...');
  for (let i = 1; i <= 5; i += 1) {
    await prisma.instagramPost.create({ data: { sortOrder: i, imageUrl: null, permalink: null } });
  }

  await prisma.collection.upsert({
    where: { slug: 'featured-collection' },
    update: {},
    create: { name: 'Featured Collection', slug: 'featured-collection', isFeatured: true, isPlaceholder: true },
  });

  console.log('[seed] Setting WhatsApp number placeholder + social links...');
  await prisma.siteSetting.upsert({
    where: { key: 'whatsapp_business_number' },
    update: {},
    create: { key: 'whatsapp_business_number', value: '' },
  });

  await prisma.socialLink.createMany({
    data: [
      { platform: 'instagram', url: 'https://www.instagram.com/bagirooandco/' },
      { platform: 'facebook', url: '' },
      { platform: 'pinterest', url: '' },
      { platform: 'whatsapp', url: '' },
    ],
    skipDuplicates: true,
  });

  console.log('[seed] Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
