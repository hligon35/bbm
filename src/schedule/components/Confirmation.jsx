import React from 'react';

/**
 * Confirmation UI.
 * Replace later with a branded success page, email instructions, etc.
 */
export default function Confirmation({ booking, slot, inviteEmail }) {
  return (
    <div style={{ border: '1px solid #e6e6e6', borderRadius: 12, padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Booked</h1>
      <p>Your time has been reserved.</p>

      {slot ? (
        <p>
          <b>When:</b> {slot.label}
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

      <p style={{ opacity: 0.75 }}>(Calendar integration will be added later.)</p>
    </div>
  );
}
