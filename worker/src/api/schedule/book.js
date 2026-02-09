import { validateScheduleToken } from './validate';
import { computeAvailableSlots, isDatetimeInSlots } from './availability';
import { getAvailabilityConfig } from './config';
import { sendEmail } from '../../email';

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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatBookingTime(datetimeIso, timeZone) {
  const iso = String(datetimeIso || '').trim();
  const tz = String(timeZone || '').trim() || 'America/Chicago';

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(d);
  } catch {
    return d.toLocaleString('en-US');
  }
}

function buildBookingNotificationEmail({ booking, invite, timeLabel, timeZone }) {
  const subject = 'New BBM Podcast Recording Scheduled';

  const guestName = String(booking?.name || '').trim();
  const guestEmail = String(booking?.email || '').trim();
  const guestNotes = String(booking?.notes || '').trim();
  const inviteName = String(invite?.name || '').trim();
  const inviteEmail = String(invite?.email || '').trim();
  const tz = String(timeZone || '').trim() || 'America/Chicago';

  const text =
    `New scheduling booking confirmed.\n\n` +
    `Chosen time: ${timeLabel}\n` +
    `Time zone: ${tz}\n\n` +
    `Guest (form): ${guestName}\n` +
    `Guest email (form): ${guestEmail}\n` +
    (guestNotes ? `Notes: ${guestNotes}\n\n` : '\n') +
    `Invite metadata:\n` +
    (inviteName ? `- Name: ${inviteName}\n` : '') +
    (inviteEmail ? `- Email: ${inviteEmail}\n` : '') +
    `- Token: ${String(booking?.token || '').trim()}\n` +
    `- Booking ID: ${String(booking?.id || '').trim()}\n`;

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.55;">
      <h2 style="margin: 0 0 12px 0;">New scheduling booking confirmed</h2>

      <p style="margin: 0 0 10px 0;"><b>Chosen time:</b> ${escapeHtml(timeLabel)}</p>
      <p style="margin: 0 0 18px 0;"><b>Time zone:</b> ${escapeHtml(tz)}</p>

      <h3 style="margin: 0 0 10px 0; font-size: 16px;">Guest (form)</h3>
      <p style="margin: 0 0 6px 0;"><b>Name:</b> ${escapeHtml(guestName)}</p>
      <p style="margin: 0 0 14px 0;"><b>Email:</b> ${escapeHtml(guestEmail)}</p>

      ${guestNotes ? `<p style="margin: 0 0 18px 0;"><b>Notes:</b><br />${escapeHtml(guestNotes).replaceAll('\n', '<br />')}</p>` : ''}

      <h3 style="margin: 0 0 10px 0; font-size: 16px;">Invite metadata</h3>
      ${inviteName ? `<p style="margin: 0 0 6px 0;"><b>Name:</b> ${escapeHtml(inviteName)}</p>` : ''}
      ${inviteEmail ? `<p style="margin: 0 0 6px 0;"><b>Email:</b> ${escapeHtml(inviteEmail)}</p>` : ''}
      <p style="margin: 0 0 6px 0;"><b>Token:</b> ${escapeHtml(String(booking?.token || '').trim())}</p>
      <p style="margin: 0;"><b>Booking ID:</b> ${escapeHtml(String(booking?.id || '').trim())}</p>
    </div>
  `;

  return { subject, text, html };
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

  // Booking notification email (internal)
  let emailSent = false;
  let emailError = null;
  try {
    const fromEmail = String(env.EMAIL_FROM || '').trim();
    const fromName = String(env.FROM_NAME || 'Black Bridge Mindset').trim();
    if (fromEmail) {
      const tz = String(cfg?.availability?.timezone || 'America/Chicago').trim() || 'America/Chicago';
      const timeLabel = formatBookingTime(datetime, tz);
      const invite = tokenResult?.data || null;
      const { subject, text, html } = buildBookingNotificationEmail({ booking, invite, timeLabel, timeZone: tz });
      await sendEmail(env, {
        to: ['info@blackbridgemindset.com', 'hligon@getsparqd.com'],
        fromEmail,
        fromName,
        replyTo: email,
        subject,
        text,
        html,
      });
      emailSent = true;
    }
  } catch (e) {
    emailError = e instanceof Error ? e.message : 'Failed to send booking notification email';
    console.error('booking notification email failed', e);
  }

  return jsonResponse(
    {
      ok: true,
      bookingId: booking.id,
      storage: storage.storage,
      emailSent,
      emailError,
    },
    { status: 200, headers: corsHeaders }
  );
}
