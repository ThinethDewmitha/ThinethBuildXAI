/**
 * Add a domain to Firebase Auth authorized domains (Identity Platform API).
 * Usage: node scripts/add-firebase-authorized-domain.mjs thineth-buildx-ai.vercel.app
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-09459610-efabb';
const domain = process.argv[2];

if (!domain) {
    console.error('Usage: node scripts/add-firebase-authorized-domain.mjs <domain>');
    process.exit(1);
}

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

const auth = new GoogleAuth({
    credentials: loadServiceAccount(),
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

const client = await auth.getClient();
const { token } = await client.getAccessToken();
if (!token) throw new Error('Failed to obtain access token');

const base = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`;
const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
};

const getRes = await fetch(base, { headers });
if (!getRes.ok) {
    console.error('getConfig failed:', getRes.status, await getRes.text());
    process.exit(1);
}

const config = await getRes.json();
const current = config.authorizedDomains || [];
console.log('Current authorized domains:', current.join(', '));

if (current.includes(domain)) {
    console.log(`"${domain}" is already authorized.`);
    process.exit(0);
}

const authorizedDomains = [...current, domain];
const patchRes = await fetch(`${base}?updateMask=authorizedDomains`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ authorizedDomains }),
});

if (!patchRes.ok) {
    console.error('updateConfig failed:', patchRes.status, await patchRes.text());
    process.exit(1);
}

const updated = await patchRes.json();
console.log('Updated authorized domains:', (updated.authorizedDomains || []).join(', '));
console.log(`Added "${domain}" successfully.`);
