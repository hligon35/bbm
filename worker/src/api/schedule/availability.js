/**
 * Availability logic (server-side).
 *
 * IMPORTANT: In production, availability should be computed server-side so a client
 * cannot submit an arbitrary datetime.
 *
 * Later upgrades:
 * - Use Google Calendar free/busy to block out times.
 * - Use templates per staff member, per invite type, per timezone.
 * - Pull business hours / holidays from D1.
 */
export function computeAvailableSlots({ now = new Date(), durationMinutes = 30 } = {}) {
  const availability = arguments?.[0]?.availability || null;

  const tz = String(availability?.timezone || 'America/Chicago').trim() || 'America/Chicago';
  const slotMinutes = Number(availability?.slotDurationMinutes || durationMinutes || 30);
  const daysAhead = Number(availability?.daysAhead || 14);
  const startDaysFromNow = Number(availability?.startDaysFromNow ?? 1);
  const days = Array.isArray(availability?.days) ? availability.days : null;

  const safeSlotMinutes = Number.isFinite(slotMinutes) && slotMinutes > 0 ? slotMinutes : 30;
  const safeDaysAhead = Number.isFinite(daysAhead) && daysAhead > 0 ? Math.min(daysAhead, 60) : 14;
  const safeStartOffset = Number.isFinite(startDaysFromNow) && startDaysFromNow >= 0
    ? Math.min(startDaysFromNow, 14)
    : 1;

  const weekly = Array.from({ length: 7 }).map((_, i) => {
    const d = days && typeof days[i] === 'object' ? days[i] : null;
    return {
      enabled: Boolean(d?.enabled),
      start: String(d?.start || '09:00'),
      end: String(d?.end || '17:00'),
    };
  });

  const slots = [];
  const startDate = new Date(now.getTime());
  startDate.setUTCDate(startDate.getUTCDate() + safeStartOffset);

  for (let dayOffset = 0; dayOffset < safeDaysAhead; dayOffset += 1) {
    const date = new Date(startDate.getTime());
    date.setUTCDate(startDate.getUTCDate() + dayOffset);

    const weekday = getWeekdayInTimeZone(date, tz);
    const rule = weekly[weekday];
    if (!rule?.enabled) continue;

    const window = parseWindow(rule.start, rule.end);
    if (!window) continue;

    const { startMinutes, endMinutes } = window;
    for (let t = startMinutes; t + safeSlotMinutes <= endMinutes; t += safeSlotMinutes) {
      const startIso = zonedDateTimeToUtcIso(date, t, tz);
      const endIso = zonedDateTimeToUtcIso(date, t + safeSlotMinutes, tz);
      if (!startIso || !endIso) continue;

      const startUtc = new Date(startIso);

      const dayLabel = startUtc.toLocaleDateString('en-US', {
        timeZone: tz,
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      const timeLabel = startUtc.toLocaleTimeString('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: '2-digit',
      });

      slots.push({
        id: startIso,
        start: startIso,
        end: endIso,
        durationMinutes: safeSlotMinutes,
        dayLabel,
        timeLabel,
        label: startUtc.toLocaleString('en-US', {
          timeZone: tz,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
      });
    }
  }

  return slots;
}

function parseWindow(startHHMM, endHHMM) {
  const start = parseHHMM(startHHMM);
  const end = parseHHMM(endHHMM);
  if (start == null || end == null) return null;
  if (end <= start) return null;
  return { startMinutes: start, endMinutes: end };
}

function parseHHMM(value) {
  const s = String(value || '').trim();
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  if (h < 0 || h > 23) return null;
  if (min < 0 || min > 59) return null;
  return h * 60 + min;
}

function getWeekdayInTimeZone(date, timeZone) {
  // Convert locale weekday short name back to 0..6 (Sun..Sat)
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  switch (weekday) {
    case 'Sun':
      return 0;
    case 'Mon':
      return 1;
    case 'Tue':
      return 2;
    case 'Wed':
      return 3;
    case 'Thu':
      return 4;
    case 'Fri':
      return 5;
    case 'Sat':
      return 6;
    default:
      return date.getUTCDay();
  }
}

function getTimeZoneOffsetMinutes(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = dtf.formatToParts(date);
  const values = Object.create(null);
  for (const p of parts) {
    if (p.type !== 'literal') values[p.type] = p.value;
  }

  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return (asUtc - date.getTime()) / 60000;
}

function zonedDateTimeToUtcIso(dayDate, minutesFromMidnight, timeZone) {
  const ymd = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(dayDate);

  const values = Object.create(null);
  for (const p of ymd) {
    if (p.type !== 'literal') values[p.type] = p.value;
  }

  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;

  const hour = Math.floor(minutesFromMidnight / 60);
  const minute = minutesFromMidnight % 60;

  // Two-pass adjustment for DST transitions.
  let utc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  for (let i = 0; i < 2; i += 1) {
    const offset = getTimeZoneOffsetMinutes(utc, timeZone);
    utc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0) - offset * 60000);
  }

  return utc.toISOString();
}

export function isDatetimeInSlots(datetimeIso, slots) {
  const dt = String(datetimeIso || '').trim();
  if (!dt) return false;
  return slots.some((s) => s.start === dt || s.id === dt);
}
