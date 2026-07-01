import React, { useState } from 'react';
import { Key, Loader2, Check, AlertTriangle, X, Zap } from 'lucide-react';
import { validateGeminiKey, validateGroqKey } from '../services/ai';

export default function ApiKeyModal({ onKeySet }) {
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!geminiKey.trim()) {
      setError('Gemini API key is required.');
      return;
    }

    setLoading(true);
    setError('');

    const geminiResult = await validateGeminiKey(geminiKey.trim());
    if (!geminiResult.valid) {
      setError(`Gemini: ${geminiResult.error}`);
      setLoading(false);
      return;
    }

    if (groqKey.trim()) {
      const groqResult = await validateGroqKey(groqKey.trim());
      if (!groqResult.valid) {
        setError(`Groq: ${groqResult.error}`);
        setLoading(false);
        return;
      }
    }

    setSuccess(true);
    setTimeout(() => {
      onKeySet({
        geminiKey: geminiKey.trim(),
        groqKey: groqKey.trim() || null,
      });
    }, 800);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card modal-content--wide">
        <h2 className="modal-title">
          <Key size={22} className="modal-title-icon" />
          Connect Your AI
        </h2>
        <p className="modal-desc">
          BuildX AI uses a <strong>dual-AI pipeline</strong> for best results:
          <strong> Gemini</strong> analyzes your site photos, and <strong>Groq</strong> (optional but recommended)
          cross-checks and merges the report for sharper engineering output.
        </p>

        <div className="modal-ai-grid">
          <div className="modal-ai-card">
            <h3 className="modal-ai-card-title">Google Gemini <span className="modal-ai-required">Required</span></h3>
            <p className="modal-ai-card-desc">Vision analysis of site photos and blueprint image generation.</p>
            <div className="modal-steps modal-steps--compact">
              <div className="modal-step">
                <div className="modal-step-num">1</div>
                <div>
                  Get a free key at{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>
                </div>
              </div>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder="Gemini API key (starts with AIza…)"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || success}
            />
          </div>

          <div className="modal-ai-card modal-ai-card--groq">
            <h3 className="modal-ai-card-title">
              <Zap size={16} /> Groq <span className="modal-ai-optional">Recommended</span>
            </h3>
            <p className="modal-ai-card-desc">
              Fast second pass — vision cross-check + merged final blueprint. Keys stay on your device only.
            </p>
            <div className="modal-steps modal-steps--compact">
              <div className="modal-step">
                <div className="modal-step-num">1</div>
                <div>
                  Get a free key at{' '}
                  <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">Groq Console</a>
                </div>
              </div>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder="Groq API key (starts with gsk_…) — optional"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || success}
            />
          </div>
        </div>

        <div className="modal-input-group modal-input-group--connect">
          <button
            type="button"
            className="btn btn-primary btn-large"
            onClick={handleSubmit}
            disabled={loading || success || !geminiKey.trim()}
          >
            {loading ? <Loader2 size={16} className="spin" /> : success ? <Check size={16} /> : 'Connect AI'}
          </button>
        </div>

        {error && (
          <div className="modal-error" style={{ textAlign: 'left' }}>
            <div><AlertTriangle size={14} /> {error}</div>
          </div>
        )}
        {success && (
          <div className="modal-success">
            <Check size={14} />
            {groqKey.trim() ? 'Gemini + Groq connected!' : 'Gemini connected!'} Launching BuildX AI…
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
