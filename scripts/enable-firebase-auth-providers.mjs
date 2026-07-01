/**
 * Enable Firebase Auth sign-in providers via Identity Platform API.
 * Usage: node scripts/enable-firebase-auth-providers.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-09459610-efabb';

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
console.log('Current sign-in providers:');
console.log('  Email:', config.signIn?.email?.enabled ? 'enabled' : 'disabled');
console.log('  Anonymous:', config.signIn?.anonymous?.enabled ? 'enabled' : 'disabled');

const patchBody = {
    signIn: {
        email: {
            enabled: true,
            passwordRequired: true,
        },
        anonymous: {
            enabled: config.signIn?.anonymous?.enabled ?? false,
        },
    },
};

const patchRes = await fetch(`${base}?updateMask=signIn.email,signIn.anonymous`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(patchBody),
});

if (!patchRes.ok) {
    console.error('updateConfig failed:', patchRes.status, await patchRes.text());
    process.exit(1);
}

const updated = await patchRes.json();
console.log('Updated sign-in providers:');
console.log('  Email:', updated.signIn?.email?.enabled ? 'enabled' : 'disabled');
console.log('Email/Password sign-in is now enabled.');
