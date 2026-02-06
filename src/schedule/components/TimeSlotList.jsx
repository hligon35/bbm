import React from 'react';

/**
 * UI-only component.
 * Later this can be replaced with a richer calendar UI without changing page logic.
 */
export default function TimeSlotList({ slots, selectedSlot, onSelect }) {
  if (!slots?.length) {
    return <p>No times available right now.</p>;
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, marginTop: 24 }}>Available times</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginTop: 12,
        }}
      >
        {slots.map((slot) => {
          const isSelected = selectedSlot?.id === slot.id;
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
              <div style={{ fontWeight: 600 }}>{slot.label}</div>
              <div style={{ opacity: 0.75, marginTop: 4 }}>{slot.durationMinutes} minutes</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
