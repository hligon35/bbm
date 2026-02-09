import React from 'react';

/**
 * UI-only component.
 * Later this can be replaced with a richer calendar UI without changing page logic.
 */
export default function TimeSlotList({ slots, selectedSlot, onSelect }) {
  if (!slots?.length) {
    return <p>No times available right now.</p>;
  }

  const sorted = [...slots].sort((a, b) => String(a?.start || '').localeCompare(String(b?.start || '')));
  const groups = new Map();
  for (const slot of sorted) {
    const dayLabel = String(slot?.dayLabel || '').trim();
    const key = dayLabel || 'Available times';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(slot);
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Available times</h2>

      {[...groups.entries()].map(([day, daySlots]) => (
        <div key={day} style={{ marginTop: 14 }}>
          {day !== 'Available times' ? <h3 style={{ fontSize: 16, margin: '10px 0 0 0' }}>{day}</h3> : null}
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
              const title = slot?.timeLabel || slot?.label;
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
        </div>
      ))}
    </div>
  );
}
