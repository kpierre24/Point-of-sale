// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore'; // Added enableIndexedDbPersistence

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
      dbInstance = getFirestore(app);
      if (dbInstance) {
        enableIndexedDbPersistence(dbInstance)
          .catch((err) => {
            if (err.code == 'failed-precondition') {
              console.warn('Firestore persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a time.');
            } else if (err.code == 'unimplemented') {
              console.warn('Firestore persistence failed: The current browser does not support all of the features required to enable persistence.');
            } else {
              console.warn('Firestore persistence failed:', err);
            }
          });
      }
    } catch (error) {
      console.error("Firebase initialization error:", error);
      dbInstance = null; // Ensure dbInstance is null on error
    }
  } else {
    app = getApp();
    try {
        dbInstance = getFirestore(app);
        // Note: enableIndexedDbPersistence should ideally be called only once.
        // If getApps().length > 0, persistence might have already been set or failed.
        // For simplicity here, we don't re-attempt if app already exists,
        // assuming it was configured correctly on first init.
        // If it was critical to ensure it's enabled here too, more complex logic to track state would be needed.
    } catch (error) {
        console.error("Firebase get existing app instances error:", error);
        dbInstance = null; // Ensure dbInstance is null on error
    }
  }
} else {
  if (typeof window === 'undefined') { 
    console.warn(
        "Firebase configuration is incomplete. Firebase Firestore will not be available. " +
        "This might be expected during certain build phases if .env.local is not yet configured."
    );
  }
  // dbInstance is already null by default
}

// Export dbInstance (which can be null)
export { app, dbInstance as db };
