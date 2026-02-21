import React from 'react';

export default function AdminCarouselNav({ items, activeId, onChange }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const activeIndex = Math.max(0, safeItems.findIndex((x) => x.id === activeId));

  return (
    <div style={{ maxWidth: 760, margin: '0 auto 18px auto' }}>
      <div
        role="tablist"
        aria-label="Admin sections"
        style={{
          display: 'flex',
          justifyContent: 'center',
          columnGap: 100,
          rowGap: 10,
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
              data-bbm-tour={`admin-tab-${item.id}`}
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
