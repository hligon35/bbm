/**
 * Calls the Worker endpoint to validate a schedule token.
 *
 * Endpoint: /api/schedule/validate
 *
 * Local dev:
 * - You can point to a Wrangler dev server by setting:
 *   VITE_SCHEDULE_API_BASE=http://127.0.0.1:8787
 *
 * If VITE_SCHEDULE_API_BASE is not set, this will call same-origin `/api/...`.
 */
export async function fetchTokenStatus(token) {
  try {
    const base = String(import.meta.env.VITE_SCHEDULE_API_BASE || '').replace(/\/$/, '');
    const res = await fetch(`${base}/api/schedule/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      return { ok: false, status: res.status, error: 'Invalid or expired link' };
    }

    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : 'Network error',
    };
  }
}
