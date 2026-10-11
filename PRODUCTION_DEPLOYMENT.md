# Production deployment

## Render API

Create the service from `render.yaml`, then supply `DATABASE_URL`,
`CLOUDINARY_URL`, and the final Netlify origin as `CLIENT_URL`. New admin media
uploads are stored in Cloudinary, the service runs `prisma migrate deploy`
before release, and `/health` is used for health checks.

Set the remaining production integrations in Render as needed:

- `EMAIL_PROVIDER=brevo`
- `BREVO_API_KEY` from Brevo's SMTP & API settings
- `EMAIL_FROM_ADDRESS` using a sender or domain verified in Brevo
- `EMAIL_FROM_NAME=Bagiroo & Co.`
- `MEDIA_STORAGE=cloudinary`
- `CLOUDINARY_URL` copied from the Cloudinary API Keys page
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `WHATSAPP_BUSINESS_NUMBER`

Keep `BREVO_API_KEY` in the Render backend environment only. Do not add it to
Netlify or expose it through a `VITE_` variable. The application sends OTPs via
Brevo's transactional email API at `POST /v3/smtp/email`.

Keep `CLOUDINARY_URL` in the Render backend environment only as it contains the
Cloudinary API secret. The frontend receives only Cloudinary HTTPS delivery
URLs. Image and video uploads continue to use the authenticated
`POST /api/v1/admin/media` endpoint.

`COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true` are required when the Netlify
site calls the `onrender.com` API directly. If both services later use same-site
custom domains, `COOKIE_SAME_SITE=lax` is preferable.

The persistent disk remains temporarily for legacy `/uploads/...` catalogue
assets. Copy the current `uploads` directory to it before publishing. All new
admin uploads go to Cloudinary. Remove the disk only after the legacy media has
been migrated and no database or website setting contains an `/uploads/` URL.

To migrate existing database-linked media, back up the database and uploads,
set `MEDIA_STORAGE=cloudinary`, `CLOUDINARY_URL`, and `UPLOAD_DIR`, then run:

```text
npm run media:migrate-cloudinary -w server
```

The command uploads each unique local file once and updates product media,
variation covers, categories, collections, videos and posters, testimonials,
Instagram posts, and website logo/hero settings. It is safe to rerun because
each legacy URL uses a deterministic Cloudinary public ID.

## Netlify frontend

Import the same repository. `netlify.toml` builds the Vite client and publishes
`client/dist`; `client/public/_redirects` provides the React Router SPA fallback.

Set this Netlify build environment variable after Render generates its URL:

```text
VITE_API_URL=https://your-api.onrender.com
```

Only public values may use the `VITE_` prefix. Never place database, JWT,
cookie, SMS, or payment secrets in Netlify frontend variables.

After Netlify generates the production URL, set the exact URL in Render:

```text
CLIENT_URL=https://your-site.netlify.app
```

Render accepts multiple comma-separated origins if a custom domain is being
migrated, for example `https://site.netlify.app,https://www.example.com`.

Redeploy both services after changing these build-time or runtime values.
