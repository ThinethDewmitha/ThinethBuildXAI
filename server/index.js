/**
 * BuildX AI – Express Backend Server
 */
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

import {
    createUser, getUserByEmail, getUserById, getUserByFirebaseUid, getAllUsers, updateUser, deleteUser,
    createProject, getProjectById, getProjectsByUser, getAllProjects, updateProject, deleteProject,
    getDashboardStats, hasAdminUser, linkFirebaseAccount, getDatabaseMode,
} from './db.js';
import { getFirebaseAdmin, verifyFirebaseIdToken } from '../config/firebaseAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

function loadEnvFile(filename) {
    const path = join(ROOT_DIR, filename);
    if (!fs.existsSync(path)) return;
    for (const line of fs.readFileSync(path, 'utf8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
    }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || (isProd ? null : 'buildx-dev-only-secret');
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

if (!JWT_SECRET) {
    console.error('FATAL: Set JWT_SECRET in production.');
    process.exit(1);
}
if (isProd && !ADMIN_EMAIL) {
    console.warn('WARN: ADMIN_EMAIL not set — no one can register as admin.');
}

const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const app = express();

app.use(cors({
    origin: (origin, cb) => {
        if (!origin || corsOrigins.length === 0 || corsOrigins.includes(origin)) {
            cb(null, true);
        } else {
            cb(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Simple in-memory rate limit for auth routes
const rateBuckets = new Map();
function rateLimit(windowMs, max) {
    return (req, res, next) => {
        const key = `${req.ip}:${req.path}`;
        const now = Date.now();
        let bucket = rateBuckets.get(key);
        if (!bucket || now > bucket.reset) {
            bucket = { count: 0, reset: now + windowMs };
            rateBuckets.set(key, bucket);
        }
        bucket.count += 1;
        if (bucket.count > max) {
            return res.status(429).json({ error: 'Too many attempts. Please wait a minute and try again.' });
        }
        next();
    };
}

const uploadsDir = process.env.UPLOADS_DIR || join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

function safeFilename(originalName) {
    const base = (originalName || 'photo').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    return `${Date.now()}-${base}`;
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => cb(null, safeFilename(file.originalname)),
});
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype?.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image uploads are allowed'));
    },
});

function isFirebaseIdToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        return typeof payload.iss === 'string' && payload.iss.includes('securetoken.google.com');
    } catch {
        return false;
    }
}

function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const finishWithUser = (user) => {
        if (!user) return res.status(401).json({ error: 'User not found' });
        if (user.status === 'suspended') return res.status(403).json({ error: 'Account suspended' });
        req.user = user;
        next();
    };

    (async () => {
        try {
            const firebaseAdminInit = await getFirebaseAdmin(ROOT_DIR);
            const firebaseApp = firebaseAdminInit?.app || null;

            if (firebaseApp) {
                try {
                    const decoded = await verifyFirebaseIdToken(firebaseApp, token);
                    let user = await getUserByFirebaseUid(decoded.uid);
                    if (!user && decoded.email) {
                        const existing = await getUserByEmail(decoded.email);
                        if (existing) {
                            user = existing.firebase_uid
                                ? existing
                                : await linkFirebaseAccount(existing.id, decoded.uid);
                        }
                    }
                    return finishWithUser(user);
                } catch {
                    if (isFirebaseIdToken(token)) {
                        return res.status(401).json({ error: 'Invalid or expired token' });
                    }
                    try {
                        const decoded = jwt.verify(token, JWT_SECRET);
                        return finishWithUser(await getUserById(decoded.userId));
                    } catch {
                        return res.status(401).json({ error: 'Invalid or expired token' });
                    }
                }
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            finishWithUser(await getUserById(decoded.userId));
        } catch {
            res.status(500).json({ error: 'Authentication service unavailable.' });
        }
    })();
}

function adminMiddleware(req, res, next) {
    if (!req.user?.is_admin) return res.status(403).json({ error: 'Admin access required' });
    next();
}

function grantAdminOnRegister(email, adminSecret) {
    if (!ADMIN_EMAIL || !ADMIN_SECRET) return false;
    return email.toLowerCase().trim() === ADMIN_EMAIL && adminSecret === ADMIN_SECRET;
}

function toPublicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        isAdmin: !!user.is_admin,
        status: user.status,
    };
}

function issueAuthToken(user) {
    return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

async function upsertUserFromFirebaseProfile(decoded, profile = {}) {
    const email = (decoded.email || profile.email || '').toLowerCase().trim();
    const firebaseUid = decoded.uid;
    const displayName = profile.name || decoded.name || email.split('@')[0] || 'User';

    let user = await getUserByFirebaseUid(firebaseUid);
    if (!user && email) {
        const existing = await getUserByEmail(email);
        if (existing) {
            if (existing.firebase_uid && existing.firebase_uid !== firebaseUid) {
                throw new Error('This email is linked to a different account.');
            }
            user = existing.firebase_uid
                ? existing
                : await linkFirebaseAccount(existing.id, firebaseUid);
        }
    }

    if (!user) {
        const id = 'user_' + uuidv4().replace(/-/g, '').substring(0, 12);
        const passwordHash = bcrypt.hashSync('firebase:' + uuidv4(), 10);
        user = await createUser({
            id,
            name: displayName,
            email: email || `${firebaseUid}@firebase.local`,
            phone: profile.phone || '',
            address: profile.address || '',
            passwordHash,
            firebaseUid,
        });

        const isAdminRequest = grantAdminOnRegister(email, profile.adminSecret);
        if (isAdminRequest && !(await hasAdminUser())) {
            await updateUser(id, { is_admin: 1 });
            user = await getUserById(id);
        }
    } else {
        const updates = {};
        if (profile.name) updates.name = profile.name;
        if (profile.phone) updates.phone = profile.phone;
        if (profile.address) updates.address = profile.address;
        if (Object.keys(updates).length) {
            user = await updateUser(user.id, updates);
        }
    }

    return getUserById(user.id);
}

app.post('/api/auth/register', rateLimit(60_000, 10), async (req, res) => {
    try {
        const { name, email, phone, address, password, adminSecret } = req.body;
        const normalizedEmail = (email || '').toLowerCase().trim();

        if (!name || !normalizedEmail || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        }
        if (await getUserByEmail(normalizedEmail)) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        const isAdminRequest = grantAdminOnRegister(normalizedEmail, adminSecret);
        if (isAdminRequest && (await hasAdminUser())) {
            return res.status(403).json({ error: 'An admin account already exists.' });
        }

        const passwordHash = bcrypt.hashSync(password, 10);
        const id = 'user_' + uuidv4().replace(/-/g, '').substring(0, 12);
        await createUser({ id, name, email: normalizedEmail, phone, address, passwordHash });

        if (isAdminRequest) {
            await updateUser(id, { is_admin: 1 });
        }

        const freshUser = await getUserById(id);
        const token = issueAuthToken(freshUser);

        res.status(201).json({
            token,
            user: toPublicUser(freshUser),
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

app.post('/api/auth/login', rateLimit(60_000, 20), async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = (email || '').toLowerCase().trim();
        if (!normalizedEmail || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await getUserByEmail(normalizedEmail);
        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        if (user.status === 'suspended') {
            return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
        }

        const token = issueAuthToken(user);
        res.json({
            token,
            user: toPublicUser(user),
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ user: toPublicUser(req.user) });
});

app.post('/api/auth/session', rateLimit(60_000, 20), async (req, res) => {
    try {
        const firebaseAdminInit = await getFirebaseAdmin(ROOT_DIR);
        const firebaseApp = firebaseAdminInit?.app || null;
        if (!firebaseApp) {
            return res.status(503).json({
                error: 'Firebase Auth is not configured on the server. Set FIREBASE_SERVICE_ACCOUNT_JSON.',
            });
        }

        const { idToken, name, phone, address, adminSecret } = req.body;
        if (!idToken) {
            return res.status(400).json({ error: 'Firebase ID token is required.' });
        }

        const decoded = await verifyFirebaseIdToken(firebaseApp, idToken);

        const user = await upsertUserFromFirebaseProfile(decoded, { name, phone, address, adminSecret });
        if (user.status === 'suspended') {
            return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
        }

        res.json({ user: toPublicUser(user) });
    } catch (err) {
        console.error('Firebase session error:', err);
        res.status(401).json({ error: err.message || 'Sign-in failed. Please try again.' });
    }
});

app.put('/api/users/profile', authMiddleware, async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        const updated = await updateUser(req.user.id, { name, phone, address });
        res.json({ user: updated });
    } catch {
        res.status(500).json({ error: 'Failed to update profile.' });
    }
});

app.post('/api/projects', authMiddleware, async (req, res) => {
    try {
        const { projectName, specs, aiAnalysis, estimate, photosMeta } = req.body;
        const id = 'proj_' + uuidv4().replace(/-/g, '').substring(0, 12);
        const project = await createProject({
            id,
            userId: req.user.id,
            projectName,
            specs,
            aiAnalysis,
            estimate,
            photosMeta,
        });
        res.status(201).json({ project });
    } catch (err) {
        console.error('Create project error:', err);
        res.status(500).json({ error: 'Failed to save project.' });
    }
});

app.get('/api/projects', authMiddleware, async (req, res) => {
    try {
        res.json({ projects: await getProjectsByUser(req.user.id) });
    } catch {
        res.status(500).json({ error: 'Failed to load projects.' });
    }
});

app.get('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
        const project = await getProjectById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found.' });
        if (project.user_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ error: 'Access denied.' });
        }
        res.json({ project });
    } catch {
        res.status(500).json({ error: 'Failed to load project.' });
    }
});

app.put('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
        const project = await getProjectById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found.' });
        if (project.user_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ error: 'Access denied.' });
        }
        res.json({ project: await updateProject(req.params.id, req.body) });
    } catch {
        res.status(500).json({ error: 'Failed to update project.' });
    }
});

app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
    try {
        const project = await getProjectById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found.' });
        if (project.user_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ error: 'Access denied.' });
        }
        await deleteProject(req.params.id);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to delete project.' });
    }
});

app.post('/api/projects/upload-photos', authMiddleware, upload.array('photos', 5), (req, res) => {
    try {
        const photosMeta = req.files.map(f => ({
            filename: f.filename,
            originalName: f.originalname,
            path: `/uploads/${f.filename}`,
            size: f.size,
            mimeType: f.mimetype,
        }));
        res.json({ photos: photosMeta });
    } catch {
        res.status(500).json({ error: 'Failed to upload photos.' });
    }
});

app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        res.json({ stats: await getDashboardStats() });
    } catch {
        res.status(500).json({ error: 'Failed to load stats.' });
    }
});

app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await getAllUsers();
        res.json({ users: users.map(u => ({ ...u, isAdmin: !!u.is_admin })) });
    } catch {
        res.status(500).json({ error: 'Failed to load users.' });
    }
});

app.get('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = await getUserById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json({ user: { ...user, isAdmin: !!user.is_admin }, projects: await getProjectsByUser(req.params.id) });
    } catch {
        res.status(500).json({ error: 'Failed to load user details.' });
    }
});

app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const updated = await updateUser(req.params.id, req.body);
        res.json({ user: { ...updated, isAdmin: !!updated.is_admin } });
    } catch {
        res.status(500).json({ error: 'Failed to update user.' });
    }
});

app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own admin account.' });
        }
        await deleteUser(req.params.id);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to delete user.' });
    }
});

app.get('/api/admin/projects', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        res.json({ projects: await getAllProjects() });
    } catch {
        res.status(500).json({ error: 'Failed to load projects.' });
    }
});

app.put('/api/admin/projects/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        res.json({ project: await updateProject(req.params.id, req.body) });
    } catch {
        res.status(500).json({ error: 'Failed to update project.' });
    }
});

app.delete('/api/admin/projects/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await deleteProject(req.params.id);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to delete project.' });
    }
});

app.get('/api/health', (_req, res) => {
    res.json({
        ok: true,
        firebase: Boolean(
            process.env.FIREBASE_SERVICE_ACCOUNT_JSON
            || process.env.FIREBASE_SERVICE_ACCOUNT_FILE
            || process.env.FIREBASE_PROJECT_ID
        ),
        database: getDatabaseMode(),
        runtime: process.env.VERCEL ? 'vercel' : 'node',
    });
});

export default app;

if (!process.env.VERCEL) {
    app.listen(PORT, async () => {
        console.log(`\n🏗️  BuildX AI Backend running on http://localhost:${PORT}`);
        console.log(`   API: http://localhost:${PORT}/api`);
        if (!isProd) console.log(`   CORS: ${corsOrigins.length ? corsOrigins.join(', ') : 'all origins (dev)'}`);
        const firebaseAdminInit = await getFirebaseAdmin(ROOT_DIR);
        console.log(`   Database: ${getDatabaseMode()}`);
        if (firebaseAdminInit?.app) {
            const fileLabel = firebaseAdminInit.sourceFile?.split(/[/\\]/).pop();
            console.log(`   Firebase Auth: configured${fileLabel ? ` (${fileLabel})` : ''}`);
        } else {
            console.log('   Firebase Auth: not configured — set FIREBASE_SERVICE_ACCOUNT_JSON');
        }
        if (!isProd) console.log('');
        else console.log('');
    });
}
