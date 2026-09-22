# Known Limitations

## Real product data (new)
- **Real catalogue loaded**: all 8 products now use the client's actual WooCommerce export (`woocommerce_bags_catalogue.xlsx`) — real titles, SKUs, short/full descriptions, categories, and pricing (₹4,999 regular / ₹3,999 sale, applied uniformly per the source sheet). "Wave Scalloped Crossbody Bag", which had a missing price on the live site (flagged in the Phase 1 audit), now has a real price from the sheet.
- **Real product photography loaded**: all 89 images from `Website.zip` are copied into `/uploads/products` and seeded onto the correct product/colour via `server/prisma/image-manifest.json`. One `.mp4` file in the "Colour block pink" folder was excluded (not a valid product image) — flagged, not silently dropped.
- **Weight (500g) and dimensions (100x100x100cm) are uniform across every product** — this is what the client's sheet specifies ("same values applied to every product/variation" per its own instructions tab), not something I invented, but 100cm cubed is an unrealistic size for a handbag and is almost certainly a placeholder pending real measurements. Worth confirming before launch.
- **Product-page gallery is not yet variation-filtered**: for products with colour options, all images from every colour are shown together in one gallery rather than swapping to match the selected swatch. Each `ProductVariation` does have its own `imageUrl` (used for swatch/mega-menu previews), but `ProductGallery` on the product detail page doesn't yet switch its image set when you pick a different colour — next thing to wire up.
- **"Why You'll Love It?" and "Details & Dimensions" now show real content** pulled from the catalogue (description, material/dimensions/weight) instead of placeholder text.

## Admin panel — product editing (new)
- **Every product field is now editable via `/admin/products/:id/edit`**: title, slug, SKU, price, short + full description, material, dimensions, weight, categories, publish/best-seller/new-arrival flags.
- **Images are fully manageable from the admin panel**: upload new images (attached to the product), remove any image, reorder with up/down controls. Requires saving the product once first (needs a product ID) before the image/colour sections appear — a new product's media can't be attached until it exists.
- **Colour variations are fully manageable**: add a new colour (SKU, name, swatch colour picker, price, compare-at price), remove a colour, and upload/replace that colour's dedicated image independently of the main product gallery. A new variation starts with zero stock until the admin sets real inventory (no admin inventory-editing screen exists yet — see below).

## Still open
- **No admin screen for editing inventory/stock quantities directly** — variations and simple products get stock via the seed script or a fresh variation defaults to 0; there's no `/admin` page yet to adjust `quantityAvailable` after the fact.
- **No admin screen for categories/collections/video gallery UI** — backend CRUD exists, not yet wired to a page (unchanged from the Phase 5 checkpoint).
- **Shipping & Returns accordion, Gifting/Store Locator pages** — still placeholder/pending real policy copy from the client.
- **Razorpay and CSV import** — implemented but untested against real credentials/data.
- **Prisma migration required**: this update adds a `shortDescription` column to `Product` — run `npm run db:migrate -w server` again, then `npm run db:seed -w server` to reload the real catalogue (safe to re-run; uses upserts).
