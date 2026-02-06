import React from 'react';

function clampIndex(value, length) {
  if (length <= 0) return 0;
  const v = Number(value);
  if (!Number.isFinite(v)) return 0;
  return ((v % length) + length) % length;
}

export default function AdminCarouselNav({ items, activeId, onChange }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const activeIndex = Math.max(
    0,
    safeItems.findIndex((x) => x.id === activeId)
  );

  const nextId = safeItems.length ? safeItems[clampIndex(activeIndex + 1, safeItems.length)]?.id : null;
  const prevId = safeItems.length ? safeItems[clampIndex(activeIndex - 1, safeItems.length)]?.id : null;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto 18px auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <button
          className="bbm-form-submit"
          type="button"
          onClick={() => {
            if (prevId) onChange(prevId);
          }}
          disabled={!prevId || safeItems.length < 2}
          aria-label="Previous section"
          style={{
            marginTop: 0,
            padding: '0.6rem 0.9rem',
            fontSize: '0.95rem',
          }}
        >
          Prev
        </button>

        <div
          role="tablist"
          aria-label="Admin sections"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          {safeItems.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                className="bbm-form-submit"
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(item.id)}
                disabled={isActive}
                style={{
                  marginTop: 0,
                  padding: '0.6rem 1.0rem',
                  fontSize: '0.95rem',
                  transform: 'none',
                }}
                title={item.description || item.label}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <button
          className="bbm-form-submit"
          type="button"
          onClick={() => {
            if (nextId) onChange(nextId);
          }}
          disabled={!nextId || safeItems.length < 2}
          aria-label="Next section"
          style={{
            marginTop: 0,
            padding: '0.6rem 0.9rem',
            fontSize: '0.95rem',
          }}
        >
          Next
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10 }} aria-hidden="true">
        {safeItems.map((item) => {
          const isActive = item.id === activeId;
          return (
            <span
              key={item.id}
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                border: '1px solid var(--bbm-accent)',
                background: isActive ? 'var(--bbm-accent)' : 'transparent',
                opacity: isActive ? 0.9 : 0.45,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
