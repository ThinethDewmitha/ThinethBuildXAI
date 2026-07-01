/**
 * Initialize Firebase Admin SDK from service account JSON or env.
 * Uses dynamic import for firebase-admin/app and jose (avoids jwks-rsa CJS/ESM crash on Vercel).
 */
import fs from 'fs';
import { join } from 'path';

/** @type {Promise<{ app: import('firebase-admin/app').App; sourceFile: string | null } | null> | null} */
let initPromise = null;

export function findFirebaseServiceAccountFile(rootDir) {
    const explicit = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
    if (explicit) {
        const path = join(rootDir, explicit);
        if (fs.existsSync(path)) return path;
    }

    if (!fs.existsSync(rootDir)) return null;

    const match = fs.readdirSync(rootDir).find((name) => (
        name.endsWith('.json')
        && !name.startsWith('client_secret_')
        && (name.includes('firebase-adminsdk') || name.startsWith('firebase-service-account'))
    ));

    return match ? join(rootDir, match) : null;
}

function parseServiceAccountJson(raw) {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        try {
            return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
        } catch {
            return null;
        }
    }
}

async function initFromServiceAccount(serviceAccount, sourceLabel) {
    const { initializeApp, cert, getApps } = await import('firebase-admin/app');
    if (getApps().length) {
        return { app: getApps()[0], sourceFile: null };
    }
    const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
    });
    return { app, sourceFile: sourceLabel };
}

export async function getFirebaseAdmin(rootDir) {
    if (!initPromise) {
        initPromise = (async () => {
            const envAccount = parseServiceAccountJson(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            if (envAccount?.project_id) {
                return initFromServiceAccount(envAccount, 'FIREBASE_SERVICE_ACCOUNT_JSON');
            }

            const filePath = findFirebaseServiceAccountFile(rootDir);
            if (filePath) {
                const serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                return initFromServiceAccount(serviceAccount, filePath);
            }

            const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
            if (!projectId) return null;

            console.warn('Firebase Admin: set FIREBASE_SERVICE_ACCOUNT_JSON or add firebase-adminsdk-*.json to project root.');
            return null;
        })();
    }
    return initPromise;
}

export async function verifyFirebaseIdToken(app, idToken) {
    const projectId = app?.options?.projectId
        || process.env.FIREBASE_PROJECT_ID
        || process.env.VITE_FIREBASE_PROJECT_ID;

    if (!projectId) {
        throw new Error('Firebase project ID is not configured.');
    }

    const { createRemoteJWKSet, jwtVerify } = await import('jose');

    const jwks = createRemoteJWKSet(
        new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
    );

    const { payload } = await jwtVerify(idToken, jwks, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
    });

    return {
        ...payload,
        uid: payload.sub,
        email: payload.email,
        email_verified: payload.email_verified,
        name: payload.name,
    };
}
