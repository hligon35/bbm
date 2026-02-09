function textResponse(body, { status = 200, headers = {} } = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...headers,
    },
  });
}

function icsResponse(body, filename = 'appointment.ics') {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toIcsUtc(dt) {
  const d = dt instanceof Date ? dt : new Date(dt);
  if (Number.isNaN(d.getTime())) return null;
  return (
    d.getUTCFullYear() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate()) +
    'T' +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds()) +
    'Z'
  );
}

function icsEscape(value) {
  return String(value || '')
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll('\n', '\\n');
}

function foldIcsLine(line) {
  // Basic folding at 75 octets is the spec; this is a simple char-based fold.
  // Good enough for our short lines.
  const max = 75;
  if (line.length <= max) return line;
  const parts = [];
  let i = 0;
  while (i < line.length) {
    const chunk = line.slice(i, i + max);
    parts.push(i === 0 ? chunk : ` ${chunk}`);
    i += max;
  }
  return parts.join('\r\n');
}

function buildIcs({ uid, start, end, summary, description }) {
  const dtstamp = toIcsUtc(new Date());
  const dtstart = toIcsUtc(start);
  const dtend = toIcsUtc(end);
  if (!dtstart || !dtend) return null;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Black Bridge Mindset//Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${icsEscape(uid)}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

export async function handleBookingIcs(request, env) {
  if (request.method !== 'GET') {
    return textResponse('Method not allowed', { status: 405, headers: { Allow: 'GET' } });
  }

  const url = new URL(request.url);
  const bookingId = String(url.searchParams.get('bookingId') || '').trim();
  const token = String(url.searchParams.get('token') || '').trim();
  const durationParam = Number(url.searchParams.get('duration') || 30);

  if (!bookingId || !token) {
    return textResponse('Missing bookingId or token', { status: 400 });
  }

  const durationMinutes = Number.isFinite(durationParam) ? Math.max(5, Math.min(durationParam, 240)) : 30;

  if (!env.SCHEDULE_DB) {
    return textResponse('Booking database not configured', { status: 501 });
  }

  let row;
  try {
    const res = await env.SCHEDULE_DB.prepare(
      'SELECT id, token, name, email, datetime, notes, createdAt FROM bookings WHERE id = ?1 LIMIT 1'
    )
      .bind(bookingId)
      .first();
    row = res || null;
  } catch (e) {
    console.error('D1 booking lookup failed', e);
    return textResponse('Failed to load booking', { status: 500 });
  }

  if (!row) {
    return textResponse('Not found', { status: 404 });
  }

  if (String(row.token || '').trim() !== token) {
    return textResponse('Forbidden', { status: 403 });
  }

  const start = new Date(String(row.datetime || ''));
  if (Number.isNaN(start.getTime())) {
    return textResponse('Invalid booking datetime', { status: 500 });
  }

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const summary = 'Black Bridge Mindset Podcast Recording';
  const descriptionLines = [
    'Your recording appointment details:',
    `Guest: ${String(row.name || '').trim()}`,
    `Email: ${String(row.email || '').trim()}`,
  ];
  const notes = String(row.notes || '').trim();
  if (notes) descriptionLines.push(`Notes: ${notes}`);
  descriptionLines.push(`Booking ID: ${String(row.id || '').trim()}`);

  const ics = buildIcs({
    uid: `${String(row.id || '').trim()}@blackbridgemindset.com`,
    start,
    end,
    summary,
    description: descriptionLines.join('\n'),
  });

  if (!ics) {
    return textResponse('Failed to generate calendar file', { status: 500 });
  }

  return icsResponse(ics, 'bbm-recording.ics');
}
