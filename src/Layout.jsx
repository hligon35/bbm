import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './App.css';

// Build correct public asset URLs respecting Vite base (no URL constructor)
const asset = (path) => {
  const base = (import.meta.env.BASE_URL || '/');
  const clean = String(path).replace(/^\/+/,'');
  return `${base}${clean}`;
};

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const handleMenuToggle = () => setMenuOpen((open) => !open);
  const handleMenuClose = () => setMenuOpen(false);
  return (
    <div className="bbm-root">
      <nav className="bbm-navbar">
        <div className="bbm-navbar-content">
          <div className="bbm-navbar-logo-group">
            <img src={asset('images/bbmlogo.jpg')} alt="Black Bridge Mindset Logo" className="bbm-navbar-logo-img" />
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
          </div>
        </div>
      </footer>
    </div>
  );
}
