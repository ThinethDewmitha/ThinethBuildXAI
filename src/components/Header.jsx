import React, { useState, useEffect, useCallback } from 'react';
import {
  Home, Rocket, Settings, User, LogOut, X, Menu,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

function MenuIcon({ open }) {
  return open ? <X size={20} /> : <Menu size={20} />;
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
      <button type="button" className="btn-text btn-logout" onClick={onLogout}>
        <LogOut size={14} />
        Logout
      </button>
    </div>
  ) : (
    <button type="button" className="btn btn-secondary btn-header-login" onClick={onLoginClick}>
      Sign In
    </button>
  );

  const drawerLinks = (
    <nav className="nav-drawer-links" aria-label="Mobile navigation">
      <button type="button" className="nav-drawer-link" onClick={handleNav(onHomeClick)}>
        <Home size={18} className="nav-drawer-icon" />
        <span>Home</span>
      </button>
      <button type="button" className="nav-drawer-link nav-drawer-link--accent" onClick={handleNav(onGetStarted)}>
        <Rocket size={18} className="nav-drawer-icon" />
        <span>Get Started</span>
      </button>
      {user?.isAdmin && (
        <button type="button" className="nav-drawer-link" onClick={handleNav(onAdminPanel)}>
          <Settings size={18} className="nav-drawer-icon" />
          <span>Admin Panel</span>
        </button>
      )}
      {!user && (
        <button type="button" className="nav-drawer-link" onClick={handleNav(onLoginClick)}>
          <User size={18} className="nav-drawer-icon" />
          <span>Sign In</span>
        </button>
      )}
    </nav>
  );

  return (
    <>
      <header className="header">
        <div className="header-inner">
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
          <button type="button" className="nav-drawer-close" onClick={closeMenu} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {drawerLinks}

        <div className="nav-drawer-footer">
          <div className="nav-drawer-meta">
            <ThemeToggle />
            {apiStatus}
          </div>
          {user && (
            <button type="button" className="btn btn-ghost nav-drawer-logout" onClick={handleNav(onLogout)}>
              <LogOut size={16} />
              Log out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
