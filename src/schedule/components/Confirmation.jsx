import React from 'react';

/**
 * Confirmation UI.
 * Replace later with a branded success page, email instructions, etc.
 */
export default function Confirmation({ booking, slot, inviteEmail }) {
  const whenLocal = (() => {
    const iso = slot?.start;
    if (!iso) return '';
    const d = new Date(String(iso));
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  })();

  return (
    <div style={{ border: '1px solid #e6e6e6', borderRadius: 12, padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Booked</h1>
      <p>Your time has been reserved.</p>

      {slot ? (
        <p>
          <b>When:</b> {whenLocal || slot.label}
        </p>
      ) : null}

      {inviteEmail ? (
        <p>
          <b>Invite email:</b> {inviteEmail}
        </p>
      ) : null}

      {booking?.bookingId ? (
        <p>
          <b>Booking ID:</b> {booking.bookingId}
        </p>
      ) : null}

      {booking?.guestEmailSent ? (
        <p style={{ opacity: 0.8, marginBottom: 0 }}>A confirmation email was sent with calendar links.</p>
      ) : (
        <p style={{ opacity: 0.8, marginBottom: 0 }}>
          If you don’t see a confirmation email, please check your spam folder.
        </p>
      )}
    </div>
  );
}
