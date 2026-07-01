/**
 * Merge selected keys from a source env file into .env.local (preserves existing keys).
 * Usage: node scripts/merge-env-local.mjs .env.vercel.pull
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = join(ROOT, '.env.local');
const sourcePath = process.argv[2] ? join(ROOT, process.argv[2]) : null;

const KEYS = [
  'VITE_API_URL',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_SERVICE_ACCOUNT_FILE',
  'JWT_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_SECRET',
  'PORT',
  'CORS_ORIGINS',
];

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

function serializeEnv(map, comments = []) {
  const lines = [
    '# Local dev only — gitignored. Restart `npm run dev` after changes.',
    ...comments,
    '',
  ];
  for (const key of KEYS) {
    if (map[key] !== undefined && map[key] !== '') {
      lines.push(`${key}=${map[key]}`);
    }
  }
  const extraKeys = Object.keys(map).filter((k) => !KEYS.includes(k)).sort();
  if (extraKeys.length) {
    lines.push('');
    lines.push('# Other local keys');
    for (const key of extraKeys) {
      if (map[key] !== undefined && map[key] !== '') {
        lines.push(`${key}=${map[key]}`);
      }
    }
  }
  lines.push('');
  return lines.join('\n');
}

const existing = existsSync(TARGET) ? parseEnv(readFileSync(TARGET, 'utf8')) : {};
const source = sourcePath && existsSync(sourcePath) ? parseEnv(readFileSync(sourcePath, 'utf8')) : {};

const merged = { ...existing };
for (const key of KEYS) {
  if (source[key]) merged[key] = source[key];
}

if (!merged.FIREBASE_SERVICE_ACCOUNT_FILE && !merged.FIREBASE_SERVICE_ACCOUNT_JSON) {
  merged.FIREBASE_SERVICE_ACCOUNT_FILE = 'gen-lang-client-09459610-efabb-firebase-adminsdk-fbsvc-216b245e81.json';
}
if (!merged.FIREBASE_PROJECT_ID && merged.VITE_FIREBASE_PROJECT_ID) {
  merged.FIREBASE_PROJECT_ID = merged.VITE_FIREBASE_PROJECT_ID;
}
if (!merged.VITE_API_URL) merged.VITE_API_URL = '/api';
if (!merged.PORT) merged.PORT = '3001';

const missing = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID']
  .filter((k) => !merged[k]);

if (missing.length) {
  console.error('Missing required Firebase keys:', missing.join(', '));
  process.exit(1);
}

writeFileSync(TARGET, serializeEnv(merged, [
  '# Firebase client + server (from Vercel production env)',
]), 'utf8');

console.log('Updated .env.local with Firebase configuration.');
console.log('Keys set:', KEYS.filter((k) => merged[k]).join(', '));
