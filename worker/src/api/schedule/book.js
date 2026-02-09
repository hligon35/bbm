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

function toGoogleCalendarDateUtc(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  const pad2 = (n) => String(n).padStart(2, '0');
  return (
    dt.getUTCFullYear() +
    pad2(dt.getUTCMonth() + 1) +
    pad2(dt.getUTCDate()) +
    'T' +
    pad2(dt.getUTCHours()) +
    pad2(dt.getUTCMinutes()) +
    pad2(dt.getUTCSeconds()) +
    'Z'
  );
}

function buildGoogleCalendarLink({ title, details, startUtc, endUtc, timeZone }) {
  const start = toGoogleCalendarDateUtc(startUtc);
  const end = toGoogleCalendarDateUtc(endUtc);
  if (!start || !end) return '';

  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', String(title || 'Appointment'));
  if (details) url.searchParams.set('details', String(details));
  url.searchParams.set('dates', `${start}/${end}`);
  if (timeZone) url.searchParams.set('ctz', String(timeZone)); 
  return url.toString();
}

function sanitizeTimeZone(value) {
  const tz = String(value || '').trim();
  if (!tz) return '';
  if (tz.length > 64) return '';
  // Very loose allowlist: IANA-like strings (e.g. America/Chicago) and common safe characters.
  if (!/^[A-Za-z0-9_+\-\/]+$/.test(tz)) return '';
  return tz;
}

function buildIcsLink({ siteOrigin, bookingId, token, durationMinutes }) {
  const origin = String(siteOrigin || '').replace(/\/+$/, '');
  if (!origin || !bookingId || !token) return '';
  const url = new URL(`${origin}/api/schedule/booking/ics`);
  url.searchParams.set('bookingId', String(bookingId));
  url.searchParams.set('token', String(token));
  url.searchParams.set('duration', String(durationMinutes || 30));
  return url.toString();
}

function buildBookingNotificationEmail({ booking, invite, timeLabel, timeZone, googleCalendarUrl, icsUrl }) {
  const subject = 'New BBM Podcast Recording Scheduled';

  const guestName = String(booking?.name || '').trim();
  const guestEmail = String(booking?.email || '').trim();
  const guestNotes = String(booking?.notes || '').trim();
  const bookingId = String(booking?.id || '').trim();
  const tz = String(timeZone || '').trim() || 'America/Chicago';

  const text =
    `New scheduled booking confirmed.\n\n` +
    `Scheduled time: ${timeLabel}\n\n` +
    (googleCalendarUrl ? `Add to Google Calendar: ${googleCalendarUrl}\n` : '') +
    (icsUrl ? `Download iCal (.ics): ${icsUrl}\n\n` : '\n') +
    `Guest (form): ${guestName}\n` +
    `Guest email (form): ${guestEmail}\n` +
    (guestNotes ? `Notes: ${guestNotes}\n\n` : '\n') +
    (bookingId ? `Booking reference: ${bookingId}\n` : '');

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.55;">
      <h2 style="margin: 0 0 12px 0;">New scheduled booking confirmed</h2>

      <p style="margin: 0 0 10px 0;"><b>Scheduled time:</b> ${escapeHtml(timeLabel)}</p>

      ${
        googleCalendarUrl || icsUrl
          ? `<p style="margin: 0 0 18px 0;">
              ${googleCalendarUrl ? `<a href="${escapeHtml(googleCalendarUrl)}" target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>` : ''}
              ${googleCalendarUrl && icsUrl ? ' &nbsp;|&nbsp; ' : ''}
              ${icsUrl ? `<a href="${escapeHtml(icsUrl)}" target="_blank" rel="noopener noreferrer">Download iCal (.ics)</a>` : ''}
            </p>`
          : ''
      }

      <h3 style="margin: 0 0 10px 0; font-size: 16px;">Guest (form)</h3>
      <p style="margin: 0 0 6px 0;"><b>Name:</b> ${escapeHtml(guestName)}</p>
      <p style="margin: 0 0 14px 0;"><b>Email:</b> ${escapeHtml(guestEmail)}</p>

      ${guestNotes ? `<p style="margin: 0 0 18px 0;"><b>Notes:</b><br />${escapeHtml(guestNotes).replaceAll('\n', '<br />')}</p>` : ''}

      ${
        bookingId
          ? `<p style="margin: 18px 0 0 0; font-size: 12px; opacity: 0.65;">Booking reference: ${escapeHtml(bookingId)}</p>`
          : ''
      }
    </div>
  `;

  return { subject, text, html };
}

function buildGuestConfirmationEmail({ booking, timeLabel, timeZone, googleCalendarUrl, icsUrl }) {
  const subject = 'Your BBM Podcast Guest Recording Is Confirmed';

  const guestName = String(booking?.name || '').trim();
  const guestNotes = String(booking?.notes || '').trim();
  const tz = String(timeZone || '').trim() || 'America/Chicago';

  const greeting = guestName ? `Hi ${guestName},` : 'Hi,';

  const text =
    `${greeting}\n\n` +
    `You're confirmed for your Black Bridge Mindset Podcast guest recording.\n\n` +
    `Scheduled time: ${timeLabel}\n\n` +
    (googleCalendarUrl ? `Add to Google Calendar: ${googleCalendarUrl}\n` : '') +
    (icsUrl ? `Download iCal (.ics): ${icsUrl}\n\n` : '\n') +
    (guestNotes ? `Notes you submitted:\n${guestNotes}\n\n` : '') +
    `If you have any questions or need to reschedule, just reply to this email.\n\n` +
    `— Black Bridge Mindset`;

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.55;">
      <p style="margin: 0 0 12px 0;">${escapeHtml(greeting)}</p>
      <p style="margin: 0 0 12px 0;">You're confirmed for your <b>Black Bridge Mindset Podcast</b> guest recording.</p>

      <p style="margin: 0 0 8px 0;"><b>Scheduled time:</b> ${escapeHtml(timeLabel)}</p>

      ${
        googleCalendarUrl || icsUrl
          ? `<p style="margin: 0 0 18px 0;">
              ${googleCalendarUrl ? `<a href="${escapeHtml(googleCalendarUrl)}" target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>` : ''}
              ${googleCalendarUrl && icsUrl ? ' &nbsp;|&nbsp; ' : ''}
              ${icsUrl ? `<a href="${escapeHtml(icsUrl)}" target="_blank" rel="noopener noreferrer">Download iCal (.ics)</a>` : ''}
            </p>`
          : ''
      }

      ${guestNotes ? `<p style="margin: 0 0 18px 0;"><b>Notes you submitted:</b><br />${escapeHtml(guestNotes).replaceAll('\n', '<br />')}</p>` : ''}

      <p style="margin: 0;">If you have any questions or need to reschedule, just reply to this email.</p>
      <p style="margin: 16px 0 0 0;">— Black Bridge Mindset</p>
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

    try {
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
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('D1 booking insert failed', msg);

      // Common first-time setup issue.
      if (/no such table\s*:\s*bookings/i.test(msg) || /no such table/i.test(msg)) {
        return { ok: false, status: 501, error: 'Booking database not initialized' };
      }

      return { ok: false, status: 500, error: 'Failed to save booking' };
    }
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

  return { ok: false, status: 501, error: 'Booking storage not configured' };
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
      { status: storage.status || 501, headers: corsHeaders }
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

  // Booking confirmation emails (guest + internal)
  let guestEmailSent = false;
  let guestEmailError = null;
  let internalEmailSent = false;
  let internalEmailError = null;
  try {
    const fromEmail = String(env.EMAIL_FROM || '').trim();
    const fromName = String(env.FROM_NAME || 'Black Bridge Mindset').trim();
    if (fromEmail) {
      const clientTimeZone = sanitizeTimeZone(body?.timeZone);
      const businessTz = String(cfg?.availability?.timezone || 'America/Chicago').trim() || 'America/Chicago';
      const guestTz = clientTimeZone || businessTz;

      const guestTimeLabel = formatBookingTime(datetime, guestTz);
      const internalTimeLabel = formatBookingTime(datetime, businessTz);
      const durationMinutes = Number(cfg?.availability?.slotDurationMinutes || 30);
      const safeDurationMinutes = Number.isFinite(durationMinutes) && durationMinutes > 0 ? durationMinutes : 30;
      const siteOrigin = new URL(request.url).origin;
      const startUtc = new Date(datetime);
      const endUtc = new Date(startUtc.getTime() + safeDurationMinutes * 60 * 1000);
      const icsUrl = buildIcsLink({ siteOrigin, bookingId: booking.id, token: booking.token, durationMinutes: safeDurationMinutes });
      const googleCalendarUrl = buildGoogleCalendarLink({
        title: 'Black Bridge Mindset Podcast Recording',
        details: 'Podcast recording appointment (scheduled via Black Bridge Mindset).',
        startUtc,
        endUtc,
        timeZone: guestTz,
      });

      const invite = tokenResult?.data || null;

      // Guest
      try {
        const guest = buildGuestConfirmationEmail({
          booking,
          timeLabel: guestTimeLabel,
          timeZone: guestTz,
          googleCalendarUrl,
          icsUrl,
        });
        await sendEmail(env, {
          to: [email],
          fromEmail,
          fromName,
          replyTo: 'info@blackbridgemindset.com',
          subject: guest.subject,
          text: guest.text,
          html: guest.html,
        });
        guestEmailSent = true;
      } catch (e) {
        guestEmailError = e instanceof Error ? e.message : 'Failed to send guest confirmation email';
        console.error('guest confirmation email failed', e);
      }

      // Internal
      try {
        const internal = buildBookingNotificationEmail({
          booking,
          invite,
          timeLabel: internalTimeLabel,
          timeZone: businessTz,
          googleCalendarUrl,
          icsUrl,
        });
        await sendEmail(env, {
          to: ['info@blackbridgemindset.com', 'hligon@getsparqd.com'],
          fromEmail,
          fromName,
          replyTo: email,
          subject: internal.subject,
          text: internal.text,
          html: internal.html,
        });
        internalEmailSent = true;
      } catch (e) {
        internalEmailError = e instanceof Error ? e.message : 'Failed to send internal confirmation email';
        console.error('internal confirmation email failed', e);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unexpected email error';
    if (!guestEmailError) guestEmailError = msg;
    if (!internalEmailError) internalEmailError = msg;
    console.error('booking email wrapper failed', e);
  }

  return jsonResponse(
    {
      ok: true,
      bookingId: booking.id,
      storage: storage.storage,
      guestEmailSent,
      guestEmailError,
      internalEmailSent,
      internalEmailError,
    },
    { status: 200, headers: corsHeaders }
  );

}
