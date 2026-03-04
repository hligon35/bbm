import { validateScheduleToken } from './validate';
import { computeAvailableSlots } from './availability';
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

/**
 * Get booked datetime slots from the database
 */
async function getBookedSlots(env) {
  if (!env.SCHEDULE_DB) return [];
  
  try {
    const result = await env.SCHEDULE_DB
      .prepare('SELECT datetime FROM bookings WHERE status = ?1 OR status IS NULL')
      .bind('confirmed')
      .all();
    
    return (result.results || []).map(row => row.datetime).filter(Boolean);
  } catch (e) {
    console.error('Failed to fetch booked slots', e);
    return [];
  }
}

/**
 * POST /api/schedule/slots
 *
 * Body: { token }
 *
 * Returns the server-computed slots for a valid token, excluding already booked times.
 */
export async function handleSlots(request, env, corsHeaders) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: corsHeaders });
  }

  const token = String(body?.token || '').trim();
  const tokenResult = await validateScheduleToken(env, token);
  if (!tokenResult.ok) {
    return jsonResponse(
      { ok: false, error: tokenResult.error },
      { status: tokenResult.status, headers: corsHeaders }
    );
  }

  // Business logic will go here later, e.g.:
  // - choose a schedule template based on token metadata
  // - compute availability from Google Calendar
  const cfg = await getAvailabilityConfig(env);
  const allSlots = computeAvailableSlots({ availability: cfg.availability });
  
  // Filter out already booked slots
  const bookedTimes = await getBookedSlots(env);
  const bookedSet = new Set(bookedTimes);
  const availableSlots = allSlots.filter(slot => !bookedSet.has(slot.start));

  return jsonResponse({ ok: true, slots: availableSlots }, { status: 200, headers: corsHeaders });
}
