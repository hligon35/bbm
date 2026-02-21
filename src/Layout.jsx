import React, { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './App.css';

// Build correct public asset URLs respecting Vite base (no URL constructor)
const asset = (path) => {
  const base = (import.meta.env.BASE_URL || '/');
  const clean = String(path).replace(/^\/+/,'');
  return `${base}${clean}`;
};

export default function Layout({ children }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const handleMenuToggle = () => setMenuOpen((open) => !open);
  const handleMenuClose = () => setMenuOpen(false);

  const logoClickStateRef = useRef({ count: 0, firstAt: 0 });
  const logoLongPressTimeoutRef = useRef(null);
  const logoLongPressStartPosRef = useRef({ x: 0, y: 0 });

  function goToAdminLogin() {
    handleMenuClose();
    navigate('/admin');
  }

  function handleLogoClick(e) {
    const now = Date.now();
    const state = logoClickStateRef.current;
    if (!state.firstAt || now - state.firstAt > 3000) {
      state.firstAt = now;
      state.count = 0;
    }

    state.count += 1;

    if (state.count >= 3) {
      state.count = 0;
      state.firstAt = 0;
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      goToAdminLogin();
    }
  }

  function startLogoLongPress({ clientX = 0, clientY = 0 } = {}) {
    if (logoLongPressTimeoutRef.current) return;
    logoLongPressStartPosRef.current = { x: Number(clientX) || 0, y: Number(clientY) || 0 };
    logoLongPressTimeoutRef.current = setTimeout(() => {
      logoLongPressTimeoutRef.current = null;
      goToAdminLogin();
    }, 3000);
  }

  function clearLogoLongPress() {
    if (!logoLongPressTimeoutRef.current) return;
    clearTimeout(logoLongPressTimeoutRef.current);
    logoLongPressTimeoutRef.current = null;
  }

  function maybeCancelLogoLongPress({ clientX = 0, clientY = 0 } = {}) {
    if (!logoLongPressTimeoutRef.current) return;
    const start = logoLongPressStartPosRef.current || { x: 0, y: 0 };
    const dx = (Number(clientX) || 0) - (Number(start.x) || 0);
    const dy = (Number(clientY) || 0) - (Number(start.y) || 0);
    // Cancel if the finger/mouse moves more than ~10px.
    if (dx * dx + dy * dy > 100) {
      clearLogoLongPress();
    }
  }

  const newsletterEndpoint = useMemo(() => {
    return import.meta.env.VITE_NEWSLETTER_SUBSCRIBE_ENDPOINT || '/api/schedule/newsletter/subscribe';
  }, []);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterFirstName, setNewsletterFirstName] = useState('');
  const [newsletterLastName, setNewsletterLastName] = useState('');
  const [newsletterState, setNewsletterState] = useState({ status: 'idle', error: '', info: '' });

  async function handleNewsletterSubmit(e) {
    e.preventDefault();
    setNewsletterState({ status: 'idle', error: '', info: '' });

    const clean = newsletterEmail.trim();
    if (!clean || clean.length > 120 || !clean.includes('@')) {
      setNewsletterState({ status: 'idle', error: 'Please enter a valid email.', info: '' });
      return;
    }

    setNewsletterState({ status: 'loading', error: '', info: '' });
    try {
      const firstName = newsletterFirstName.trim();
      const lastName = newsletterLastName.trim();
      if (firstName.length > 60) throw new Error('First name is too long.');
      if (lastName.length > 60) throw new Error('Last name is too long.');

      const res = await fetch(newsletterEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean, firstName, lastName }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status}).`);
      }

      setNewsletterEmail('');
      setNewsletterFirstName('');
      setNewsletterLastName('');
      setNewsletterState({ status: 'success', error: '', info: 'Subscribed. Thank you!' });
    } catch (err) {
      setNewsletterState({
        status: 'idle',
        error: err instanceof Error ? err.message : 'Failed to subscribe.',
        info: '',
      });
    }
  }

  return (
    <div className="bbm-root">
      <nav className="bbm-navbar">
        <div className="bbm-navbar-content">
          <div className="bbm-navbar-logo-group">
            <img
              src={asset('images/bbmlogo.jpg')}
              alt="Black Bridge Mindset Logo"
              className="bbm-navbar-logo-img"
              onClick={handleLogoClick}
              onContextMenu={(e) => e.preventDefault()}
              onPointerDown={(e) => startLogoLongPress({ clientX: e.clientX, clientY: e.clientY })}
              onPointerMove={(e) => maybeCancelLogoLongPress({ clientX: e.clientX, clientY: e.clientY })}
              onPointerUp={clearLogoLongPress}
              onPointerCancel={clearLogoLongPress}
              onPointerLeave={clearLogoLongPress}
              onTouchStart={(e) => {
                const t = e.touches && e.touches[0];
                startLogoLongPress({ clientX: t?.clientX, clientY: t?.clientY });
              }}
              onTouchMove={(e) => {
                const t = e.touches && e.touches[0];
                maybeCancelLogoLongPress({ clientX: t?.clientX, clientY: t?.clientY });
              }}
              onTouchEnd={clearLogoLongPress}
              onTouchCancel={clearLogoLongPress}
              style={{ touchAction: 'manipulation' }}
            />
            <Link to="/" className="bbm-navbar-logo-text" onClick={handleMenuClose}>Black Bridge Mindset</Link>
          </div>
          <div className="bbm-navbar-links">
            <Link to="/" onClick={handleMenuClose}>Home</Link>
            <Link to="/trio" onClick={handleMenuClose}>Meet the Trio</Link>
            <Link to="/episodes" onClick={handleMenuClose}>Episodes</Link>
            <Link to="/podcast" onClick={handleMenuClose}>Podcast</Link>
            <Link to="/contact" onClick={handleMenuClose}>Contact</Link>
          </div>
          <button className="bbm-navbar-menu" aria-label="Menu" onClick={handleMenuToggle} aria-expanded={menuOpen} aria-controls="bbm-navbar-dropdown">
            <span className="bbm-navbar-menu-icon"></span>
          </button>
          {menuOpen && (
            <div className="bbm-navbar-dropdown" id="bbm-navbar-dropdown">
              <Link to="/" onClick={handleMenuClose}>Home</Link>
              <Link to="/trio" onClick={handleMenuClose}>Meet the Trio</Link>
              <Link to="/episodes" onClick={handleMenuClose}>Episodes</Link>
              <Link to="/podcast" onClick={handleMenuClose}>Podcast</Link>
              <Link to="/contact" onClick={handleMenuClose}>Contact</Link>
            </div>
          )}
        </div>
      </nav>
      {children}
      <footer className="bbm-footer">
        <div className="bbm-footer-content">
          <div className="bbm-footer-title-text bbm-footer-title-stack">
            <span>Black</span>
            <span>Bridge</span>
            <span>Mindset</span>
          </div>
          <div className="bbm-footer-contact">
            <form onSubmit={handleNewsletterSubmit} className="bbm-contact-form" style={{ marginTop: 0 }}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                  <label className="bbm-form-label" style={{ margin: 0 }}>
                    First name
                    <input
                      className="bbm-form-input"
                      value={newsletterFirstName}
                      onChange={(e) => setNewsletterFirstName(e.target.value)}
                      placeholder="First"
                      autoComplete="given-name"
                      disabled={newsletterState.status === 'loading'}
                    />
                  </label>

                  <label className="bbm-form-label" style={{ margin: 0 }}>
                    Last name
                    <input
                      className="bbm-form-input"
                      value={newsletterLastName}
                      onChange={(e) => setNewsletterLastName(e.target.value)}
                      placeholder="Last"
                      autoComplete="family-name"
                      disabled={newsletterState.status === 'loading'}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                  <label className="bbm-form-label" style={{ margin: 0 }}>
                    Subscribe
                    <input
                      className="bbm-form-input"
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      disabled={newsletterState.status === 'loading'}
                    />
                  </label>

                  <button
                    className="bbm-form-submit"
                    type="submit"
                    style={{ marginTop: 0, alignSelf: 'end' }}
                    disabled={newsletterState.status === 'loading'}
                  >
                    {newsletterState.status === 'loading' ? 'Subscribing…' : 'Subscribe'}
                  </button>
                </div>
              </div>

              {newsletterState.error ? <div className="bbm-form-error">{newsletterState.error}</div> : null}
              {newsletterState.info ? <div className="bbm-form-success">{newsletterState.info}</div> : null}
            </form>

            <div className="bbm-footer-socials">
              <a href="http://facebook.com/share/12EqRNzg4YP/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="bbm-social-link">
                <img src={asset('images/facebook.png')} alt="Facebook" className="bbm-social-img" loading="lazy" decoding="async" />
              </a>
              <a href="http://instagram.com/blackbridgemindset" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="bbm-social-link">
                <img src={asset('images/instagram.png')} alt="Instagram" className="bbm-social-img" loading="lazy" decoding="async" />
              </a>
              <a href="https://www.youtube.com/@BlackBridgeMindset" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="bbm-social-link">
                <img src={asset('images/youtube.png')} alt="YouTube" className="bbm-social-img" />
              </a>
              <a href="https://blackbridgemindset.buzzsprout.com/" target="_blank" rel="noopener noreferrer" aria-label="Buzzsprout" className="bbm-social-link">
                <img src={asset('images/buzzsprout.jpg')} alt="Buzzsprout" className="bbm-social-img" />
              </a>
            </div>
            <div className="bbm-footer-links">
              <span>Want to connect, collaborate, or share your story?</span>
              <a href="mailto:info@blackbridgemindset.com">Email us</a> or follow us on social media.
            </div>

            <div className="bbm-footer-copyright">
              &copy; {new Date().getFullYear()} Black Bridge Mindset Podcast. All rights reserved.
            </div>

            <div className="bbm-footer-copyright">
              Website designed by {' '}
              <a href="https://www.hldesignedit.com" target="_blank" rel="noopener noreferrer">
                HLDesignedIt.com
              </a>{' '}
              &copy;
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
