# Bagiroo & Co. — Full-Stack Rebuild

Standalone React + Node/Express + MySQL rebuild of the Bagiroo&Co. WordPress/WooCommerce store. See `docs/` for setup and architecture notes, and the Phase 1 audit document (shared separately) for the source-of-truth page/content inventory this build is based on.

## Stack
- **Client:** React (plain JS) + Vite + Tailwind CSS + React Router + TanStack Query
- **Server:** Node.js + Express (plain JS) + Prisma + MySQL
- **Auth:** OTP mobile-number flow, JWT in an httpOnly cookie (no passwords)
- **Payments:** Razorpay (adapter interface — swappable)

## Monorepo layout
```
/client     React storefront
/server     Express API + Prisma schema/seed
/shared     Validation schemas & constants shared by client and server
/uploads    Local dev media storage
/docs       Setup and architecture docs
```

## Quick start
See `docs/setup.md`.

## Status
**Phases 2–5 are implemented**, and the catalogue now runs on **real client data**: actual product titles, descriptions, pricing, and photography from the client's WooCommerce export and Website.zip (see `docs/known-limitations.md`). The admin panel supports full product editing including image upload/reorder/delete and colour-variation management with per-colour images. Remaining gaps are mainly variation-filtered product galleries, an inventory-editing screen, and production testing against real Razorpay/SMS credentials.

**Admin login**: use `/admin/login` with a login ID and password. Initial local credentials are saved in `.local/admin-credentials.txt` (excluded from git). See `docs/admin-panel.md` for setup and the available website/store management screens. Customer OTP login is separate.
