/**
 * API keys are user-supplied in production (modal → localStorage).
 * Dev-only: optional VITE_* keys from .env.local (never baked into prod builds).
 */

function readDevGeminiKey() {
  if (!import.meta.env.DEV) return null;
  return import.meta.env.VITE_GEMINI_API_KEY || null;
}

function readDevGroqKey() {
  if (!import.meta.env.DEV) return null;
  return import.meta.env.VITE_GROQ_API_KEY || null;
}

export function loadStoredApiKeys() {
  const storedGemini = localStorage.getItem('buildx_api_key');
  const storedGroq = localStorage.getItem('buildx_groq_api_key');
  const devGemini = readDevGeminiKey();
  const devGroq = readDevGroqKey();

  let geminiKey = storedGemini || devGemini || null;
  let groqKey = storedGroq || devGroq || null;

  if (import.meta.env.DEV) {
    if (!storedGemini && devGemini) localStorage.setItem('buildx_api_key', devGemini);
    if (!storedGroq && devGroq) localStorage.setItem('buildx_groq_api_key', devGroq);
  }

  return { geminiKey, groqKey };
}
