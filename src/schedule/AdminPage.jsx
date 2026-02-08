import React, { useCallback, useEffect, useState } from 'react';

import Layout from '../Layout';

import AdminLoginPage from './AdminLoginPage';
import ScheduleAdminPage from './ScheduleAdminPage';
import { adminGetSession } from './utils/adminApi';

export default function AdminPage() {
  const [sessionState, setSessionState] = useState({ status: 'loading', phone: null });

  const refreshSession = useCallback(async () => {
    const res = await adminGetSession();
    if (res.ok && res.data?.ok) {
      setSessionState({ status: 'ready', phone: res.data.phone || null });
      return true;
    }

    setSessionState({ status: 'unauthorized', phone: null });
    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await adminGetSession();
      if (cancelled) return;

      if (res.ok && res.data?.ok) {
        setSessionState({ status: 'ready', phone: res.data.phone || null });
      } else {
        setSessionState({ status: 'unauthorized', phone: null });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (sessionState.status === 'loading') {
    return (
      <Layout>
        <section className="bbm-section">
          <h2>Admin</h2>
          <p className="bbm-contact-text" style={{ textAlign: 'center' }}>
            Checking session…
          </p>
        </section>
      </Layout>
    );
  }

  if (sessionState.status !== 'ready') {
    return <AdminLoginPage onSuccess={refreshSession} />;
  }

  return (
    <ScheduleAdminPage
      skipSessionCheck
      sessionEmail={null}
      onUnauthorized={() => setSessionState({ status: 'unauthorized', phone: null })}
      onLoggedOut={() => setSessionState({ status: 'unauthorized', phone: null })}
    />
  );
}
