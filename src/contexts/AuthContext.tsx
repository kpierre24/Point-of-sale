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
import { auth, db } from '@/lib/firebase';
import type { User as AppUser, UserRole } from '@/types'; // Renamed to AppUser to avoid conflict
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  currentUserProfile: AppUser | null; // Custom user profile
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<FirebaseUser | null>;
  signupWithEmail: (name: string, email: string, password: string, role: UserRole) => Promise<FirebaseUser | null>;
  logout: () => Promise<void>;
  updateUserPinInContext: (pin: string) => void; // For updating pin in context after change
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch custom user profile from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setCurrentUserProfile({ id: user.uid, ...userDocSnap.data() } as AppUser);
        } else {
          // This case should ideally not happen if profiles are created on signup
          // Or could be a new user whose profile creation is pending
          console.warn("User profile not found in Firestore for UID:", user.uid);
          setCurrentUserProfile(null); 
        }
      } else {
        setCurrentUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<FirebaseUser | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting currentUser and currentUserProfile
      return userCredential.user;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error; // Rethrow to be caught by the calling component
    }
  };

  const signupWithEmail = async (name: string, email: string, password: string, role: UserRole): Promise<FirebaseUser | null> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      if (firebaseUser) {
        // Create user profile in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const newPin = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit PIN
        const newUserProfile: AppUser = {
          id: firebaseUser.uid,
          name,
          email: firebaseUser.email || email, // Ensure email is set
          role,
          isActive: true,
          pin: newPin, // Assign generated PIN
          // password should not be stored here, Firebase handles it
        };
        await setDoc(userDocRef, {
            name: newUserProfile.name,
            email: newUserProfile.email,
            role: newUserProfile.role,
            isActive: newUserProfile.isActive,
            pin: newUserProfile.pin,
        });
        // onAuthStateChanged will handle setting currentUser, and the new profile fetch
      }
      return firebaseUser;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error; // Rethrow
    }
  };
  
  const updateUserPinInContext = (pin: string) => {
    if (currentUserProfile) {
        setCurrentUserProfile(prev => prev ? { ...prev, pin } : null);
    }
  };


  const logout = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will set currentUser and currentUserProfile to null
      router.push('/auth/login'); // Redirect to login after logout
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

  return (
    <AuthContext.Provider value={{ currentUser, currentUserProfile, loading, loginWithEmail, signupWithEmail, logout, updateUserPinInContext }}>
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
