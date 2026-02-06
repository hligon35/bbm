import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import TimeSlotList from './components/TimeSlotList';
import BookingForm from './components/BookingForm';
import Confirmation from './components/Confirmation';

import { fetchTokenStatus } from './utils/fetchTokenStatus';
import { fetchAvailableSlots } from './utils/fetchAvailableSlots';
import { submitBooking } from './utils/submitBooking';

/**
 * Invite-only scheduling page.
 *
 * Route: /schedule/:token
 *
 * This page is intentionally NOT linked from navigation.
 * It is only reachable via a direct invite link containing a unique token.
 */
export default function ScheduleInvitePage() {
  const { token } = useParams();

  const [tokenState, setTokenState] = useState({ status: 'loading', data: null, error: null });
  const [slotsState, setSlotsState] = useState({ status: 'idle', slots: [], error: null });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingState, setBookingState] = useState({ status: 'idle', result: null, error: null });

  const inviteEmail = useMemo(() => tokenState.data?.email || '', [tokenState.data]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setTokenState({ status: 'invalid', data: null, error: 'Missing token' });
        return;
      }

      setTokenState({ status: 'loading', data: null, error: null });
      const res = await fetchTokenStatus(token);

      if (cancelled) return;

      if (!res.ok) {
        setTokenState({ status: 'invalid', data: null, error: res.error || 'Invalid or expired link' });
        return;
      }

      setTokenState({ status: 'valid', data: res.data, error: null });

      // Slots are currently a placeholder array. This is intentionally modular so it can
      // later call a real availability service (e.g., Google Calendar free/busy).
      setSlotsState({ status: 'loading', slots: [], error: null });
      try {
        const slots = await fetchAvailableSlots({ token, metadata: res.data });
        if (cancelled) return;
        setSlotsState({ status: 'ready', slots, error: null });
      } catch (e) {
        if (cancelled) return;
        setSlotsState({
          status: 'error',
          slots: [],
          error: e instanceof Error ? e.message : 'Failed to load time slots',
        });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleBook({ name, email, notes }) {
    if (!token || !selectedSlot) return;

    setBookingState({ status: 'submitting', result: null, error: null });
    const res = await submitBooking({
      token,
      name,
      email,
      notes,
      datetime: selectedSlot.start,
    });

    if (!res.ok) {
      setBookingState({ status: 'error', result: null, error: res.error || 'Booking failed' });
      return;
    }

    setBookingState({ status: 'confirmed', result: res.data, error: null });
  }

  if (tokenState.status === 'loading') {
    return (
      <div style={{ maxWidth: 780, margin: '40px auto', padding: '0 16px' }}>
        <h1>Scheduling</h1>
        <p>Checking your invite link…</p>
      </div>
    );
  }

  if (tokenState.status !== 'valid') {
    return (
      <div style={{ maxWidth: 780, margin: '40px auto', padding: '0 16px' }}>
        <h1>Scheduling</h1>
        <p>Invalid or expired link.</p>
      </div>
    );
  }

  if (bookingState.status === 'confirmed') {
    return (
      <div style={{ maxWidth: 780, margin: '40px auto', padding: '0 16px' }}>
        <Confirmation booking={bookingState.result} slot={selectedSlot} inviteEmail={inviteEmail} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 780, margin: '40px auto', padding: '0 16px' }}>
      <h1>Schedule a time</h1>
      <p style={{ opacity: 0.8, marginTop: 8 }}>This is a private invite-only scheduling link.</p>

      {slotsState.status === 'loading' && <p>Loading available times…</p>}
      {slotsState.status === 'error' && <p style={{ color: 'crimson' }}>{slotsState.error}</p>}

      {slotsState.status === 'ready' && (
        <TimeSlotList slots={slotsState.slots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
      )}

      <div style={{ marginTop: 24 }}>
        <BookingForm
          disabled={!selectedSlot || bookingState.status === 'submitting'}
          defaultEmail={inviteEmail}
          onSubmit={handleBook}
          error={bookingState.status === 'error' ? bookingState.error : null}
        />
      </div>
    </div>
  );
}
