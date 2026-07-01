/**
 * Push local env + Firebase service account to Vercel (production).
 * Usage: node scripts/push-vercel-env.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { randomBytes } from 'crypto';
import { spawnSync } from 'node:child_process';
import { join } from 'path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const SCOPE = process.env.VERCEL_SCOPE || 'thinas-projects-e5191ff6';
const TARGET = 'production';

function addEnv(name, value) {
    const result = spawnSync(
        'npx',
        ['vercel', 'env', 'add', name, TARGET, '--scope', SCOPE, '--yes', '--force'],
        { input: String(value), encoding: 'utf8', shell: true, cwd: ROOT },
    );
    if (result.status !== 0) {
        console.error(`Failed ${name}:`, result.stderr || result.stdout);
        process.exitCode = 1;
    } else {
        console.log(`✓ ${name}`);
    }
}

function parseEnvFile(path) {
    if (!existsSync(path)) return {};
    const out = {};
    for (const line of readFileSync(path, 'utf8').split('\n')) {
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

const local = parseEnvFile(join(ROOT, '.env.local'));
const jwtSecret = randomBytes(32).toString('hex');

const firebaseFile = local.FIREBASE_SERVICE_ACCOUNT_FILE
    || 'gen-lang-client-09459610-efabb-firebase-adminsdk-fbsvc-216b245e81.json';
const firebasePath = join(ROOT, firebaseFile);

if (!existsSync(firebasePath)) {
    console.error('Firebase service account file not found:', firebasePath);
    process.exit(1);
}

const serviceAccountJson = readFileSync(firebasePath, 'utf8').trim();

const vars = {
    JWT_SECRET: jwtSecret,
    ADMIN_EMAIL: local.ADMIN_EMAIL || 'thinethdewmitha123@gmail.com',
    ADMIN_SECRET: local.ADMIN_SECRET,
    FIREBASE_PROJECT_ID: local.FIREBASE_PROJECT_ID || local.VITE_FIREBASE_PROJECT_ID,
    FIREBASE_SERVICE_ACCOUNT_JSON: serviceAccountJson,
    VITE_API_URL: '/api',
    VITE_FIREBASE_API_KEY: local.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: local.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: local.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: local.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: local.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: local.VITE_FIREBASE_APP_ID,
};

if (local.VITE_GEMINI_API_KEY) {
    vars.VITE_GEMINI_API_KEY = local.VITE_GEMINI_API_KEY;
}

console.log(`Pushing ${Object.keys(vars).length} variables to Vercel (${TARGET})...\n`);

for (const [key, value] of Object.entries(vars)) {
    if (!value) {
        console.warn(`Skipping empty ${key}`);
        continue;
    }
    addEnv(key, value);
}

console.log('\nDone. Redeploy with: npx vercel --prod --scope', SCOPE);
