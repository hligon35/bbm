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
 * POST /api/schedule/slots
 *
 * Body: { token }
 *
 * Returns the server-computed slots for a valid token.
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
  const slots = computeAvailableSlots({ availability: cfg.availability });

  return jsonResponse({ ok: true, slots }, { status: 200, headers: corsHeaders });
}
