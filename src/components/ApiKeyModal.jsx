import React, { useState } from 'react';
import { Key, Loader2, Check, AlertTriangle, X } from 'lucide-react';
import { validateApiKey } from '../services/gemini';

export default function ApiKeyModal({ onKeySet }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!key.trim()) {
      setError('Please enter your API key.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await validateApiKey(key.trim());

    if (result.valid) {
      setSuccess(true);
      setTimeout(() => onKeySet(key.trim()), 800);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card">
        <h2 className="modal-title">
          <Key size={22} className="modal-title-icon" />
          Connect Your AI
        </h2>
        <p className="modal-desc">
          BuildX AI uses Google&apos;s Gemini to analyze your site photos and provide engineering guidance.
          You need a free API key to get started.
        </p>

        <div className="modal-steps">
          <div className="modal-step">
            <div className="modal-step-num">1</div>
            <div>
              Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a> and sign in with your Google account.
            </div>
          </div>
          <div className="modal-step">
            <div className="modal-step-num">2</div>
            <div>Click <strong>&quot;Create API Key&quot;</strong> and select any project (or create one).</div>
          </div>
          <div className="modal-step">
            <div className="modal-step-num">3</div>
            <div>Copy the key and paste it below. It stays only on your device.</div>
          </div>
        </div>

        <div className="modal-input-group">
          <input
            type="password"
            className="form-input"
            placeholder="Paste your Gemini API key here..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || success}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || success || !key.trim()}
          >
            {loading ? <Loader2 size={16} className="spin" /> : success ? <Check size={16} /> : 'Connect'}
          </button>
        </div>

        {error && (
          <div className="modal-error" style={{ textAlign: 'left' }}>
            <div><AlertTriangle size={14} /> {error}</div>
          </div>
        )}
        {success && (
          <div className="modal-success">
            <Check size={14} /> Connected! Launching BuildX AI...
          </div>
        )}

        <div className="modal-footer" style={{ marginTop: '24px', textAlign: 'center' }}>
          <button type="button" className="btn btn-text" onClick={() => window.location.reload()}>
            <X size={14} /> Close &amp; Home
          </button>
        </div>
      </div>
    </div>
  );
}
