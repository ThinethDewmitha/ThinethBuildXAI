/**
 * Validate Turso env vars and print setup steps.
 * Usage: node scripts/setup-turso.mjs
 */
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_LOCAL = join(ROOT, '.env.local');

function parseEnv(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

const local = existsSync(ENV_LOCAL) ? parseEnv(readFileSync(ENV_LOCAL, 'utf8')) : {};
const hasTurso = Boolean(local.TURSO_DATABASE_URL && local.TURSO_AUTH_TOKEN);

if (hasTurso) {
  console.log('Turso is configured in .env.local');
  console.log('  TURSO_DATABASE_URL:', local.TURSO_DATABASE_URL);
  console.log('\nPush to Vercel: node scripts/push-vercel-env.mjs');
  process.exit(0);
}

console.log(`Turso is not configured yet (production uses ephemeral /tmp SQLite).

1. Create a free database: https://turso.tech
2. Install CLI: curl -sSfL https://get.turso.tech/install.sh | bash
3. turso auth login
4. turso db create buildx-ai --region nrt
5. turso db show buildx-ai --url
6. turso db tokens create buildx-ai
7. Add to .env.local:
   TURSO_DATABASE_URL=libsql://buildx-ai-<org>.turso.io
   TURSO_AUTH_TOKEN=<token>
8. Push + redeploy:
   node scripts/push-vercel-env.mjs
   npx vercel --prod
`);
