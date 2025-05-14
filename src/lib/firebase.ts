// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
// getAuth and Auth type removed
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
// authInstance removed
let dbInstance: Firestore | null = null;

if (typeof window !== 'undefined' && (!firebaseConfig.apiKey || !firebaseConfig.projectId)) {
  console.error(
    "Firebase API Key or Project ID is missing. Critical Firebase features (like Firestore) may not work. " +
    "Make sure NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID and other NEXT_PUBLIC_FIREBASE_ environment variables " +
    "are set in your .env.local file and the development server was restarted."
  );
}

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      // authInstance initialization removed
      dbInstance = getFirestore(app);
    } catch (error) {
      console.error("Firebase initialization error:", error);
    }
  } else {
    app = getApp();
    try {
        // authInstance retrieval removed
        dbInstance = getFirestore(app);
    } catch (error) {
        console.error("Firebase get existing app instances error:", error);
    }
  }
} else {
  if (typeof window === 'undefined') { 
    console.warn(
        "Firebase configuration is incomplete. Firebase Firestore will not be available. " +
        "This might be expected during certain build phases if .env.local is not yet configured."
    );
  }
}

// Export dbInstance (which can be null)
export { app, dbInstance as db };
