import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Layout from '../Layout';

import {
  adminCreateInvite,
  adminGetAvailability,
  adminGetSession,
  adminLogout,
  adminSetAvailability,
  getScheduleApiBase,
} from './utils/adminApi';

import AdminCarouselNav from './components/AdminCarouselNav';
import MailBlastPanel from './components/MailBlastPanel';

function defaultAvailability() {
  return {
    timezone: 'America/Chicago',
    slotDurationMinutes: 30,
    daysAhead: 14,
    startDaysFromNow: 1,
    days: [
      { enabled: false, start: '09:00', end: '17:00' }, // Sun
      { enabled: true, start: '09:00', end: '17:00' }, // Mon
      { enabled: true, start: '09:00', end: '17:00' }, // Tue
      { enabled: true, start: '09:00', end: '17:00' }, // Wed
      { enabled: true, start: '09:00', end: '17:00' }, // Thu
      { enabled: true, start: '09:00', end: '17:00' }, // Fri
      { enabled: false, start: '09:00', end: '17:00' }, // Sat
    ],
  };
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ScheduleAdminPage({ skipSessionCheck = false, sessionEmail = null, onUnauthorized, onLoggedOut }) {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState({
    status: skipSessionCheck ? 'ready' : 'loading',
    email: sessionEmail,
  });

  const [activePanel, setActivePanel] = useState('scheduler');

  const [availabilityState, setAvailabilityState] = useState({ status: 'idle', data: null, error: null });
  const [availabilityDraft, setAvailabilityDraft] = useState(defaultAvailability());

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDays, setInviteDays] = useState('7');
  const [inviteState, setInviteState] = useState({ status: 'idle', data: null, error: null });

  const apiBase = useMemo(() => getScheduleApiBase(), []);

  const adminPanels = useMemo(
    () => [
      { id: 'scheduler', label: 'Scheduler', description: 'Availability + invite links' },
      { id: 'mail', label: 'Mail Blast', description: 'Newsletter / updates' },
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      if (skipSessionCheck) {
        setSessionState({ status: 'ready', email: sessionEmail || null });
        return;
      }

      const res = await adminGetSession();
      if (cancelled) return;

      if (!res.ok || !res.data?.ok) {
        setSessionState({ status: 'unauthorized', email: null });
        if (typeof onUnauthorized === 'function') {
          onUnauthorized();
        } else {
          navigate('/admin', { replace: true });
        }
        return;
      }

      setSessionState({ status: 'ready', email: res.data.email || null });
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [navigate, onUnauthorized, sessionEmail, skipSessionCheck]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (sessionState.status !== 'ready') return;

      setAvailabilityState({ status: 'loading', data: null, error: null });
      const res = await adminGetAvailability();
      if (cancelled) return;

      if (!res.ok) {
        setAvailabilityState({ status: 'error', data: null, error: res.error || 'Failed to load availability' });
        return;
      }

      const merged = res.data?.availability ? res.data.availability : defaultAvailability();
      setAvailabilityDraft(merged);
      setAvailabilityState({ status: 'ready', data: merged, error: null });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionState.status]);

  async function handleLogout() {
    await adminLogout();
    if (typeof onLoggedOut === 'function') {
      onLoggedOut();
    } else {
      navigate('/admin', { replace: true });
    }
  }

  async function handleSaveAvailability(e) {
    e.preventDefault();
    if (sessionState.status !== 'ready') return;

    setAvailabilityState((s) => ({ ...s, status: 'saving', error: null }));
    const res = await adminSetAvailability({ availability: availabilityDraft });

    if (!res.ok) {
      setAvailabilityState({ status: 'error', data: null, error: res.error || 'Failed to save availability' });
      return;
    }

    setAvailabilityState({ status: 'ready', data: availabilityDraft, error: null });
  }

  async function handleCreateInvite(e) {
    e.preventDefault();
    if (sessionState.status !== 'ready') return;

    setInviteState({ status: 'loading', data: null, error: null });
    const res = await adminCreateInvite({ email: inviteEmail, days: inviteDays });

    if (!res.ok) {
      setInviteState({ status: 'error', data: null, error: res.error || 'Failed to generate link' });
      return;
    }

    setInviteState({ status: 'ready', data: res.data, error: null });
  }

  return (
    <Layout>
      <section className="bbm-section">
        <h2>Scheduling Admin</h2>
        <p className="bbm-contact-text" style={{ textAlign: 'center' }}>
          Hidden admin page for setting availability and creating invite links.
        </p>

        <p className="bbm-contact-text" style={{ textAlign: 'center', opacity: 0.9, fontSize: 14 }}>
          API Base:{' '}
          <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
            {apiBase || '(same-origin)'}
          </span>
        </p>

        {sessionState.status !== 'ready' ? (
          <p className="bbm-contact-text" style={{ textAlign: 'center' }}>Checking session…</p>
        ) : (
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <button className="bbm-form-submit" type="button" onClick={handleLogout}>
                Log out
              </button>
            </div>

            <AdminCarouselNav items={adminPanels} activeId={activePanel} onChange={setActivePanel} />

            {activePanel === 'scheduler' ? (
              <>
                <form onSubmit={handleSaveAvailability} className="bbm-contact-form">
                  <h3 className="bbm-contact-subtitle" style={{ textAlign: 'center' }}>Availability</h3>

                  {availabilityState.status === 'loading' && <p className="bbm-contact-text" style={{ textAlign: 'center' }}>Loading…</p>}
                  {availabilityState.status === 'error' && <div className="bbm-form-error">{availabilityState.error}</div>}

                  <label className="bbm-form-label">
                    Timezone
                    <input
                      className="bbm-form-input"
                      value={availabilityDraft.timezone}
                      onChange={(e) => setAvailabilityDraft((d) => ({ ...d, timezone: e.target.value }))}
                      placeholder="America/Chicago"
                    />
                  </label>

                  <div className="bbm-form-row">
                    <label className="bbm-form-label">
                      Slot duration (minutes)
                      <input
                        className="bbm-form-input"
                        type="number"
                        min={10}
                        max={180}
                        value={availabilityDraft.slotDurationMinutes}
                        onChange={(e) =>
                          setAvailabilityDraft((d) => ({
                            ...d,
                            slotDurationMinutes: Number(e.target.value),
                          }))
                        }
                      />
                    </label>

                    <label className="bbm-form-label">
                      Days ahead
                      <input
                        className="bbm-form-input"
                        type="number"
                        min={1}
                        max={60}
                        value={availabilityDraft.daysAhead}
                        onChange={(e) => setAvailabilityDraft((d) => ({ ...d, daysAhead: Number(e.target.value) }))}
                      />
                    </label>
                  </div>

                  <label className="bbm-form-label">
                    Start days from now
                    <input
                      className="bbm-form-input"
                      type="number"
                      min={0}
                      max={14}
                      value={availabilityDraft.startDaysFromNow}
                      onChange={(e) =>
                        setAvailabilityDraft((d) => ({
                          ...d,
                          startDaysFromNow: Number(e.target.value),
                        }))
                      }
                    />
                  </label>

                  <div>
                    <div className="bbm-contact-subtitle" style={{ marginTop: 8 }}>Weekly hours</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                      {availabilityDraft.days.map((day, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '130px 1fr 1fr',
                            gap: 10,
                            alignItems: 'center',
                          }}
                        >
                          <label className="bbm-form-label" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={day.enabled}
                              onChange={(e) =>
                                setAvailabilityDraft((d) => ({
                                  ...d,
                                  days: d.days.map((x, i) => (i === idx ? { ...x, enabled: e.target.checked } : x)),
                                }))
                              }
                            />
                            <span>{DAY_LABELS[idx]}</span>
                          </label>

                          <input
                            className="bbm-form-input"
                            type="time"
                            value={day.start}
                            disabled={!day.enabled}
                            onChange={(e) =>
                              setAvailabilityDraft((d) => ({
                                ...d,
                                days: d.days.map((x, i) => (i === idx ? { ...x, start: e.target.value } : x)),
                              }))
                            }
                          />

                          <input
                            className="bbm-form-input"
                            type="time"
                            value={day.end}
                            disabled={!day.enabled}
                            onChange={(e) =>
                              setAvailabilityDraft((d) => ({
                                ...d,
                                days: d.days.map((x, i) => (i === idx ? { ...x, end: e.target.value } : x)),
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <p className="bbm-contact-text" style={{ textAlign: 'center', opacity: 0.85, fontSize: 14, marginTop: 10 }}>
                      Times are interpreted in <b>{availabilityDraft.timezone}</b>.
                    </p>
                  </div>

                  <button className="bbm-form-submit" type="submit" disabled={availabilityState.status === 'saving'}>
                    {availabilityState.status === 'saving' ? 'Saving…' : 'Save availability'}
                  </button>
                </form>

                <hr style={{ margin: '28px 0', border: 'none', borderTop: '1px solid rgba(247, 200, 115, 0.22)' }} />

                <form onSubmit={handleCreateInvite} className="bbm-contact-form">
                  <h3 className="bbm-contact-subtitle" style={{ textAlign: 'center' }}>Guest invite link</h3>

                  <div className="bbm-form-row">
                    <label className="bbm-form-label">
                      Guest email
                      <input
                        className="bbm-form-input"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="guest@example.com"
                      />
                    </label>

                    <label className="bbm-form-label">
                      Expires in (days)
                      <input
                        className="bbm-form-input"
                        type="number"
                        min={1}
                        max={365}
                        value={inviteDays}
                        onChange={(e) => setInviteDays(e.target.value)}
                      />
                    </label>
                  </div>

                  <button className="bbm-form-submit" type="submit" disabled={inviteState.status === 'loading'}>
                    {inviteState.status === 'loading' ? 'Generating…' : 'Generate link'}
                  </button>

                  {inviteState.status === 'error' && <div className="bbm-form-error">{inviteState.error}</div>}

                  {inviteState.status === 'ready' && (
                    <div>
                      <label className="bbm-form-label">
                        Invite URL
                        <input
                          className="bbm-form-input"
                          readOnly
                          value={inviteState.data.inviteUrl}
                          onFocus={(e) => e.target.select()}
                        />
                      </label>
                      <div className="bbm-form-success" style={{ marginTop: 10 }}>
                        Expires: {new Date(inviteState.data.expiresAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </form>
              </>
            ) : (
              <MailBlastPanel sessionEmail={sessionState.email} />
            )}
          </div>
        )}
      </section>
    </Layout>
  );
}
