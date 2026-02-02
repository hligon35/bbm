import React, { useMemo, useState } from 'react';
import Layout from './Layout';

const asset = (path) => {
  const base = (import.meta.env.BASE_URL || '/');
  const clean = String(path).replace(/^\/+/,'');
  return `${base}${clean}`;
};

export default function Contact() {
  const endpoint = useMemo(() => {
    // Prefer explicit endpoint; otherwise assume a Worker is routed at /api/contact on the same domain.
    return import.meta.env.VITE_CONTACT_ENDPOINT || '/api/contact';
  }, []);

  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: 'General inquiry',
    message: '',
    company: '', // honeypot
  });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [error, setError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('sending');

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
          company: form.company,
          source: 'bbm-site',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status}).`);
      }

      setStatus('success');
      setForm({ name: '', email: '', subject: 'General inquiry', message: '', company: '' });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    }
  };

  return (
    <Layout>
      <section className="bbm-section bbm-contact">
        <h2>Contact</h2>
        <div className="bbm-contact-grid">
          <div className="bbm-contact-formWrap">
            <h3 className="bbm-contact-subtitle">Send a message</h3>
            <form className="bbm-contact-form" onSubmit={onSubmit}>
              <div className="bbm-form-row">
                <label className="bbm-form-label">
                  Name
                  <input
                    className="bbm-form-input"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    autoComplete="name"
                    required
                    maxLength={80}
                  />
                </label>
                <label className="bbm-form-label">
                  Email
                  <input
                    className="bbm-form-input"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    autoComplete="email"
                    required
                    maxLength={120}
                  />
                </label>
              </div>

              <label className="bbm-form-label">
                Subject
                <select
                  className="bbm-form-input"
                  name="subject"
                  value={form.subject}
                  onChange={onChange}
                >
                  <option value="General inquiry">General inquiry</option>
                  <option value="Be a guest">Be a guest</option>
                  <option value="Suggest a guest">Suggest a guest</option>
                  <option value="Collaboration">Collaboration</option>
                  <option value="Booking / speaking">Booking / speaking</option>
                  <option value="Sponsorship / advertising">Sponsorship / advertising</option>
                  <option value="Press / media">Press / media</option>
                  <option value="Technical issue">Technical issue</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="bbm-form-label">
                Message
                <textarea
                  className="bbm-form-textarea"
                  name="message"
                  value={form.message}
                  onChange={onChange}
                  required
                  maxLength={4000}
                  rows={6}
                />
              </label>

              {/* Honeypot (keep hidden) */}
              <label className="bbm-form-honeypot" aria-hidden="true">
                Company
                <input type="text" name="company" value={form.company} onChange={onChange} tabIndex={-1} autoComplete="off" />
              </label>

              <button className="bbm-form-submit" type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send Message'}
              </button>

              {status === 'success' && (
                <div className="bbm-form-success">Thanks! Your message has been sent.</div>
              )}
              {status === 'error' && (
                <div className="bbm-form-error">{error || 'Something went wrong. Please try again.'}</div>
              )}
            </form>
          </div>

          <div className="bbm-contact-info">
            <h3 className="bbm-contact-subtitle">Connect</h3>
            <div className="bbm-social-icons">
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
            <p className="bbm-contact-text">
              Want to connect, collaborate, or share your story? Email us at{' '}
              <a href="mailto:info@blackbridgemindset.com">info@blackbridgemindset.com</a>{' '}
              or use the form.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
