# Colour galleries

Product images have an optional `variationId` linking them to a colour of the same product. The storefront shows only images assigned to the selected colour and resets to the first image on colour changes. A colour with no assigned images shows a placeholder. Products without variations retain their full gallery.

In Admin → Products → Edit → Images, select the colour for each existing photo. Select an upload colour before uploading new images. Images can still be removed and reordered. In Colours / Variations, add, edit, or remove colours; “Add colour image” uploads directly into that colour's gallery.

Deployment: run `prisma migrate deploy`, then `prisma generate` from the server workspace. Stop the API first if Windows locks the Prisma engine DLL. Run `node prisma/backfill-variation-media.js` once to assign existing catalogue photos using the imported SKU/image manifest. It only assigns currently unassigned matching images, preserves admin assignments, and is safe to repeat. New admin uploads do not depend on the manifest.
