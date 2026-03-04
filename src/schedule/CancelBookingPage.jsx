import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function CancelBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, loaded, confirming, success, error
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const token = searchParams.get('token');

  const fetchBooking = useCallback(async () => {
    try {
      const response = await fetch('/api/schedule/guest/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!data.ok) {
        setStatus('error');
        setError(data.error || 'Unable to load booking details.');
        return;
      }

      setBooking(data.booking);
      setStatus('loaded');
    } catch (e) {
      console.error('Failed to fetch booking:', e);
      setStatus('error');
      setError('Failed to connect to the server. Please try again later.');
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Invalid cancellation link. Please check the link from your confirmation email.');
      return;
    }

    fetchBooking();
  }, [token, fetchBooking]);

  async function handleCancel() {
    setStatus('confirming');

    try {
      const response = await fetch('/api/schedule/guest/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!data.ok) {
        setStatus('error');
        setError(data.error || 'Failed to cancel booking.');
        return;
      }

      setStatus('success');
    } catch (e) {
      console.error('Failed to cancel booking:', e);
      setStatus('error');
      setError('Failed to connect to the server. Please try again later.');
    }
  }

  function formatDateTime(iso) {
    try {
      const date = new Date(iso);
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  if (status === 'loading') {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
        <h1 style={{ fontSize: 28, marginBottom: 20 }}>Cancel Booking</h1>
        <p>Loading booking details...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
        <div style={{ 
          padding: 24, 
          background: '#d4edda', 
          border: '1px solid #c3e6cb', 
          borderRadius: 12,
          marginBottom: 20 
        }}>
          <h1 style={{ fontSize: 28, marginBottom: 12, color: '#155724' }}>Booking Cancelled</h1>
          <p style={{ margin: 0, color: '#155724' }}>
            Your booking has been successfully cancelled. The time slot is now available for others.
          </p>
        </div>
        <p style={{ marginTop: 20 }}>
          If you change your mind or would like to schedule a different time, please contact us at{' '}
          <a href="mailto:info@blackbridgemindset.com">info@blackbridgemindset.com</a>
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: 20,
            padding: '12px 24px',
            background: '#f7c873',
            border: 'none',
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
        <div style={{ 
          padding: 24, 
          background: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: 12,
          marginBottom: 20 
        }}>
          <h1 style={{ fontSize: 28, marginBottom: 12, color: '#721c24' }}>Unable to Cancel</h1>
          <p style={{ margin: 0, color: '#721c24' }}>{error}</p>
        </div>
        <p style={{ marginTop: 20 }}>
          If you need assistance, please contact us at{' '}
          <a href="mailto:info@blackbridgemindset.com">info@blackbridgemindset.com</a>
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: 20,
            padding: '12px 24px',
            background: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (status === 'loaded' && booking) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', padding: 20 }}>
        <h1 style={{ fontSize: 28, marginBottom: 20 }}>Cancel Your Booking</h1>
        
        <div style={{ 
          padding: 20, 
          background: '#f8f9fa', 
          border: '1px solid #dee2e6', 
          borderRadius: 12,
          marginBottom: 24 
        }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>Booking Details</h2>
          <p><strong>Name:</strong> {booking.name}</p>
          <p><strong>Email:</strong> {booking.email}</p>
          <p><strong>Scheduled Time:</strong> {formatDateTime(booking.datetime)}</p>
          {booking.notes && (
            <div style={{ marginTop: 12 }}>
              <strong>Notes:</strong>
              <p style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{booking.notes}</p>
            </div>
          )}
        </div>

        <div style={{ 
          padding: 20, 
          background: '#fff3cd', 
          border: '1px solid #ffeeba', 
          borderRadius: 12,
          marginBottom: 24 
        }}>
          <p style={{ margin: 0, color: '#856404' }}>
            <strong>⚠️ Are you sure you want to cancel?</strong>
          </p>
          <p style={{ marginTop: 8, marginBottom: 0, color: '#856404' }}>
            This action cannot be undone. If you need to reschedule instead, please use the reschedule link from your confirmation email.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleCancel}
            disabled={status === 'confirming'}
            style={{
              flex: 1,
              padding: '14px 24px',
              background: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: status === 'confirming' ? 'not-allowed' : 'pointer',
              opacity: status === 'confirming' ? 0.6 : 1,
            }}
          >
            {status === 'confirming' ? 'Cancelling...' : 'Yes, Cancel My Booking'}
          </button>
          <button
            onClick={() => navigate('/')}
            disabled={status === 'confirming'}
            style={{
              flex: 1,
              padding: '14px 24px',
              background: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: status === 'confirming' ? 'not-allowed' : 'pointer',
              opacity: status === 'confirming' ? 0.6 : 1,
            }}
          >
            Keep My Booking
          </button>
        </div>
      </div>
    );
  }

  return null;
}
