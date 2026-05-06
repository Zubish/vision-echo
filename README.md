# VisionEcho Live

VisionEcho Live is a full-stack Nigerian civic news app for eyewitness reports, reporter stories, editor verification, comments, sharing, and mobile field use.

The original static prototype is preserved in `legacy-static/`. The active product build is a Next.js app.

## What Works Now

- Responsive live feed with category, status, and search filters
- User registration and login
- First registered account becomes the bootstrap admin
- Admin role assignment for user, reporter, editor, and admin access
- Reporter KYC submission and admin approval
- Eyewitness and verified reporter report submission
- Text, image, video, and audio preview handling
- Go Live camera/audio recorder for field evidence capture
- Location capture prompt for field users
- Editor/admin queue with approve and reject actions
- Verification labels and evidence pills
- Report comments
- Reporter profile cards
- Shareable report URLs
- REST API routes for web and future mobile clients
- Local JSON database persistence for fast MVP iteration
- PWA manifest, service worker, icon, offline page, and mobile bottom dock

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Reset local seed data:

```bash
npm run seed
```

Then restart the dev server or refresh the app.

## Product Routes

- `/` - Live newsroom
- `/category/[slug]` - Category page
- `/report/[id]` - Shareable report view
- `/offline` - PWA offline fallback

## API Routes

- `GET /api/reports`
- `POST /api/reports`
- `GET /api/reports/:id`
- `GET /api/reports/:id/comments`
- `POST /api/reports/:id/comments`
- `POST /api/editor/reports/:id/approve`
- `POST /api/editor/reports/:id/reject`
- `GET /api/categories`
- `GET /api/reporters`

## Database

The current MVP uses `data/visionecho-db.json`, generated automatically from `src/lib/seed.ts`. The repository also includes a production SQL starting point in `docs/schema.sql`.

Recommended production move: replace `src/lib/db.ts` with a Neon Postgres, Supabase Postgres, or managed Postgres adapter while keeping the API response shapes stable.

## Mobile Path

The web app is mobile responsive and PWA-ready now. The next native app step is an Expo React Native client that consumes the same API routes. See `docs/MOBILE-ROADMAP.md`.

## Production Gaps Before Public Launch

- Hosted Postgres/Neon database wired to replace the current local JSON/in-memory adapter
- `AUTH_SECRET` configured in Vercel environment variables
- Signed object storage for real media uploads
- Media malware scanning and content moderation
- Rate limiting and abuse reporting
- Immutable audit logs for editor/admin actions
- Push notifications
- Offline drafts and resumable uploads
- Source protection and location privacy controls

## Media Credits

Sample civic images are loaded from Wikimedia Commons:

- [`Ever-busy market.jpg`](https://commons.wikimedia.org/wiki/File:Ever-busy_market.jpg) by Dotun55, CC BY-SA 4.0
- [`Area shot of polling units.jpg`](https://commons.wikimedia.org/wiki/File:Area_shot_of_polling_units.jpg) by Ibukun Emiola, CC BY-SA 4.0
- [`Aerial view of a busy tomato market in Lagos Nigeria.jpg`](https://meta.wikimedia.org/wiki/File:Aerial_view_of_a_busy_tomato_market_in_Lagos_Nigeria.jpg) by Ayorinde Ogundele, CC BY-SA 4.0
