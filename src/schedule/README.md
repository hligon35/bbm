# Invite-only scheduling (hidden)

This folder contains a **fully isolated** scheduling flow that only loads from a private invite link.

## Route

- Frontend route: `/schedule/:token`
- Example invite link: `https://your-domain.com/schedule/demo-token-123`

## Admin (hidden)

- Frontend route: `/schedule/admin`

This is a hidden page intended for you (site owner) to:
- set weekly availability (days + start/end + slot duration)
- generate guest invite links

It talks to the Worker admin endpoints and requires an admin token.

This route is **not** linked from navigation and is intended to remain invite-only.

## How token validation works

1. The invite link contains a `token` in the URL.
2. The page calls the Worker endpoint `POST /api/schedule/validate` with `{ token }`.
3. The Worker looks up the token in Cloudflare KV (binding to be added) and checks:
   - token exists
   - `used !== true`
   - `expiresAt` is in the future
4. If valid: returns `200` with token metadata (email, expiresAt, etc.)
5. If invalid/expired/used: returns `401`

## Slots (server-side)

For production correctness, available slots are returned by the Worker so the client cannot book an arbitrary datetime:

- `POST /api/schedule/slots`
- Body: `{ token }`
- Response: `{ ok: true, slots: [...] }`

## Local preview without KV (dev mode)

For local-only preview, the Worker supports a safe bypass:

- Set `SCHEDULE_DEV_MODE = "true"` in `worker/wrangler.toml`
- Use a token that starts with `demo-` (example: `demo-token-123`)

This is OFF by default and should stay OFF in production.

## Where to add Google Calendar integration later

- Worker placeholder is in `worker/src/api/schedule/book.js` (`createGoogleCalendarEventPlaceholder`)
- Use environment variables for any secrets (do not hardcode)

## How to generate invite links

Token generation is **not** implemented here on purpose.

Typical approach:
1. Generate a random token server-side
2. Store in KV with `{ token, email, expiresAt, used: false }`
3. Email the link: `https://your-domain.com/schedule/<token>`

This repo includes a local helper script to generate a secure token + KV payload:

- `node scripts/createScheduleInviteToken.mjs --email user@example.com --days 7`

## How to customize availability logic

Availability is computed server-side in the Worker based on the stored availability config.

Upgrade options:
- Compute slots based on a template (hours, time zone, meeting length)
- Call a Worker endpoint that uses Google Calendar free/busy
- Use D1 to store staff schedules + exceptions
