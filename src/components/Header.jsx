import React, { useState, useEffect, useCallback } from 'react';
import ThemeToggle from './ThemeToggle';

function MenuIcon({ open }) {
  return (
    <span className={`hamburger ${open ? 'is-open' : ''}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export default function Header({
  apiKey,
  user,
  onLogout,
  onAdminPanel,
  onLoginClick,
  onHomeClick,
  onGetStarted,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeMenu(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeMenu]);

  const handleNav = (fn) => () => {
    closeMenu();
    fn?.();
  };

  const apiStatus = (
    <div className="api-status" title={apiKey ? 'Gemini API connected' : 'No API key set'}>
      <div className={`api-status-dot ${apiKey ? 'connected' : ''}`} />
      <span className="api-status-label">{apiKey ? 'AI Ready' : 'No Key'}</span>
    </div>
  );

  const userBlock = user ? (
    <div className="user-profile">
      <div className="user-avatar-sm" title={user.name}>
        {user.name?.charAt(0)?.toUpperCase() || 'U'}
      </div>
      <span className="user-name">{user.name}</span>
      {user.isAdmin && (
        <button type="button" className="btn-text btn-admin" onClick={onAdminPanel}>Admin</button>
      )}
      <button type="button" className="btn-text btn-logout" onClick={onLogout}>Logout</button>
    </div>
  ) : (
    <button type="button" className="btn btn-secondary btn-header-login" onClick={onLoginClick}>
      Sign In
    </button>
  );

  const drawerLinks = (
    <nav className="nav-drawer-links" aria-label="Mobile navigation">
      <button type="button" className="nav-drawer-link" onClick={handleNav(onHomeClick)}>
        <span className="nav-drawer-icon">🏠</span>
        <span>Home</span>
      </button>
      <button type="button" className="nav-drawer-link nav-drawer-link--accent" onClick={handleNav(onGetStarted)}>
        <span className="nav-drawer-icon">🚀</span>
        <span>Get Started</span>
      </button>
      {user?.isAdmin && (
        <button type="button" className="nav-drawer-link" onClick={handleNav(onAdminPanel)}>
          <span className="nav-drawer-icon">⚙️</span>
          <span>Admin Panel</span>
        </button>
      )}
      {!user && (
        <button type="button" className="nav-drawer-link" onClick={handleNav(onLoginClick)}>
          <span className="nav-drawer-icon">👤</span>
          <span>Sign In</span>
        </button>
      )}
    </nav>
  );

  return (
    <>
      <header className="header">
        <div className="header-inner">
          {/* Mobile: hamburger on the left */}
          <div className="header-actions header-actions-mobile">
            <button
              type="button"
              className="hamburger-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <MenuIcon open={menuOpen} />
            </button>
            <div className={`api-status-dot api-status-dot--mobile ${apiKey ? 'connected' : ''}`} title={apiKey ? 'AI Ready' : 'No API key'} />
          </div>

          <button type="button" className="header-brand" onClick={onHomeClick} aria-label="Go to home">
            <div className="header-logo" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 20V8l8-4 8 4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="header-brand-text">
              <div className="header-title">Build<span>X</span> AI</div>
              <div className="header-tagline">Construction Intelligence</div>
            </div>
          </button>

          {/* Desktop navigation */}
          <nav className="header-nav-desktop" aria-label="Main navigation">
            <button type="button" className="header-nav-link" onClick={onHomeClick}>Home</button>
            <button type="button" className="header-nav-link header-nav-link--cta" onClick={onGetStarted}>
              Get Started
            </button>
          </nav>

          <div className="header-actions header-actions-desktop">
            <div className="header-actions-primary">
              <ThemeToggle />
              {apiStatus}
            </div>
            <div className="header-actions-secondary">
              {userBlock}
            </div>
          </div>

        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`nav-drawer-overlay ${menuOpen ? 'is-open' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />
      <aside
        id="mobile-nav-drawer"
        className={`nav-drawer ${menuOpen ? 'is-open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <div className="nav-drawer-header">
          <div className="nav-drawer-user">
            {user ? (
              <>
                <div className="user-avatar-sm">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                <div>
                  <div className="nav-drawer-user-name">{user.name}</div>
                  <div className="nav-drawer-user-email">{user.email}</div>
                </div>
              </>
            ) : (
              <div className="nav-drawer-guest">Welcome to BuildX AI</div>
            )}
          </div>
          <button type="button" className="nav-drawer-close" onClick={closeMenu} aria-label="Close menu">✕</button>
        </div>

        {drawerLinks}

        <div className="nav-drawer-footer">
          <div className="nav-drawer-meta">
            <ThemeToggle />
            {apiStatus}
          </div>
          {user && (
            <button type="button" className="btn btn-ghost nav-drawer-logout" onClick={handleNav(onLogout)}>
              Log out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
