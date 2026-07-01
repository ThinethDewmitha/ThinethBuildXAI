/**
 * Create or update a Firebase Auth email/password user (dev/admin).
 * Usage: node scripts/set-firebase-user.mjs <email> <password> [displayName]
 */
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getFirebaseAdmin } from '../config/firebaseAdmin.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];
const displayName = process.argv[4] || email?.split('@')[0] || 'User';

if (!email || !password) {
    console.error('Usage: node scripts/set-firebase-user.mjs <email> <password> [displayName]');
    process.exit(1);
}

if (password.length < 6) {
    console.error('Firebase requires passwords of at least 6 characters.');
    process.exit(1);
}

const adminInit = await getFirebaseAdmin(ROOT);
if (!adminInit?.app) {
    console.error('Firebase Admin is not configured.');
    process.exit(1);
}

const { getAuth } = await import('firebase-admin/auth');
const auth = getAuth(adminInit.app);

let user;
try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, {
        password,
        displayName,
        emailVerified: true,
    });
    console.log(`Updated existing user: ${email} (uid: ${user.uid})`);
} catch (err) {
    if (err?.code !== 'auth/user-not-found') {
        console.error('Firebase error:', err.message || err);
        process.exit(1);
    }
    user = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true,
    });
    console.log(`Created new user: ${email} (uid: ${user.uid})`);
}

console.log('You can now sign in with this email and password in the app.');
