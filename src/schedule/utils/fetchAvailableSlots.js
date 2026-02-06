/**
 * Placeholder availability.
 *
 * Later options:
 * - Call a Worker endpoint that calculates availability from Google Calendar free/busy.
 * - Store availability templates in KV/D1 and expand into slots.
 */
export async function fetchAvailableSlots({ token, metadata }) {
  // token + metadata are accepted so future logic can customize availability
  // per invite, per customer, per staff member, etc.
  void metadata;

  const base = String(import.meta.env.VITE_SCHEDULE_API_BASE || '').replace(/\/$/, '');
  const res = await fetch(`${base}/api/schedule/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    throw new Error('Failed to load slots');
  }

  const data = await res.json();
  return data?.slots || [];
}
