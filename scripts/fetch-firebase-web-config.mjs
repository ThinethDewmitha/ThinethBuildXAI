/**
 * Fetch Firebase web app config and merge into .env.local.
 * Usage: node scripts/fetch-firebase-web-config.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-09459610-efabb';
const ENV_LOCAL = join(ROOT, '.env.local');

function loadServiceAccount() {
    const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (fromEnv) return JSON.parse(fromEnv);

    const file = process.env.FIREBASE_SERVICE_ACCOUNT_FILE
        || 'gen-lang-client-09459610-efabb-firebase-adminsdk-fbsvc-216b245e81.json';
    const path = join(ROOT, file);
    if (!existsSync(path)) {
        throw new Error(`Service account file not found: ${path}`);
    }
    return JSON.parse(readFileSync(path, 'utf8'));
}

function parseEnv(text) {
    const out = {};
    for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        out[key] = val;
    }
    return out;
}

const auth = new GoogleAuth({
    credentials: loadServiceAccount(),
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

const client = await auth.getClient();
const { token } = await client.getAccessToken();
if (!token) throw new Error('Failed to obtain access token');

const headers = { Authorization: `Bearer ${token}` };
const listUrl = `https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/webApps`;
const listRes = await fetch(listUrl, { headers });
if (!listRes.ok) {
    console.error('List web apps failed:', listRes.status, await listRes.text());
    process.exit(1);
}

const { apps = [] } = await listRes.json();
if (!apps.length) {
    console.error('No Firebase web apps found. Create one in Firebase Console → Project settings → Your apps.');
    process.exit(1);
}

const appName = apps[0].name;
const configUrl = `https://firebase.googleapis.com/v1beta1/${appName}/config`;
const configRes = await fetch(configUrl, { headers });
if (!configRes.ok) {
    console.error('Get web config failed:', configRes.status, await configRes.text());
    process.exit(1);
}

const config = await configRes.json();
const firebaseEnv = {
    VITE_FIREBASE_API_KEY: config.apiKey,
    VITE_FIREBASE_AUTH_DOMAIN: config.authDomain,
    VITE_FIREBASE_PROJECT_ID: config.projectId || PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: config.storageBucket,
    VITE_FIREBASE_MESSAGING_SENDER_ID: config.messagingSenderId,
    VITE_FIREBASE_APP_ID: config.appId,
    FIREBASE_PROJECT_ID: config.projectId || PROJECT_ID,
    FIREBASE_SERVICE_ACCOUNT_FILE: 'gen-lang-client-09459610-efabb-firebase-adminsdk-fbsvc-216b245e81.json',
    VITE_API_URL: '/api',
    PORT: '3001',
};

const missing = Object.entries(firebaseEnv)
    .filter(([k]) => k.startsWith('VITE_FIREBASE_'))
    .filter(([, v]) => !v);
if (missing.length) {
    console.error('Incomplete Firebase web config:', missing.map(([k]) => k).join(', '));
    process.exit(1);
}

const existing = existsSync(ENV_LOCAL) ? parseEnv(readFileSync(ENV_LOCAL, 'utf8')) : {};
const merged = { ...existing, ...firebaseEnv };

const lines = [
    '# Local dev only — gitignored. Restart `npm run dev` after changes.',
    '# Firebase client + server',
    '',
    ...Object.entries(firebaseEnv).map(([k, v]) => `${k}=${v}`),
    '',
    '# Other local keys',
];

const reserved = new Set([...Object.keys(firebaseEnv), 'VERCEL_OIDC_TOKEN']);
for (const [k, v] of Object.entries(existing)) {
    if (!reserved.has(k) && v) lines.push(`${k}=${v}`);
}
lines.push('');

writeFileSync(ENV_LOCAL, lines.join('\n'), 'utf8');
console.log('Wrote Firebase web config to .env.local');
console.log('Web app:', apps[0].displayName || appName);
console.log('Restart the dev server: npm run dev');
