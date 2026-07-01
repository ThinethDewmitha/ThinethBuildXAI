/**
 * BuildX AI – Firebase Authentication (client)
 */
import { initializeApp, getApps } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendEmailVerification,
    sendPasswordResetEmail,
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function isFirebaseConfigured() {
    return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain);
}

function getApp() {
    if (!isFirebaseConfigured()) return null;
    return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

export function getFirebaseAuth() {
    const app = getApp();
    return app ? getAuth(app) : null;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase is not configured. Add VITE_FIREBASE_* keys to .env.local.');
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
}

export async function signUpWithEmail(email, password, displayName) {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase is not configured. Add VITE_FIREBASE_* keys to .env.local.');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
        await updateProfile(result.user, { displayName });
    }
    try {
        await sendEmailVerification(result.user);
    } catch {
        // Non-blocking — account still works if verification email fails to send
    }
    return result.user;
}

export async function signInWithEmail(email, password) {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase is not configured. Add VITE_FIREBASE_* keys to .env.local.');
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
}

export async function firebaseSignOut() {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
}

export async function resetPassword(email) {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase is not configured. Add VITE_FIREBASE_* keys to .env.local.');
    await sendPasswordResetEmail(auth, email.trim());
}

export function mapFirebaseAuthError(error) {
    const code = error?.code || '';
    const messages = {
        'auth/email-already-in-use': 'This email is already registered. Log in with your password, or use Google if you signed up that way.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/user-not-found': 'No account found with this email. Check the address or create an account.',
        'auth/wrong-password': 'Incorrect password. Try again or use Forgot Password.',
        'auth/invalid-credential': 'Invalid email or password. Check both, or use the email you signed up with.',
        'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
        'auth/popup-blocked': 'Popup was blocked. Allow popups for this site and try again.',
        'auth/unauthorized-domain': 'This site is not authorized for sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains.',
        'auth/operation-not-allowed': 'Email/password sign-in is disabled in Firebase. Enable it in Firebase Console → Authentication → Sign-in method → Email/Password.',
        'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
        'auth/network-request-failed': 'Network error. Check your connection and try again.',
    };
    return messages[code] || error?.message || 'Authentication failed. Please try again.';
}
