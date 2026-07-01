import { readFileSync } from 'fs';
const t = readFileSync(process.argv[2], 'utf8');
const keys = process.argv.slice(3);
for (const k of keys) {
  const line = t.split('\n').find((l) => l.startsWith(`${k}=`));
  const raw = line ? line.slice(k.length + 1).trim() : '';
  const v = raw.replace(/^"|"$/g, '');
  console.log(`${k}: ${v ? `set (len ${v.length})` : 'MISSING/EMPTY'}`);
}
