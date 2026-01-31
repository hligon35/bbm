import React from 'react';
import Layout from './Layout';

const asset = (path) => {
  const base = (import.meta.env.BASE_URL || '/');
  const clean = String(path).replace(/^\/+/,'');
  return `${base}${clean}`;
};

export default function Contact() {
  return (
    <Layout>
      <section className="bbm-section bbm-contact">
        <h2>Contact</h2>
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
        <p>Want to connect, collaborate, or share your story? <a href="mailto:info@blackbridgemindset.com">Email us</a> or follow us on social media.</p>
      </section>
    </Layout>
  );
}
