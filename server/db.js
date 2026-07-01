/**
 * BuildX AI – SQLite Database Layer
 * Handles users, projects, and submissions with better-sqlite3.
 */
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || join(__dirname, 'buildx.db');
const dbDir = dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    password_hash TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_name TEXT DEFAULT 'Untitled Project',
    specs TEXT DEFAULT '{}',
    ai_analysis TEXT DEFAULT '{}',
    estimate TEXT DEFAULT '{}',
    photos_meta TEXT DEFAULT '[]',
    status TEXT DEFAULT 'completed',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

// Migration: Google OAuth
try {
  db.exec(`ALTER TABLE users ADD COLUMN google_id TEXT`);
} catch {
  // column already exists
}
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL`);

// Migration: Firebase Auth
try {
  db.exec(`ALTER TABLE users ADD COLUMN firebase_uid TEXT`);
} catch {
  // column already exists
}
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid) WHERE firebase_uid IS NOT NULL`);

// ─── User Operations ──────────────────────────────────────────────────────────
export function createUser({ id, name, email, phone, address, passwordHash, googleId = null, firebaseUid = null }) {
    const stmt = db.prepare(`
    INSERT INTO users (id, name, email, phone, address, password_hash, google_id, firebase_uid)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(id, name, email.toLowerCase().trim(), phone || '', address || '', passwordHash, googleId, firebaseUid);
    return getUserById(id);
}

export function getUserByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
}

export function getUserByGoogleId(googleId) {
    return db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
}

export function linkGoogleAccount(userId, googleId) {
    db.prepare(`UPDATE users SET google_id = ?, updated_at = datetime('now') WHERE id = ?`).run(googleId, userId);
    return getUserById(userId);
}

export function getUserByFirebaseUid(firebaseUid) {
    return db.prepare('SELECT * FROM users WHERE firebase_uid = ?').get(firebaseUid);
}

export function linkFirebaseAccount(userId, firebaseUid) {
    db.prepare(`UPDATE users SET firebase_uid = ?, updated_at = datetime('now') WHERE id = ?`).run(firebaseUid, userId);
    return getUserById(userId);
}

export function hasAdminUser() {
    return db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get().count > 0;
}

export function getUserById(id) {
    return db.prepare('SELECT id, name, email, phone, address, is_admin, status, created_at, updated_at FROM users WHERE id = ?').get(id);
}

export function getAllUsers() {
    const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.address, u.is_admin, u.status, u.created_at, u.updated_at,
           COUNT(p.id) as project_count
    FROM users u
    LEFT JOIN projects p ON p.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();
    return users;
}

export function updateUser(id, updates) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(updates)) {
        if (['name', 'phone', 'address', 'status', 'is_admin', 'google_id', 'firebase_uid'].includes(key)) {
            fields.push(`${key} = ?`);
            values.push(val);
        }
    }
    if (fields.length === 0) return getUserById(id);
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return getUserById(id);
}

export function deleteUser(id) {
    db.prepare('DELETE FROM projects WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

// ─── Project Operations ───────────────────────────────────────────────────────
export function createProject({ id, userId, projectName, specs, aiAnalysis, estimate, photosMeta }) {
    const stmt = db.prepare(`
    INSERT INTO projects (id, user_id, project_name, specs, ai_analysis, estimate, photos_meta)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(
        id, userId, projectName || 'Untitled Project',
        JSON.stringify(specs || {}),
        JSON.stringify(aiAnalysis || {}),
        JSON.stringify(estimate || {}),
        JSON.stringify(photosMeta || [])
    );
    return getProjectById(id);
}

export function getProjectById(id) {
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!row) return null;
    return {
        ...row,
        specs: JSON.parse(row.specs),
        ai_analysis: JSON.parse(row.ai_analysis),
        estimate: JSON.parse(row.estimate),
        photos_meta: JSON.parse(row.photos_meta),
    };
}

export function getProjectsByUser(userId) {
    const rows = db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    return rows.map(row => ({
        ...row,
        specs: JSON.parse(row.specs),
        ai_analysis: JSON.parse(row.ai_analysis),
        estimate: JSON.parse(row.estimate),
        photos_meta: JSON.parse(row.photos_meta),
    }));
}

export function getAllProjects() {
    const rows = db.prepare(`
    SELECT p.*, u.name as user_name, u.email as user_email
    FROM projects p
    LEFT JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC
  `).all();
    return rows.map(row => ({
        ...row,
        specs: JSON.parse(row.specs),
        ai_analysis: JSON.parse(row.ai_analysis),
        estimate: JSON.parse(row.estimate),
        photos_meta: JSON.parse(row.photos_meta),
    }));
}

export function updateProject(id, updates) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(updates)) {
        if (['project_name', 'status'].includes(key)) {
            fields.push(`${key} = ?`);
            values.push(val);
        }
        if (['specs', 'ai_analysis', 'estimate', 'photos_meta'].includes(key)) {
            fields.push(`${key} = ?`);
            values.push(JSON.stringify(val));
        }
    }
    if (fields.length === 0) return getProjectById(id);
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return getProjectById(id);
}

export function deleteProject(id) {
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export function getDashboardStats() {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'active'").get().count;
    const totalProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
    const completedProjects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'completed'").get().count;
    return { totalUsers, activeUsers, totalProjects, completedProjects };
}

export default db;
