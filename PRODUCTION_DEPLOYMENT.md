# Production deployment

## Render API

Create the service from `render.yaml`, then supply `DATABASE_URL` and the final
Netlify origin as `CLIENT_URL`. The generated service uses a persistent disk at
`/opt/render/project/src/uploads`, runs `prisma migrate deploy` before release,
and exposes `/health` for health checks.

Set the remaining production integrations in Render as needed:

- `SMS_PROVIDER`, `SMS_PROVIDER_API_KEY`, `SMS_PROVIDER_SENDER_ID`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `WHATSAPP_BUSINESS_NUMBER`

`COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true` are required when the Netlify
site calls the `onrender.com` API directly. If both services later use same-site
custom domains, `COOKIE_SAME_SITE=lax` is preferable.

The persistent disk starts empty. Copy the current `uploads` directory to the
disk once before publishing the storefront. All later admin uploads are written
to the disk automatically. Keep a separate backup of both MySQL and uploads.

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
