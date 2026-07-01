/**
 * Print required Vercel environment variables (no secrets).
 * Run: node scripts/vercel-env-check.mjs
 */
const required = [
  'JWT_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_SECRET',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const optional = [
  'TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (recommended — persistent DB on Vercel)',
  'VITE_API_URL (/api when frontend + API share one Vercel domain)',
  'CORS_ORIGINS (only if API is on a different host)',
  'VITE_GEMINI_API_KEY (optional — users can enter key in app)',
];

console.log('Required Vercel environment variables:\n');
required.forEach((key) => console.log(`  - ${key}`));
console.log('\nOptional:\n');
optional.forEach((line) => console.log(`  - ${line}`));
console.log('\nFirebase: paste full service account JSON into FIREBASE_SERVICE_ACCOUNT_JSON');
console.log('JWT_SECRET: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
