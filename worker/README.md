# Cloudflare Worker: Contact Form Mailer

This Worker receives a POST from the website contact form and emails the submission to `ceejae06@gmail.com`.

## Deploy

1. Install Wrangler:
   - `npm i -g wrangler`

2. Login:
   - `wrangler login`

3. From this folder:
   - `cd worker`
   - `wrangler deploy`

## Configure

In `worker/wrangler.toml`, set:
- `EMAIL_TO` (destination)
- `EMAIL_FROM` (must be a sender on a domain you control)
- `ALLOWED_ORIGINS` (recommended: lock to your site origin)

## Frontend

The React app POSTs to:
- `VITE_CONTACT_ENDPOINT` (preferred), or
- `/api/contact` (default)

Set `VITE_CONTACT_ENDPOINT` in the app `.env` for local dev or if the Worker is hosted on a different domain.

## Notes (MailChannels)

This implementation uses MailChannels (`https://api.mailchannels.net/tx/v1/send`). For best deliverability, use a FROM address on your domain (e.g. `noreply@blackbridgemindset.com`) and configure DNS (SPF/DKIM) as needed.

---

# Invite-only scheduling (scaffold)

This Worker also includes **scaffolded** scheduling endpoints intended for private invite links.

## Endpoints

- `POST /api/schedule/validate`
   - Body: `{ token }`
   - Checks token entry in KV and returns `200` metadata when valid
   - Returns `401` when invalid/expired/used

- `POST /api/schedule/book`
   - Body: `{ token, name, email, datetime, notes }`
   - Re-validates the token
   - Writes a booking record (D1 or KV — see below)
   - Marks the token as used
   - Calls a placeholder function where Google Calendar integration will be added later

## Admin endpoints (availability + invite links)

These endpoints are used by the hidden admin UI at `/schedule/admin`.

- `POST /api/schedule/admin/availability/get`
- `POST /api/schedule/admin/availability/set`
   - Body: `{ availability }`
- `POST /api/schedule/admin/invite`
   - Body: `{ email, days }`
   - Returns: `{ inviteUrl, token, expiresAt }`

Authentication:
- Send `Authorization: Bearer <token>`
- Configure the token as a Worker secret named `SCHEDULE_ADMIN_TOKEN`.
   - `wrangler secret put SCHEDULE_ADMIN_TOKEN --cwd worker`

Storage:
- Availability config is stored in KV binding `SCHEDULE_CONFIG` under the key `availability`.

## Required KV binding (tokens)

Add a KV namespace binding for token lookup in `worker/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SCHEDULE_TOKENS"
id = "<your_kv_namespace_id>"
```

Each KV value should be JSON shaped like:

```json
{ "token": "...", "email": "user@example.com", "expiresAt": 1769999999999, "used": false }
```

Notes:
- The code will try both `key = token` and `key = token:<token>` for flexibility.
- Token generation is intentionally NOT implemented here.

## Required KV binding (schedule config)

Add a KV namespace binding for availability configuration:

```toml
[[kv_namespaces]]
binding = "SCHEDULE_CONFIG"
id = "<your_kv_namespace_id>"
```

## Optional booking storage (choose one)

### Option A: D1 (recommended)

Add a D1 binding in `worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "SCHEDULE_DB"
database_name = "<your_db_name>"
database_id = "<your_db_id>"
```

You’ll also need a `bookings` table. The suggested schema is shown in the code at `worker/src/api/schedule/book.js`.

### Option B: KV (simple)

Add a KV namespace binding in `worker/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SCHEDULE_BOOKINGS"
id = "<your_kv_namespace_id>"
```

Bookings will be stored as JSON at keys like `booking:<uuid>`.

## Google Calendar integration (later)

Google Calendar event creation is a placeholder only (no API logic yet).

When you implement it, use environment variables for credentials/secrets (do not hardcode), for example:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_CALENDAR_ID`
