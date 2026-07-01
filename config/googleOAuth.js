/**
 * Load Google OAuth credentials from env or client_secret_*.json in project root.
 */
import fs from 'fs';
import { join } from 'path';

export function findGoogleCredentialsFile(rootDir) {
    const explicit = process.env.GOOGLE_CREDENTIALS_FILE;
    if (explicit) {
        const path = join(rootDir, explicit);
        if (fs.existsSync(path)) return path;
    }

    if (!fs.existsSync(rootDir)) return null;

    const match = fs.readdirSync(rootDir).find(
        (name) => name.startsWith('client_secret_') && name.endsWith('.json')
    );
    return match ? join(rootDir, match) : null;
}

export function loadGoogleOAuthCredentials(rootDir) {
    const fromEnv = {
        clientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    };
    if (fromEnv.clientId) return fromEnv;

    const filePath = findGoogleCredentialsFile(rootDir);
    if (!filePath) return null;

    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const web = data.web || data.installed;
        if (!web?.client_id) return null;
        return {
            clientId: web.client_id,
            clientSecret: web.client_secret || '',
            projectId: web.project_id || '',
            javascriptOrigins: web.javascript_origins || [],
            sourceFile: filePath,
        };
    } catch {
        return null;
    }
}

export function applyGoogleOAuthEnv(rootDir) {
    const creds = loadGoogleOAuthCredentials(rootDir);
    if (!creds?.clientId) return null;

    if (!process.env.GOOGLE_CLIENT_ID) process.env.GOOGLE_CLIENT_ID = creds.clientId;
    if (!process.env.VITE_GOOGLE_CLIENT_ID) process.env.VITE_GOOGLE_CLIENT_ID = creds.clientId;
    if (!process.env.GOOGLE_CLIENT_SECRET && creds.clientSecret) {
        process.env.GOOGLE_CLIENT_SECRET = creds.clientSecret;
    }
    if (!process.env.VITE_GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID) {
        process.env.VITE_GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    }
    if (!process.env.GOOGLE_CLIENT_ID && process.env.VITE_GOOGLE_CLIENT_ID) {
        process.env.GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
    }
    return creds;
}
