/**
 * Guest self-service booking management
 * - Cancel a booking using cancellation token
 * - View booking details for rescheduling
 */

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
 * POST /api/schedule/guest/booking
 * Get booking details using cancellation token (for reschedule page)
 */
export async function handleGuestGetBooking(request, env, corsHeaders) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: corsHeaders });
  }

  const cancellationToken = String(body?.token || '').trim();
  if (!cancellationToken) {
    return jsonResponse({ ok: false, error: 'Token is required' }, { status: 400, headers: corsHeaders });
  }

  if (!env.SCHEDULE_DB) {
    return jsonResponse({ ok: false, error: 'Service not available' }, { status: 501, headers: corsHeaders });
  }

  try {
    const booking = await env.SCHEDULE_DB
      .prepare('SELECT id, name, email, datetime, notes, status FROM bookings WHERE cancellationToken = ?1')
      .bind(cancellationToken)
      .first();

    if (!booking) {
      return jsonResponse({ ok: false, error: 'Booking not found' }, { status: 404, headers: corsHeaders });
    }

    if (booking.status === 'cancelled') {
      return jsonResponse({ ok: false, error: 'This booking has already been cancelled' }, { status: 410, headers: corsHeaders });
    }

    return jsonResponse({ ok: true, booking }, { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error('Failed to fetch booking', e);
    return jsonResponse(
      { ok: false, error: 'Failed to retrieve booking' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * POST /api/schedule/guest/cancel
 * Cancel a booking using cancellation token
 */
export async function handleGuestCancelBooking(request, env, corsHeaders) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: corsHeaders });
  }

  const cancellationToken = String(body?.token || '').trim();
  if (!cancellationToken) {
    return jsonResponse({ ok: false, error: 'Token is required' }, { status: 400, headers: corsHeaders });
  }

  if (!env.SCHEDULE_DB) {
    return jsonResponse({ ok: false, error: 'Service not available' }, { status: 501, headers: corsHeaders });
  }

  try {
    // First, get the booking to check if it exists and isn't already cancelled
    const booking = await env.SCHEDULE_DB
      .prepare('SELECT id, name, email, datetime, status FROM bookings WHERE cancellationToken = ?1')
      .bind(cancellationToken)
      .first();

    if (!booking) {
      return jsonResponse({ ok: false, error: 'Booking not found' }, { status: 404, headers: corsHeaders });
    }

    if (booking.status === 'cancelled') {
      return jsonResponse({ ok: false, error: 'This booking has already been cancelled' }, { status: 410, headers: corsHeaders });
    }

    // Cancel the booking
    const result = await env.SCHEDULE_DB
      .prepare('UPDATE bookings SET status = ?1 WHERE cancellationToken = ?2')
      .bind('cancelled', cancellationToken)
      .run();

    if (result.meta.changes === 0) {
      return jsonResponse({ ok: false, error: 'Failed to cancel booking' }, { status: 500, headers: corsHeaders });
    }

    return jsonResponse({ 
      ok: true, 
      message: 'Booking cancelled successfully',
      booking: {
        name: booking.name,
        datetime: booking.datetime
      }
    }, { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error('Failed to cancel booking', e);
    return jsonResponse(
      { ok: false, error: 'Failed to cancel booking' },
      { status: 500, headers: corsHeaders }
    );
  }
}
