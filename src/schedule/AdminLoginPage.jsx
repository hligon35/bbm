import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Layout from '../Layout';

import { adminAuthStart, adminAuthVerify, adminGetSession } from './utils/adminApi';

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const [step, setStep] = useState('email'); // email | code
  const [status, setStatus] = useState('idle'); // idle | loading
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const res = await adminGetSession();
      if (cancelled) return;
      if (res.ok && res.data?.ok) {
        navigate('/schedule/admin', { replace: true });
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleSendCode(e) {
    e.preventDefault();
    setError('');
    setInfo('');

    const clean = email.trim();
    if (!clean || !clean.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }

    setStatus('loading');
    const res = await adminAuthStart({ email: clean });
    setStatus('idle');

    if (!res.ok) {
      setError(res.error || 'Failed to send code.');
      return;
    }

    setStep('code');
    if (import.meta.env.DEV && res.data?.devCode) {
      setInfo(`DEV MODE: Your code is ${res.data.devCode}`);
    } else {
      setInfo('If your email is allowed, a code was sent.');
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setError('');
    setInfo('');

    const cleanEmail = email.trim();
    const cleanCode = code.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }

    if (!cleanCode || cleanCode.length < 4) {
      setError('Please enter your code.');
      return;
    }

    setStatus('loading');
    const res = await adminAuthVerify({ email: cleanEmail, code: cleanCode });
    setStatus('idle');

    if (!res.ok) {
      setError(res.error || 'Invalid code.');
      return;
    }

    // Confirm the cookie-based session actually stuck before redirecting.
    const session = await adminGetSession();
    if (session.ok && session.data?.ok) {
      navigate('/schedule/admin', { replace: true });
      return;
    }

    setError(
      'Login succeeded, but the session was not established. Make sure Vite and the Worker use the same hostname (localhost vs 127.0.0.1), then try again.'
    );
  }

  return (
    <Layout>
      <section className="bbm-section">
        <h2>Admin Login</h2>

        <form
          onSubmit={step === 'email' ? handleSendCode : handleVerifyCode}
          className="bbm-contact-form"
          style={{ maxWidth: 520, margin: '0 auto' }}
        >
          <h3 className="bbm-contact-subtitle" style={{ textAlign: 'center' }}>
            Secure access
          </h3>

          <label className="bbm-form-label">
            Email
            <input
              className="bbm-form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          {step === 'code' && (
            <label className="bbm-form-label">
              Code
              <input
                className="bbm-form-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </label>
          )}

          {error ? <div className="bbm-form-error">{error}</div> : null}
          {info ? <div className="bbm-form-success">{info}</div> : null}

          <button className="bbm-form-submit" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Working…' : step === 'email' ? 'Send code' : 'Verify code'}
          </button>

          {step === 'code' && (
            <button
              className="bbm-form-submit"
              type="button"
              onClick={() => {
                setStep('email');
                setCode('');
                setError('');
                setInfo('');
              }}
              disabled={status === 'loading'}
              style={{ marginTop: 10 }}
            >
              Back
            </button>
          )}
        </form>
      </section>
    </Layout>
  );
}
