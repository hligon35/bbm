import React, { useEffect, useMemo, useState } from 'react';

import {
  adminNewsletterGetSubscribers,
  adminNewsletterSend,
  adminNewsletterSetSubscribers,
  getScheduleApiBase,
} from '../utils/adminApi';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function parseEmailList(text) {
  const raw = String(text || '')
    .split(/\r?\n|,/g)
    .map((s) => normalizeEmail(s))
    .filter(Boolean);

  const seen = new Set();
  const out = [];
  for (const e of raw) {
    if (seen.has(e)) continue;
    seen.add(e);
    out.push(e);
  }

  return out;
}

function formatList(emails) {
  return (Array.isArray(emails) ? emails : []).join('\n');
}

export default function MailBlastPanel({ sessionEmail }) {
  const apiBase = useMemo(() => getScheduleApiBase(), []);

  const [subscribersText, setSubscribersText] = useState('');
  const [subscribersState, setSubscribersState] = useState({ status: 'idle', error: '', info: '' });

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [testEmail, setTestEmail] = useState(sessionEmail || '');

  const [sendState, setSendState] = useState({ status: 'idle', error: '', info: '' });
  const [progress, setProgress] = useState({ sent: 0, total: 0 });

  useEffect(() => {
    // Best-effort: preload saved subscriber list.
    let cancelled = false;

    async function load() {
      setSubscribersState({ status: 'loading', error: '', info: '' });
      const res = await adminNewsletterGetSubscribers();
      if (cancelled) return;

      if (!res.ok) {
        setSubscribersState({ status: 'error', error: res.error || 'Failed to load subscribers', info: '' });
        return;
      }

      const list = Array.isArray(res.data?.subscribers) ? res.data.subscribers : [];
      setSubscribersText(formatList(list));
      setSubscribersState({ status: 'ready', error: '', info: list.length ? `Loaded ${list.length} subscribers.` : 'No subscribers saved yet.' });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveSubscribers(e) {
    e.preventDefault();
    setSubscribersState({ status: 'loading', error: '', info: '' });

    const list = parseEmailList(subscribersText);
    if (list.length === 0) {
      setSubscribersState({ status: 'error', error: 'Please enter at least one subscriber email.', info: '' });
      return;
    }

    const res = await adminNewsletterSetSubscribers({ subscribers: list });
    if (!res.ok) {
      setSubscribersState({ status: 'error', error: res.error || 'Failed to save subscribers', info: '' });
      return;
    }

    setSubscribersText(formatList(res.data?.subscribers || list));
    setSubscribersState({ status: 'ready', error: '', info: `Saved ${list.length} subscribers.` });
  }

  async function handleSendTest(e) {
    e.preventDefault();
    setSendState({ status: 'loading', error: '', info: '' });

    const cleanTest = normalizeEmail(testEmail);
    if (!cleanTest || !cleanTest.includes('@')) {
      setSendState({ status: 'error', error: 'Enter a valid test email.', info: '' });
      return;
    }

    const cleanSubject = String(subject || '').trim();
    const cleanMessage = String(message || '').trim();

    if (!cleanSubject) {
      setSendState({ status: 'error', error: 'Subject is required.', info: '' });
      return;
    }

    if (!cleanMessage) {
      setSendState({ status: 'error', error: 'Message is required.', info: '' });
      return;
    }

    const res = await adminNewsletterSend({ subject: cleanSubject, message: cleanMessage, testEmail: cleanTest });
    if (!res.ok) {
      setSendState({ status: 'error', error: res.error || 'Failed to send test email', info: '' });
      return;
    }

    setSendState({ status: 'ready', error: '', info: `Test email sent to ${cleanTest}.` });
  }

  async function handleSendCampaign(e) {
    e.preventDefault();
    setSendState({ status: 'loading', error: '', info: '' });

    const list = parseEmailList(subscribersText);
    if (list.length === 0) {
      setSendState({ status: 'error', error: 'No subscribers. Add emails and Save list first.', info: '' });
      return;
    }

    const cleanSubject = String(subject || '').trim();
    const cleanMessage = String(message || '').trim();

    if (!cleanSubject) {
      setSendState({ status: 'error', error: 'Subject is required.', info: '' });
      return;
    }

    if (!cleanMessage) {
      setSendState({ status: 'error', error: 'Message is required.', info: '' });
      return;
    }

    // Send in small batches so one click remains reliable.
    const batchSize = 50;
    setProgress({ sent: 0, total: list.length });

    for (let i = 0; i < list.length; i += batchSize) {
      const batch = list.slice(i, i + batchSize);
      const res = await adminNewsletterSend({ subject: cleanSubject, message: cleanMessage, recipients: batch });
      if (!res.ok) {
        setSendState({ status: 'error', error: res.error || 'Failed while sending', info: '' });
        return;
      }

      setProgress((p) => ({ sent: Math.min(list.length, p.sent + batch.length), total: p.total }));
    }

    setSendState({ status: 'ready', error: '', info: `Sent to ${list.length} recipients.` });
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <h3 className="bbm-contact-subtitle" style={{ textAlign: 'center' }}>
        Mail Blast
      </h3>

      <p className="bbm-contact-text" style={{ textAlign: 'center', opacity: 0.9, fontSize: 14 }}>
        This sends your message to saved subscribers via the same API host as scheduling.
        {apiBase ? (
          <>
            {' '}
            <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>{apiBase}</span>
          </>
        ) : null}
      </p>

      <form onSubmit={handleSaveSubscribers} className="bbm-contact-form" style={{ marginTop: 10 }}>
        <h4 className="bbm-contact-subtitle" style={{ marginBottom: 0, fontSize: '1.1rem' }}>
          Subscribers
        </h4>

        <label className="bbm-form-label">
          Email list (one per line)
          <textarea
            className="bbm-form-textarea"
            rows={8}
            value={subscribersText}
            onChange={(e) => setSubscribersText(e.target.value)}
            placeholder={'person1@gmail.com\nperson2@gmail.com'}
          />
        </label>

        {subscribersState.error ? <div className="bbm-form-error">{subscribersState.error}</div> : null}
        {subscribersState.info ? <div className="bbm-form-success">{subscribersState.info}</div> : null}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button className="bbm-form-submit" type="submit" disabled={subscribersState.status === 'loading'} style={{ marginTop: 0 }}>
            {subscribersState.status === 'loading' ? 'Saving…' : 'Save list'}
          </button>
          <button
            className="bbm-form-submit"
            type="button"
            onClick={() => {
              setSubscribersText('');
              setSubscribersState({ status: 'idle', error: '', info: '' });
            }}
            style={{ marginTop: 0 }}
          >
            Clear
          </button>
        </div>
      </form>

      <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid rgba(247, 200, 115, 0.22)' }} />

      <form onSubmit={handleSendCampaign} className="bbm-contact-form">
        <h4 className="bbm-contact-subtitle" style={{ marginBottom: 0, fontSize: '1.1rem' }}>
          Compose
        </h4>

        <label className="bbm-form-label">
          Subject
          <input className="bbm-form-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Newsletter subject" />
        </label>

        <label className="bbm-form-label">
          Message (plain text)
          <textarea
            className="bbm-form-textarea"
            rows={10}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your update…"
          />
        </label>

        <div className="bbm-form-row">
          <label className="bbm-form-label">
            Test email
            <input
              className="bbm-form-input"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@gmail.com"
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="bbm-form-submit"
              type="button"
              onClick={handleSendTest}
              disabled={sendState.status === 'loading'}
              style={{ marginTop: 0, width: '100%' }}
            >
              {sendState.status === 'loading' ? 'Sending…' : 'Send test'}
            </button>
          </div>
        </div>

        <button className="bbm-form-submit" type="submit" disabled={sendState.status === 'loading'}>
          {sendState.status === 'loading' ? 'Sending…' : 'Send to subscribers'}
        </button>

        {progress.total > 0 && sendState.status === 'loading' ? (
          <div className="bbm-form-success" style={{ marginTop: 10 }}>
            Progress: {progress.sent} / {progress.total}
          </div>
        ) : null}

        {sendState.error ? <div className="bbm-form-error">{sendState.error}</div> : null}
        {sendState.info ? <div className="bbm-form-success">{sendState.info}</div> : null}
      </form>
    </div>
  );
}
