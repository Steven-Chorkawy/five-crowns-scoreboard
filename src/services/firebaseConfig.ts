import { initializeApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

/**
 * Firebase web configuration, read from Vite environment variables.
 *
 * These values are not secret - the Firebase web SDK is designed to run in the
 * browser with them visible. Access control is enforced by Firestore security
 * rules, not by keeping these hidden.
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