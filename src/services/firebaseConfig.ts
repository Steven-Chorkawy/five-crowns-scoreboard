import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    Auth,
    User
} from "firebase/auth";

/**
 * Firebase web configuration, read from Vite environment variables.
 *
 * These values are not secret - the Firebase web SDK is designed to run in the
 * browser with them visible. Access control is enforced by Firestore security
 * rules plus authentication, not by hiding these values.
 */
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string
};

/** The initialized Firebase application instance (created once). */
export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);

/** The Firestore database handle used by FirestoreProvider. */
export const firestore: Firestore = getFirestore(firebaseApp);

/** The Firebase Auth handle. */
export const firebaseAuth: Auth = getAuth(firebaseApp);

/**
 * A single, shared promise that resolves once a Firebase user (anonymous or
 * otherwise) is signed in and ready.
 *
 * Every cloud operation awaits this first, which guarantees a valid auth token
 * exists before any Firestore request runs. Without this gate, an early
 * read/write can race ahead of sign-in and be rejected with permission-denied,
 * even though the rules and code are correct.
 *
 * The promise is created once at module load and reused for the app's lifetime.
 */
export const authReady: Promise<User> = new Promise<User>((resolve, reject) => {
    // Fires immediately with the current user if already signed in, otherwise
    // once sign-in completes.
    const unsubscribe = onAuthStateChanged(
        firebaseAuth,
        (user: User | null): void => {
            if (user) {
                unsubscribe();
                resolve(user);
            }
        },
        (error): void => {
            unsubscribe();
            reject(error);
        }
    );

    // Kick off anonymous sign-in if nobody is signed in yet. If a session already
    // exists (Firebase persists it), onAuthStateChanged above resolves first and
    // this is effectively a no-op.
    if (!firebaseAuth.currentUser) {
        signInAnonymously(firebaseAuth).catch((error): void => {
            unsubscribe();
            reject(error);
        });
    }
});