import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function RescheduleBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, loaded, error
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
      setError('Invalid reschedule link. Please check the link from your confirmation email.');
      return;
    }

    fetchBooking();
  }, [token, fetchBooking]);

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
        <h1 style={{ fontSize: 28, marginBottom: 20 }}>Reschedule Booking</h1>
        <p>Loading booking details...</p>
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
          <h1 style={{ fontSize: 28, marginBottom: 12, color: '#721c24' }}>Unable to Reschedule</h1>
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
        <h1 style={{ fontSize: 28, marginBottom: 20 }}>Reschedule Your Booking</h1>
        
        <div style={{ 
          padding: 20, 
          background: '#d1ecf1', 
          border: '1px solid #bee5eb', 
          borderRadius: 12,
          marginBottom: 24 
        }}>
          <h2 style={{ fontSize: 18, marginBottom: 12, color: '#0c5460' }}>Current Booking</h2>
          <p style={{ margin: '8px 0', color: '#0c5460' }}><strong>Name:</strong> {booking.name}</p>
          <p style={{ margin: '8px 0', color: '#0c5460' }}><strong>Email:</strong> {booking.email}</p>
          <p style={{ margin: '8px 0', color: '#0c5460' }}>
            <strong>Current Time:</strong> {formatDateTime(booking.datetime)}
          </p>
        </div>

        <div style={{ 
          padding: 20, 
          background: '#fff3cd', 
          border: '1px solid #ffeeba', 
          borderRadius: 12,
          marginBottom: 24 
        }}>
          <h3 style={{ fontSize: 18, marginTop: 0, marginBottom: 12, color: '#856404' }}>
            How to Reschedule
          </h3>
          <p style={{ margin: 0, color: '#856404' }}>
            To reschedule your booking, please follow these steps:
          </p>
          <ol style={{ marginTop: 12, marginBottom: 0, paddingLeft: 20, color: '#856404' }}>
            <li style={{ marginBottom: 8 }}>
              First, <strong>cancel your current booking</strong> using the cancel link from your confirmation email
            </li>
            <li style={{ marginBottom: 8 }}>
              Then, <strong>reply to that email</strong> to let us know you'd like to reschedule
            </li>
            <li>
              We'll send you a <strong>new invitation link</strong> to book a different time
            </li>
          </ol>
        </div>

        <div style={{ 
          padding: 20, 
          background: '#f8f9fa', 
          border: '1px solid #dee2e6', 
          borderRadius: 12,
          marginBottom: 24 
        }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            <strong>💡 Why this process?</strong>
          </p>
          <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14, color: '#6c757d' }}>
            This ensures your originally scheduled time becomes available for others, 
            and allows us to provide you with the most up-to-date availability for your new booking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a
            href={`/schedule/cancel?token=${token}`}
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '14px 24px',
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              textAlign: 'center',
              textDecoration: 'none',
              display: 'block',
            }}
          >
            Cancel Current Booking
          </a>
          <a
            href="mailto:info@blackbridgemindset.com?subject=Reschedule%20Request"
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '14px 24px',
              background: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              textAlign: 'center',
              textDecoration: 'none',
              display: 'block',
            }}
          >
            Contact Us to Reschedule
          </a>
        </div>

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

  return null;
}
