# Admin portal

Open `/admin/login` and sign in with a login ID and password. Customer OTP sessions do not grant access to management APIs. Passwords are bcrypt-hashed; the separate HttpOnly admin cookie expires after eight hours. Every management request checks the current account role, active status and session version. Changing the password invalidates all previous admin sessions.

The initial local account credentials are in `.local/admin-credentials.txt` at the repository root, excluded from git. Change the password in Admin → Security after signing in.

For another environment, apply Prisma migrations and generate the client in the server workspace. Stop the API before generation if Windows locks the Prisma engine DLL. Run `node prisma/setup-admin.js` from `server` to provision an initial admin. Optional `ADMIN_LOGIN_ID`, `ADMIN_PASSWORD` and `ADMIN_PHONE` environment variables customize provisioning. The setup script refuses to overwrite an existing login ID.

## Management screens

- Products: titles, slugs, SKUs, sale and compare-at pricing, descriptions, features, dimensions, weight, display order, categories, collections, publishing, best sellers, new arrivals, colour variations and photos.
- Inventory: on-hand quantities for products and colours; reserved stock remains protected.
- Categories and collections: names, descriptions, images, display order, visibility, collection membership and homepage feature selection.
- Website editor: logo, store name, brand colours, font family, navigation labels/destinations/order/visibility, hero copy/image/button/overlay, category and editorial copy, benefits, newsletter copy, homepage section visibility, footer text, search description, policies, contact content and store locations.
- Checkout settings: flat shipping, free-shipping threshold and inclusive/exclusive tax configuration. Amounts use paise.
- Videos and Instagram: media uploads/URLs, associated products, posters, captions, post links, order and visibility.
- Testimonials and reviews: names, ratings, content, visibility and review approval. Approved product reviews appear on product pages.
- Announcements and coupons: content, destinations, ordering, schedules, availability and discounts.
- Site settings: WhatsApp, social links and gifting collection.
- Existing order and return screens remain available. Return refund flags are bookkeeping; this change does not implement gateway refund processing.

Plain-text page content is rendered safely without executing HTML. Saved website settings are served through the public settings API and used by the storefront; credentials are never returned there.

## Verification

From `server`, run `node --test test/admin.integration.test.js`. The test uses a temporary account, verifies protected access, credential handling, website save/public propagation, content editing, checkout calculations and password-session invalidation, then restores the original settings and removes its temporary records.
