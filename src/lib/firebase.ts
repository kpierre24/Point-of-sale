// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (typeof window !== 'undefined' && !firebaseConfig.apiKey) {
  console.error(
    "Firebase API Key is missing. Critical Firebase features will not work. " +
    "Make sure NEXT_PUBLIC_FIREBASE_API_KEY and other NEXT_PUBLIC_FIREBASE_ environment variables " +
    "are set in your .env.local file and the development server was restarted."
  );
}


// Initialize Firebase only if all essential keys are present, especially on the client
// On the server, Next.js might try to initialize this even if keys are missing for some build steps.
// We want to avoid throwing an error that breaks the build if keys are temporarily missing during setup.
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      authInstance = getAuth(app);
      dbInstance = getFirestore(app);
    } catch (error) {
      console.error("Firebase initialization error:", error);
      // app will be uninitialized, authInstance and dbInstance will remain null
    }
  } else {
    app = getApp();
    // Ensure instances are potentially re-fetched if app was initialized but instances were not.
    try {
        authInstance = getAuth(app);
        dbInstance = getFirestore(app);
    } catch (error) {
        console.error("Firebase get existing app instances error:", error);
    }
  }
} else {
  // Handle the case where Firebase config is not complete, especially for server-side rendering or build.
  // This prevents crashing the app if env vars are not set.
  // Components using Firebase should handle null auth/db instances gracefully.
  if (typeof window === 'undefined') { // Server-side
    console.warn(
        "Firebase configuration is incomplete. Firebase services (Auth, Firestore) will not be available. " +
        "This might be expected during certain build phases if .env.local is not yet configured."
    );
  }
  // app remains uninitialized or we could assign a placeholder if needed by other logic,
  // but it's better to have authInstance and dbInstance as null.
  // Ensure app is defined to avoid undefined errors if it's exported and used elsewhere without checking.
  // However, without proper init, it's not very useful.
  // The key is that authInstance and dbInstance will be null and checks for these should exist in the app.
}

// Export potentially null instances. Consumers must check for null.
export { app, authInstance as auth, dbInstance as db };
