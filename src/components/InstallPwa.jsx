import React, { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

export default function InstallPwa() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('buildx_pwa_dismissed') === '1'
  );

  useEffect(() => {
    if (isStandalone() || dismissed) return undefined;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, [dismissed]);

  useEffect(() => {
    if (!dismissed && isIos() && !isStandalone()) {
      setShowIosHint(true);
    }
  }, [dismissed]);

  const dismiss = () => {
    localStorage.setItem('buildx_pwa_dismissed', '1');
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosHint(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  if (dismissed || isStandalone()) return null;
  if (!deferredPrompt && !showIosHint) return null;

  return (
    <div className="pwa-install-banner" role="region" aria-label="Install app">
      <div className="pwa-install-inner">
        <div className="pwa-install-icon" aria-hidden="true">
          <Smartphone size={22} />
        </div>
        <div className="pwa-install-copy">
          <strong>Install BuildX AI</strong>
          {showIosHint && !deferredPrompt ? (
            <p>Tap <span className="pwa-install-share">Share</span> then <strong>Add to Home Screen</strong> for the full app experience on iOS.</p>
          ) : (
            <p>Add to your home screen for fast access on Android, PC, or tablet.</p>
          )}
        </div>
        <div className="pwa-install-actions">
          {deferredPrompt && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleInstall}>
              Install
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={dismiss}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
