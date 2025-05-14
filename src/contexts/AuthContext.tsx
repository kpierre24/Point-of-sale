// src/contexts/AuthContext.tsx
"use client";

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase'; // auth and db can be null if firebase not initialized
import type { User as AppUser, UserRole } from '@/types'; 
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  currentUserProfile: AppUser | null; 
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<FirebaseUser | null>;
  signupWithEmail: (name: string, email: string, password: string, role: UserRole) => Promise<FirebaseUser | null>;
  logout: () => Promise<void>;
  updateUserPinInContext: (pin: string) => void;
  firebaseInitialized: boolean; // Added to indicate if Firebase is ready
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (auth && db) { // Check if Firebase services are available
      setFirebaseInitialized(true);
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCurrentUserProfile({ id: user.uid, ...userDocSnap.data() } as AppUser);
          } else {
            console.warn("User profile not found in Firestore for UID:", user.uid);
            setCurrentUserProfile(null); 
          }
        } else {
          setCurrentUserProfile(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Firebase is not initialized (likely due to missing config)
      console.error("Firebase Auth or Firestore is not initialized. Auth operations will fail.");
      setFirebaseInitialized(false);
      setLoading(false); // Stop loading, but indicate Firebase isn't ready
    }
  }, []); // Empty dependency array, runs once

  const loginWithEmail = async (email: string, password: string): Promise<FirebaseUser | null> => {
    if (!auth) throw new Error("Firebase Auth is not initialized.");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error; 
    }
  };

  const signupWithEmail = async (name: string, email: string, password: string, role: UserRole): Promise<FirebaseUser | null> => {
    if (!auth || !db) throw new Error("Firebase Auth or Firestore is not initialized.");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const newPin = Math.floor(100000 + Math.random() * 900000).toString(); 
        const newUserProfileData = {
            name,
            email: firebaseUser.email || email,
            role,
            isActive: true,
            pin: newPin,
        };
        await setDoc(userDocRef, newUserProfileData);
      }
      return firebaseUser;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error; 
    }
  };
  
  const updateUserPinInContext = (pin: string) => {
    if (currentUserProfile) {
        setCurrentUserProfile(prev => prev ? { ...prev, pin } : null);
    }
  };

  const logout = async () => {
    if (!auth) {
      console.warn("Firebase Auth not initialized, cannot logout effectively from Firebase.");
      // Simulate logout locally
      setCurrentUser(null);
      setCurrentUserProfile(null);
      router.push('/auth/login');
      return;
    }
    try {
      await signOut(auth);
      router.push('/auth/login'); 
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Initializing App...</p>
      </div>
    );
  }

  if (!firebaseInitialized && typeof window !== 'undefined') {
    // Display a prominent error message if Firebase couldn't initialize on the client
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-destructive/10 p-4 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Firebase Configuration Error</h1>
            <p className="text-destructive-foreground mb-2">
                The application could not connect to Firebase. This is likely due to missing or incorrect Firebase configuration.
            </p>
            <p className="text-sm text-muted-foreground">
                Please ensure that your <code>.env.local</code> file is correctly set up with all necessary <code>NEXT_PUBLIC_FIREBASE_...</code> variables and that you have restarted your development server.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
                Refer to the console for more specific error messages from Firebase.
            </p>
        </div>
    );
  }


  return (
    <AuthContext.Provider value={{ currentUser, currentUserProfile, loading, loginWithEmail, signupWithEmail, logout, updateUserPinInContext, firebaseInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
