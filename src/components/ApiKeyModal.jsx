import React, { useState } from 'react';
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
            console.error('API Validation failed:', result.rawError);
        }

        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card">
                <h2 className="modal-title">🔑 Connect Your AI</h2>
                <p className="modal-desc">
                    BuildX AI uses Google's Gemini to analyze your site photos and provide engineering guidance.
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
                        <div>Click <strong>"Create API Key"</strong> and select any project (or create one).</div>
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
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading || success || !key.trim()}
                    >
                        {loading ? '⏳' : success ? '✓' : 'Connect'}
                    </button>
                </div>

                {error && (
                    <div className="modal-error" style={{ textAlign: 'left' }}>
                        <div>⚠️ {error}</div>
                        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <strong>Still stuck?</strong> Try these:
                            <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                                <li>Wait 5 minutes (Google needs time to sync).</li>
                                <li>Ensure a <strong>Billing Account</strong> is linked to your Cloud Project.</li>
                                <li><strong>Highly Recommended:</strong> Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">AI Studio</a> and create a <strong>New Key</strong>. AI Studio keys bypass most Cloud Console issues.</li>
                            </ul>
                        </div>
                    </div>
                )}
                {success && <div className="modal-success">✅ Connected! Launching BuildX AI...</div>}

                <div className="modal-footer" style={{ marginTop: '24px', textAlign: 'center' }}>
                    <button className="btn btn-text" onClick={() => (window.location.reload())}>
                        ✖ Close & Home
                    </button>
                </div>
            </div>
        </div>
    );
}
