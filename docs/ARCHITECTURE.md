# VisionEcho Live Architecture

VisionEcho Live is now a Next.js App Router product build.

## Stack

- Frontend: Next.js, React, TypeScript, global CSS ported from the approved prototype
- Backend: Next.js Route Handlers under `src/app/api`
- Database adapter: local JSON persistence in `data/visionecho-db.json` for rapid shipping
- Auth: signed HTTP-only cookie sessions, password hashing with Node crypto
- Validation: Zod request schemas
- Mobile web: PWA manifest, service worker, responsive layout, mobile bottom dock

## Core Routes

- `/` - Live civic newsroom
- `/category/[slug]` - Category-filtered feed
- `/report/[id]` - Shareable report detail feed
- `/offline` - Offline fallback

## API Contract

- `GET /api/reports`
- `POST /api/reports`
- `GET /api/reports/:id`
- `GET /api/reports/:id/comments`
- `POST /api/reports/:id/comments`
- `POST /api/editor/reports/:id/approve`
- `POST /api/editor/reports/:id/reject`
- `GET /api/categories`
- `GET /api/reporters`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/kyc`
- `PATCH /api/admin/kyc/:id`
- `PATCH /api/admin/users/:id/role`

## Production Upgrade Path

The current file-backed adapter is intentionally isolated in `src/lib/db.ts`. Replace that module with Neon Postgres, Supabase Postgres, or another SQL adapter when credentials are ready. Keep `src/lib/types.ts` and API response shapes stable so the web app and future mobile app do not need a rewrite.

Launch blockers before public production:

- Hosted database persistence for Vercel production
- Strong `AUTH_SECRET` in production
- Signed object storage for image, video, and audio uploads
- Media scanning and content moderation
- Rate limiting for submissions, comments, login, and editor routes
- Immutable audit logs for editor actions
- Source protection and location privacy rules
