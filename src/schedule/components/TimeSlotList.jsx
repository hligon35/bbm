import React from 'react';

/**
 * UI-only component.
 * Later this can be replaced with a richer calendar UI without changing page logic.
 */
export default function TimeSlotList({ slots, selectedSlot, onSelect }) {
  if (!slots?.length) {
    return <p>No times available right now.</p>;
  }

  const localTimeZone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch {
      return '';
    }
  })();

  function toLocalDayLabel(iso) {
    const d = new Date(String(iso || ''));
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  function toLocalTimeLabel(iso) {
    const d = new Date(String(iso || ''));
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  const sorted = [...slots].sort((a, b) => String(a?.start || '').localeCompare(String(b?.start || '')));
  const groups = new Map();
  for (const slot of sorted) {
    const dayLabel = toLocalDayLabel(slot?.start) || String(slot?.dayLabel || '').trim();
    const key = dayLabel || 'Available times';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(slot);
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Available times</h2>
      <p style={{ opacity: 0.75, margin: '8px 0 0 0' }}>
        Times are shown in your local time{localTimeZone ? ` (${localTimeZone})` : ''}.
      </p>

      {[...groups.entries()].map(([day, daySlots]) => (
        <details key={day} style={{ marginTop: 14 }}>
          <summary
            style={{
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              padding: '10px 0 0 0',
            }}
          >
            {day}
          </summary>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
              marginTop: 12,
            }}
          >
            {daySlots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              const title = toLocalTimeLabel(slot?.start) || slot?.timeLabel || slot?.label;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => onSelect(slot)}
                  style={{
                    textAlign: 'left',
                    padding: 12,
                    borderRadius: 10,
                    border: isSelected ? '2px solid #111' : '1px solid #ddd',
                    background: isSelected ? '#f2f2f2' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{title}</div>
                  <div style={{ opacity: 0.75, marginTop: 4 }}>{slot.durationMinutes} minutes</div>
                </button>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  );
}
