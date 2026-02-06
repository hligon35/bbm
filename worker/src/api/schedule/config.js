function fallbackAvailability() {
  return {
    timezone: 'America/Chicago',
    slotDurationMinutes: 30,
    daysAhead: 14,
    startDaysFromNow: 1,
    days: [
      { enabled: false, start: '09:00', end: '17:00' },
      { enabled: true, start: '09:00', end: '17:00' },
      { enabled: true, start: '09:00', end: '17:00' },
      { enabled: true, start: '09:00', end: '17:00' },
      { enabled: true, start: '09:00', end: '17:00' },
      { enabled: true, start: '09:00', end: '17:00' },
      { enabled: false, start: '09:00', end: '17:00' },
    ],
  };
}

export async function getAvailabilityConfig(env) {
  if (!env.SCHEDULE_CONFIG) {
    return { ok: true, availability: fallbackAvailability() };
  }

  try {
    const value = await env.SCHEDULE_CONFIG.get('availability', { type: 'json' });
    if (!value) return { ok: true, availability: fallbackAvailability() };
    return { ok: true, availability: value };
  } catch (e) {
    console.error('Failed to read availability from SCHEDULE_CONFIG', e);
    return { ok: true, availability: fallbackAvailability() };
  }
}
