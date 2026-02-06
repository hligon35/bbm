/**
 * Submits a booking request.
 *
 * Endpoint: /api/schedule/book
 */
export async function submitBooking({ token, name, email, notes, datetime }) {
  try {
    const base = String(import.meta.env.VITE_SCHEDULE_API_BASE || '').replace(/\/$/, '');
    const res = await fetch(`${base}/api/schedule/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name, email, notes, datetime }),
    });

    const payloadText = await res.text();
    let payload;
    try {
      payload = payloadText ? JSON.parse(payloadText) : null;
    } catch {
      payload = null;
    }

    if (!res.ok) {
      return { ok: false, status: res.status, error: payload?.error || 'Booking failed' };
    }

    return { ok: true, status: res.status, data: payload };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}
