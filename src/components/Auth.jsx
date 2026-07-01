import React, { useState, useEffect, useCallback } from 'react';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  isFirebaseConfigured,
  mapFirebaseAuthError,
} from '../services/firebase';
import { syncFirebaseSession } from '../services/api';

const PROMO_SLIDES = [
  {
    title: 'Analyze your construction site with AI',
    text: 'Upload photos, map your location, and get engineering-grade blueprints in minutes.',
    illustration: 'site',
  },
  {
    title: 'Complete material estimates',
    text: 'Cement, steel, sand, and cost breakdowns cross-validated against IS 456 standards.',
    illustration: 'estimate',
  },
  {
    title: 'Save and track your projects',
    text: 'Sign in to store reports, refine designs, and access your build history anytime.',
    illustration: 'projects',
  },
];

function BuildXLogo() {
  return (
    <div className="auth-brand">
      <div className="auth-brand-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M4 20V8l8-4 8 4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <span className="auth-brand-name">Build<span>X</span> AI</span>
    </div>
  );
}

function PromoIllustration({ type }) {
  if (type === 'estimate') {
    return (
      <svg className="auth-promo-svg" viewBox="0 0 320 220" fill="none" aria-hidden="true">
        <rect x="40" y="30" width="240" height="160" rx="12" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
        <rect x="60" y="55" width="80" height="8" rx="4" fill="rgba(255,255,255,0.7)" />
        <rect x="60" y="75" width="120" height="6" rx="3" fill="rgba(255,255,255,0.35)" />
        <rect x="60" y="100" width="200" height="10" rx="5" fill="rgba(255,255,255,0.25)" />
        <rect x="60" y="120" width="160" height="10" rx="5" fill="rgba(255,255,255,0.45)" />
        <rect x="60" y="140" width="180" height="10" rx="5" fill="rgba(255,255,255,0.3)" />
        <circle cx="250" cy="70" r="22" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
        <text x="250" y="76" textAnchor="middle" fill="white" fontSize="18">₹</text>
      </svg>
    );
  }
  if (type === 'projects') {
    return (
      <svg className="auth-promo-svg" viewBox="0 0 320 220" fill="none" aria-hidden="true">
        <rect x="70" y="40" width="180" height="140" rx="12" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
        <rect x="90" y="65" width="60" height="45" rx="6" fill="rgba(255,255,255,0.25)" />
        <rect x="160" y="65" width="70" height="20" rx="4" fill="rgba(255,255,255,0.5)" />
        <rect x="160" y="95" width="70" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
        <rect x="90" y="120" width="140" height="8" rx="4" fill="rgba(255,255,255,0.35)" />
        <rect x="90" y="138" width="100" height="8" rx="4" fill="rgba(255,255,255,0.25)" />
        <circle cx="55" cy="110" r="18" fill="#fff" fillOpacity="0.9" />
        <circle cx="265" cy="90" r="18" fill="#fff" fillOpacity="0.9" />
        <path d="M73 110 H247" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
    );
  }
  return (
    <svg className="auth-promo-svg" viewBox="0 0 320 220" fill="none" aria-hidden="true">
      <rect x="120" y="35" width="160" height="120" rx="10" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
      <rect x="140" y="60" width="50" height="35" rx="4" fill="rgba(255,255,255,0.3)" />
      <rect x="200" y="60" width="60" height="8" rx="4" fill="rgba(255,255,255,0.5)" />
      <rect x="200" y="78" width="40" height="8" rx="4" fill="rgba(255,255,255,0.35)" />
      <rect x="140" y="105" width="100" height="6" rx="3" fill="rgba(255,255,255,0.4)" />
      <circle cx="70" cy="80" r="22" fill="#fff" fillOpacity="0.92" />
      <circle cx="70" cy="130" r="22" fill="#fff" fillOpacity="0.92" />
      <circle cx="70" cy="180" r="22" fill="#fff" fillOpacity="0.92" />
      <path d="M92 80 H120 M92 130 H120 M92 180 H120" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
      <circle cx="70" cy="80" r="8" fill="#4285F4" />
      <circle cx="70" cy="130" r="8" fill="#f97316" />
      <circle cx="70" cy="180" r="8" fill="#10b981" />
    </svg>
  );
}

function AuthPromoPanel() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide(s => (s + 1) % PROMO_SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const current = PROMO_SLIDES[slide];

  return (
    <aside className="auth-panel-promo" aria-hidden="true">
      <div className="auth-promo-inner">
        <PromoIllustration type={current.illustration} />
        <h3 className="auth-promo-title">{current.title}</h3>
        <p className="auth-promo-text">{current.text}</p>
        <div className="auth-promo-dots">
          {PROMO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`auth-promo-dot ${i === slide ? 'active' : ''}`}
              onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    address: '',
    adminSecret: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

  const completeFirebaseAuth = useCallback(async (firebaseUser, profile = {}) => {
    const idToken = await firebaseUser.getIdToken();
    const data = await syncFirebaseSession(idToken, profile);
    onLogin(data.user);
  }, [onLogin]);

  const handleGoogleClick = async () => {
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured. Add VITE_FIREBASE_* keys to .env.local and restart the dev server.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const firebaseUser = await signInWithGoogle();
      await completeFirebaseAuth(firebaseUser);
    } catch (err) {
      setError(err.message || mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('buildx_remember_email');
    if (saved) {
      setFormData(prev => ({ ...prev, email: saved }));
      setRememberMe(true);
    }
  }, []);

  const checkPasswordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#059669'];
    return { score, label: labels[Math.min(score, 4)], color: colors[Math.min(score, 4)] };
  };

  const update = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'password') setPasswordStrength(checkPasswordStrength(value));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      return setError('Email and password are required.');
    }

    if (!isLogin) {
      if (!formData.name) return setError('Full name is required.');
      if (formData.password.length < 8) return setError('Password must be at least 8 characters.');
      if (formData.password !== formData.confirmPassword) return setError('Passwords do not match.');
      if (!formData.phone) return setError('Phone number is required.');
    }

    setLoading(true);
    try {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not configured. Add VITE_FIREBASE_* keys to .env.local and restart the dev server.');
      }

      let firebaseUser;
      if (isLogin) {
        firebaseUser = await signInWithEmail(formData.email, formData.password);
        if (rememberMe) {
          localStorage.setItem('buildx_remember_email', formData.email);
        } else {
          localStorage.removeItem('buildx_remember_email');
        }
        await completeFirebaseAuth(firebaseUser);
      } else {
        firebaseUser = await signUpWithEmail(formData.email, formData.password, formData.name);
        await completeFirebaseAuth(firebaseUser, {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          adminSecret: formData.adminSecret || undefined,
        });
      }
    } catch (err) {
      setError(err.message?.includes('Firebase is not configured')
        ? err.message
        : (err.message || mapFirebaseAuthError(err)));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="auth-page animate-in">
      <div className="auth-shell">
        <div className="auth-panel-form">
          <BuildXLogo />

          <div className="auth-heading">
            <h1>{isLogin ? 'Log in to your Account' : 'Create your Account'}</h1>
            <p>{isLogin ? 'Welcome back! Select method to log in:' : 'Join BuildX AI to save projects and track builds:'}</p>
          </div>

          <div className="auth-social-row">
            <button
              type="button"
              className="auth-social-btn"
              onClick={handleGoogleClick}
              disabled={loading}
            >
              <GoogleIcon />
              <span>Google</span>
            </button>
          </div>

          {!isFirebaseConfigured() && (
            <p className="auth-social-notice" role="status">
              Firebase Auth is not configured yet. Add <code>VITE_FIREBASE_*</code> keys to <code>.env.local</code>, or continue with email once configured.
            </p>
          )}

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="auth-field">
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">👤</span>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e) => update('name', e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 7l10 7 10-7" />
                  </svg>
                </span>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => update('email', e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="auth-field">
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon" aria-hidden="true">📱</span>
                    <input
                      type="tel"
                      className="auth-input"
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <div className="auth-input-wrap auth-input-wrap--textarea">
                    <textarea
                      className="auth-input auth-textarea"
                      placeholder="Address (optional)"
                      value={formData.address}
                      onChange={(e) => update('address', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="auth-field">
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input auth-input--password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => update('password', e.target.value)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {!isLogin && formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className="strength-fill"
                      style={{ width: `${(passwordStrength.score / 5) * 100}%`, background: passwordStrength.color }}
                    />
                  </div>
                  <span style={{ color: passwordStrength.color, fontSize: '0.75rem' }}>{passwordStrength.label}</span>
                </div>
              )}
            </div>

            {!isLogin && (
              <>
                <div className="auth-field">
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <span className="field-error">Passwords do not match</span>
                )}
                <div className="auth-field">
                  <div className="auth-input-wrap">
                    <input
                      type="password"
                      className="auth-input auth-input--no-icon"
                      placeholder="Admin setup code (optional)"
                      value={formData.adminSecret}
                      onChange={(e) => update('adminSecret', e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </>
            )}

            {isLogin && (
              <div className="auth-form-row">
                <label className="auth-remember">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <span>Remember me</span>
                </label>
                <button type="button" className="auth-link" onClick={() => setError('Password reset is not available yet. Contact your administrator.')}>
                  Forgot Password?
                </button>
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Please wait…' : (isLogin ? 'Log In' : 'Create Account')}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" className="auth-link auth-link--bold" onClick={toggleMode}>
              {isLogin ? 'Create an account' : 'Log in'}
            </button>
          </p>
        </div>

        <AuthPromoPanel />
      </div>
    </div>
  );
}
