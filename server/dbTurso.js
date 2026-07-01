/**
 * Turso / libSQL database backend (async) for production persistence on Vercel.
 */
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let client = null;
let schemaReady = null;

async function getClient() {
    if (!client) {
        const url = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;
        if (!url || !authToken) {
            throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required for Turso.');
        }
        client = createClient({ url, authToken });
    }
    if (!schemaReady) {
        schemaReady = (async () => {
            const schemaPath = join(__dirname, 'schema.sql');
            const sql = readFileSync(schemaPath, 'utf8');
            const statements = sql.split(';').map((s) => s.trim()).filter(Boolean);
            for (const statement of statements) {
                await client.execute(statement);
            }
        })();
    }
    await schemaReady;
    return client;
}

function parseProject(row) {
    if (!row) return null;
    return {
        ...row,
        specs: JSON.parse(row.specs || '{}'),
        ai_analysis: JSON.parse(row.ai_analysis || '{}'),
        estimate: JSON.parse(row.estimate || '{}'),
        photos_meta: JSON.parse(row.photos_meta || '[]'),
    };
}

export async function createUser({ id, name, email, phone, address, passwordHash, googleId = null, firebaseUid = null }) {
    const db = await getClient();
    await db.execute({
        sql: `INSERT INTO users (id, name, email, phone, address, password_hash, google_id, firebase_uid)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, name, email.toLowerCase().trim(), phone || '', address || '', passwordHash, googleId, firebaseUid],
    });
    return getUserById(id);
}

export async function getUserByEmail(email) {
    const db = await getClient();
    const result = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email.toLowerCase().trim()],
    });
    return result.rows[0] || null;
}

export async function getUserByGoogleId(googleId) {
    const db = await getClient();
    const result = await db.execute({
        sql: 'SELECT * FROM users WHERE google_id = ?',
        args: [googleId],
    });
    return result.rows[0] || null;
}

export async function linkGoogleAccount(userId, googleId) {
    const db = await getClient();
    await db.execute({
        sql: `UPDATE users SET google_id = ?, updated_at = datetime('now') WHERE id = ?`,
        args: [googleId, userId],
    });
    return getUserById(userId);
}

export async function getUserByFirebaseUid(firebaseUid) {
    const db = await getClient();
    const result = await db.execute({
        sql: 'SELECT * FROM users WHERE firebase_uid = ?',
        args: [firebaseUid],
    });
    return result.rows[0] || null;
}

export async function linkFirebaseAccount(userId, firebaseUid) {
    const db = await getClient();
    await db.execute({
        sql: `UPDATE users SET firebase_uid = ?, updated_at = datetime('now') WHERE id = ?`,
        args: [firebaseUid, userId],
    });
    return getUserById(userId);
}

export async function hasAdminUser() {
    const db = await getClient();
    const result = await db.execute('SELECT COUNT(*) as count FROM users WHERE is_admin = 1');
    return Number(result.rows[0]?.count || 0) > 0;
}

export async function getUserById(id) {
    const db = await getClient();
    const result = await db.execute({
        sql: `SELECT id, name, email, phone, address, is_admin, status, created_at, updated_at FROM users WHERE id = ?`,
        args: [id],
    });
    return result.rows[0] || null;
}

export async function getAllUsers() {
    const db = await getClient();
    const result = await db.execute(`
        SELECT u.id, u.name, u.email, u.phone, u.address, u.is_admin, u.status, u.created_at, u.updated_at,
               COUNT(p.id) as project_count
        FROM users u
        LEFT JOIN projects p ON p.user_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC
    `);
    return result.rows;
}

export async function updateUser(id, updates) {
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
    const db = await getClient();
    await db.execute({
        sql: `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        args: values,
    });
    return getUserById(id);
}

export async function deleteUser(id) {
    const db = await getClient();
    await db.execute({ sql: 'DELETE FROM projects WHERE user_id = ?', args: [id] });
    await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
}

export async function createProject({ id, userId, projectName, specs, aiAnalysis, estimate, photosMeta }) {
    const db = await getClient();
    await db.execute({
        sql: `INSERT INTO projects (id, user_id, project_name, specs, ai_analysis, estimate, photos_meta)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
            id, userId, projectName || 'Untitled Project',
            JSON.stringify(specs || {}),
            JSON.stringify(aiAnalysis || {}),
            JSON.stringify(estimate || {}),
            JSON.stringify(photosMeta || []),
        ],
    });
    return getProjectById(id);
}

export async function getProjectById(id) {
    const db = await getClient();
    const result = await db.execute({
        sql: 'SELECT * FROM projects WHERE id = ?',
        args: [id],
    });
    return parseProject(result.rows[0]);
}

export async function getProjectsByUser(userId) {
    const db = await getClient();
    const result = await db.execute({
        sql: 'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC',
        args: [userId],
    });
    return result.rows.map(parseProject);
}

export async function getAllProjects() {
    const db = await getClient();
    const result = await db.execute(`
        SELECT p.*, u.name as user_name, u.email as user_email
        FROM projects p
        LEFT JOIN users u ON u.id = p.user_id
        ORDER BY p.created_at DESC
    `);
    return result.rows.map(parseProject);
}

export async function updateProject(id, updates) {
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
    const db = await getClient();
    await db.execute({
        sql: `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
        args: values,
    });
    return getProjectById(id);
}

export async function deleteProject(id) {
    const db = await getClient();
    await db.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [id] });
}

export async function getDashboardStats() {
    const db = await getClient();
    const [totalUsers, activeUsers, totalProjects, completedProjects] = await Promise.all([
        db.execute('SELECT COUNT(*) as count FROM users'),
        db.execute("SELECT COUNT(*) as count FROM users WHERE status = 'active'"),
        db.execute('SELECT COUNT(*) as count FROM projects'),
        db.execute("SELECT COUNT(*) as count FROM projects WHERE status = 'completed'"),
    ]);
    return {
        totalUsers: Number(totalUsers.rows[0]?.count || 0),
        activeUsers: Number(activeUsers.rows[0]?.count || 0),
        totalProjects: Number(totalProjects.rows[0]?.count || 0),
        completedProjects: Number(completedProjects.rows[0]?.count || 0),
    };
}

export function getDatabaseMode() {
    return 'turso';
}
