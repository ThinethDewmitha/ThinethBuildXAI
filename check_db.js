import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'server', 'buildx.db');

const db = new Database(dbPath);

const project = db.prepare('SELECT * FROM projects ORDER BY created_at DESC LIMIT 1').get();
if (project) {
  console.log('LATEST_PROJECT_START');
  console.log(JSON.stringify(project, null, 2));
  console.log('LATEST_PROJECT_END');
} else {
  console.log('NO_PROJECTS_FOUND');
}
db.close();
