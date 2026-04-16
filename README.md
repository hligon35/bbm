# Black Bridge Mindset Website

Official website for the Black Bridge Mindset podcast.

This repository contains:

- A Vite + React frontend (public marketing pages, episodes, podcast, trio, contact, scheduling UI)
- A Cloudflare Worker backend (`worker/`) for contact email, scheduling APIs, OTP admin auth, newsletter, and YouTube upload proxy

## Tech Stack

- Frontend: React 19, React Router 7, Vite 7
- Backend: Cloudflare Workers (JavaScript modules)
- Data: Cloudflare D1 + Cloudflare KV
- Email: SendGrid / MailChannels via worker abstraction

## Project Structure

- `src/`: React app source
- `public/`: static assets and Cloudflare Pages headers
- `worker/src/`: Worker API routes and backend logic
- `worker/src/api/schedule/`: scheduling endpoints (slots, booking, admin, auth, ICS, YouTube proxy)
- `scripts/`: one-off maintenance and utility scripts

## Frontend Setup

1. Install dependencies:

```bash
npm install
```

1. Configure environment:

```bash
cp .env.example .env
```

Set values as needed:

- `VITE_CONTACT_ENDPOINT` (optional for local/dev API routing)
- `VITE_SCHEDULE_API_BASE` (optional if worker is same-origin)
- `VITE_NEWSLETTER_SUBSCRIBE_ENDPOINT` (optional override)
- `VITE_YOUTUBE_API_KEY` (dev-only fallback; do not set in production)

1. Start development server:

```bash
npm run dev
```

1. Build production bundle:

```bash
npm run build
```

## Worker Setup

Worker configuration lives in `worker/wrangler.toml`.

Typical local workflow:

```bash
cd worker
npm install
npx wrangler dev
```

Required bindings and vars depend on features in use, including:

- `SCHEDULE_DB` (D1)
- `SCHEDULE_TOKENS`, `SCHEDULE_CONFIG`, optionally `SCHEDULE_BOOKINGS` (KV)
- `ALLOWED_ORIGINS`, `SCHEDULE_ADMIN_ALLOWED_HOSTS`
- Email provider environment variables

See `worker/README.md` and `worker/src/api/schedule/README.md` for route-specific details.

## Security Notes

- Keep YouTube API keys out of production client bundles. The site uses `/api/schedule/youtube/uploads` as the preferred server-side proxy.
- Contact and booking endpoints include rate limiting using KV-backed counters.
- Security headers are defined at both Pages (`public/_headers`) and Worker response layers.

## Database Migration

To enforce booking idempotency by timeslot, apply:

- `worker/src/api/schedule/migration-unique-datetime.sql`

Before applying, verify there are no duplicate `datetime` values in existing `bookings` rows.

## Deployment

- Frontend is designed for Cloudflare Pages deployment.
- Worker deploy is managed independently via Wrangler.
- Ensure environment variables and bindings are configured in each target environment.
