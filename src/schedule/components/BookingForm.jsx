import React, { useEffect, useMemo, useState } from 'react';

/**
 * Booking form component.
 *
 * Notes:
 * - Email is prefilled from token metadata when available.
 * - Server will still validate the token and can enforce email matching later.
 */
export default function BookingForm({ disabled, defaultEmail, defaultName, onSubmit, error }) {
  const [name, setName] = useState(defaultName || '');
  const [email, setEmail] = useState(defaultEmail || '');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!name && defaultName) {
      setName(defaultName);
    }
  }, [defaultName, name]);

  const canSubmit = useMemo(() => {
    if (disabled) return false;
    if (!name.trim()) return false;
    if (!email.trim() || !email.includes('@')) return false;
    return true;
  }, [disabled, name, email]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), email: email.trim(), notes: notes.trim() });
  }

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #e6e6e6', borderRadius: 12, padding: 16 }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>Book this time</h2>

      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            disabled={disabled}
            style={{ padding: 10, borderRadius: 10, border: '1px solid #ccc' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={disabled}
            style={{ padding: 10, borderRadius: 10, border: '1px solid #ccc' }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything you'd like us to know"
            disabled={disabled}
            rows={4}
            style={{ padding: 10, borderRadius: 10, border: '1px solid #ccc', resize: 'vertical' }}
          />
        </label>

        {error ? <div style={{ color: 'crimson' }}>{error}</div> : null}

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #111',
            background: canSubmit ? '#111' : '#888',
            color: 'white',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          Confirm booking
        </button>
      </div>
    </form>
  );
}
