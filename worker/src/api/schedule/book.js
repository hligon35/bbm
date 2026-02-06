import { validateScheduleToken } from './validate';
import { computeAvailableSlots, isDatetimeInSlots } from './availability';
import { getAvailabilityConfig } from './config';

function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
}

function uuid() {
  // `crypto.randomUUID()` is available in Workers.
  return crypto.randomUUID();
}

/**
 * Persists a booking.
 *
 * Storage options (scaffold both):
 * 1) D1 (recommended for querying/reporting)
 *    - Add binding in wrangler.toml:
 *      [[d1_databases]]
 *      binding = "SCHEDULE_DB"
 *      database_name = "..."
 *      database_id = "..."
 *
 * 2) KV (simple append-only storage)
 *    - Add KV binding in wrangler.toml:
 *      [[kv_namespaces]]
 *      binding = "SCHEDULE_BOOKINGS"
 *      id = "..."
 */
async function writeBooking(env, booking) {
  const devMode = String(env.SCHEDULE_DEV_MODE || '').toLowerCase() === 'true';

  if (env.SCHEDULE_DB) {
    // Scaffold only: you'll need to create a bookings table.
    // Example schema (run via `wrangler d1 execute`):
    // CREATE TABLE IF NOT EXISTS bookings (
    //   id TEXT PRIMARY KEY,
    //   token TEXT,
    //   name TEXT,
    //   email TEXT,
    //   datetime TEXT,
    //   notes TEXT,
    //   createdAt INTEGER
    // );

    await env.SCHEDULE_DB
      .prepare(
        'INSERT INTO bookings (id, token, name, email, datetime, notes, createdAt) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)'
      )
      .bind(
        booking.id,
        booking.token,
        booking.name,
        booking.email,
        booking.datetime,
        booking.notes || '',
        booking.createdAt
      )
      .run();

    return { ok: true, storage: 'd1' };
  }

  if (env.SCHEDULE_BOOKINGS) {
    const key = `booking:${booking.id}`;
    await env.SCHEDULE_BOOKINGS.put(key, JSON.stringify(booking));
    return { ok: true, storage: 'kv', key };
  }

  // Dev convenience: allow end-to-end UI preview without storage bindings.
  // In production you should configure D1 or KV.
  if (devMode) {
    return { ok: true, storage: 'noop' };
  }

  return { ok: false, error: 'Booking storage not configured' };
}

/**
 * Marks a token as used in KV.
 *
 * This assumes the token source of truth is KV (binding: SCHEDULE_TOKENS).
 * If you later move tokens to D1, update this accordingly.
 */
async function markTokenUsed(env, kvKey, existingEntry) {
  if (!env.SCHEDULE_TOKENS) {
    return { ok: false, error: 'Token storage not configured' };
  }

  const updated = {
    ...(existingEntry || {}),
    used: true,
    usedAt: Date.now(),
  };

  await env.SCHEDULE_TOKENS.put(kvKey, JSON.stringify(updated));
  return { ok: true };
}

/**
 * Placeholder for Google Calendar event creation.
 *
 * Implement later using environment variables for credentials.
 * DO NOT hardcode any secrets.
 *
 * Suggested env vars:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_REFRESH_TOKEN
 * - GOOGLE_CALENDAR_ID
 */
async function createGoogleCalendarEventPlaceholder(_env, _booking) {
  void _env;
  void _booking;
  // TODO: Implement Google Calendar event creation.
  // This placeholder is here to show where business logic will live.
  return { ok: true, provider: 'google', eventId: null };
}

export async function handleBook(request, env, corsHeaders) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: corsHeaders });
  }

  const token = String(body?.token || '').trim();
  const name = String(body?.name || '').trim();
  const email = String(body?.email || '').trim();
  const datetime = String(body?.datetime || '').trim();
  const notes = String(body?.notes || '').trim();

  if (!token || !name || !email || !datetime) {
    return jsonResponse(
      { ok: false, error: 'Missing required fields' },
      { status: 400, headers: corsHeaders }
    );
  }

  const tokenResult = await validateScheduleToken(env, token);
  if (!tokenResult.ok) {
    // propagate 401/501 behavior
    return jsonResponse(
      { ok: false, error: tokenResult.error },
      { status: tokenResult.status, headers: corsHeaders }
    );
  }

  // Business rules (production-hardening):
  // - optionally enforce that `email` matches the invite email
  // - ensure datetime is within allowable slots
  // - rate limit / replay protection

  const enforceEmailMatch = String(env.SCHEDULE_ENFORCE_EMAIL_MATCH || '').toLowerCase() === 'true';
  const inviteEmail = String(tokenResult.data?.email || '').trim().toLowerCase();
  const submittedEmail = email.toLowerCase();
  if (enforceEmailMatch && inviteEmail && inviteEmail !== submittedEmail) {
    return jsonResponse(
      { ok: false, error: 'Email does not match invite' },
      { status: 403, headers: corsHeaders }
    );
  }

  // Always validate datetime against server-computed slots.
  // This prevents a client from booking an arbitrary time.
  const cfg = await getAvailabilityConfig(env);
  const slots = computeAvailableSlots({ availability: cfg.availability });
  if (!isDatetimeInSlots(datetime, slots)) {
    return jsonResponse(
      { ok: false, error: 'Requested time is not available' },
      { status: 400, headers: corsHeaders }
    );
  }

  const booking = {
    id: uuid(),
    token,
    name,
    email,
    datetime,
    notes,
    createdAt: Date.now(),
  };

  const storage = await writeBooking(env, booking);
  if (!storage.ok) {
    return jsonResponse(
      { ok: false, error: storage.error },
      { status: 501, headers: corsHeaders }
    );
  }

  const devMode = String(env.SCHEDULE_DEV_MODE || '').toLowerCase() === 'true';
  if (tokenResult.kv?.key && env.SCHEDULE_TOKENS) {
    const markUsed = await markTokenUsed(env, tokenResult.kv.key, tokenResult.kv.entry);
    if (!markUsed.ok) {
      // Booking succeeded but token wasn't marked used; treat as server error.
      return jsonResponse(
        { ok: false, error: markUsed.error },
        { status: 500, headers: corsHeaders }
      );
    }
  } else if (!devMode) {
    // In non-dev mode, tokens are expected to come from KV and be markable as used.
    return jsonResponse(
      { ok: false, error: 'Token storage not configured' },
      { status: 501, headers: corsHeaders }
    );
  }

  await createGoogleCalendarEventPlaceholder(env, booking);

  return jsonResponse(
    {
      ok: true,
      bookingId: booking.id,
      storage: storage.storage,
    },
    { status: 200, headers: corsHeaders }
  );
}
