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
