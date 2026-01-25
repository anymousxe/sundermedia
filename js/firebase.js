// Firebase initialization and authentication
import { config } from './config.js';

// Import Firebase from CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Initialize Firebase
const app = initializeApp(config.firebase);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Current user state
let currentUser = null;

/**
 * Sign in with Google
 * @returns {Promise<Object>} User object
 */
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error('Google sign-in error:', error);
        throw error;
    }
}

/**
 * Sign out the current user
 */
export async function logout() {
    try {
        await signOut(auth);
        currentUser = null;
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
}

/**
 * Get the current authenticated user
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Get the current user's Firebase UID
 * @returns {string|null} Firebase UID or null
 */
export function getCurrentUserId() {
    return currentUser?.uid || null;
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Called with user object or null
 * @returns {Function} Unsubscribe function
 */
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, (user) => {
        currentUser = user;
        callback(user);
    });
}

/**
 * Get ID token for API calls (if needed)
 * @returns {Promise<string|null>} ID token or null
 */
export async function getIdToken() {
    if (!currentUser) return null;
    try {
        return await currentUser.getIdToken();
    } catch (error) {
        console.error('Error getting ID token:', error);
        return null;
    }
}

export { auth };
