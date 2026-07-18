/* eslint-disable react/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { isFirebaseConfigured, storageService } from '../services/storage';
import { auth as firebaseAuth } from '../firebase/config';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserProfile } from '../types/habit';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  isFirebaseMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isFirebaseMode = isFirebaseConfigured();

  // Handle Auth changes
  useEffect(() => {
    if (isFirebaseMode && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          try {
            // Load user profile
            let profile = await storageService.getUserProfile(fbUser.uid);
            if (!profile) {
              profile = {
                uid: fbUser.uid,
                email: fbUser.email || '',
                name: fbUser.displayName || 'User',
                createdAt: new Date().toISOString(),
                hasCompletedAssessment: false
              };
              await storageService.saveUserProfile(profile);
            }
            setUser(profile);
          } catch (e) {
            console.error('Error fetching user profile from Firestore:', e);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Local fallback mode: restore existing session or show login page
      const localSession = localStorage.getItem('mindshift_auth_session');
      const fetchLocalUser = async () => {
        if (localSession) {
          try {
            const parsed = JSON.parse(localSession) as { uid: string };
            const profile = await storageService.getUserProfile(parsed.uid);
            if (profile) {
              setUser(profile);
            } else {
              // Session token exists but profile was deleted — clear stale session
              localStorage.removeItem('mindshift_auth_session');
              setUser(null);
            }
          } catch {
            localStorage.removeItem('mindshift_auth_session');
            setUser(null);
          }
        } else {
          // No session — show the login page
          setUser(null);
        }
        setLoading(false);
      };

      fetchLocalUser();
    }
  }, [isFirebaseMode]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (isFirebaseMode && firebaseAuth) {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        // Mock login
        const mockUid = `local_user_${email.replace(/[^a-zA-Z0-9]/g, '')}`;
        let profile = await storageService.getUserProfile(mockUid);
        if (!profile) {
          profile = {
            uid: mockUid,
            email,
            name: email.split('@')[0],
            createdAt: new Date().toISOString(),
            hasCompletedAssessment: false
          };
          await storageService.saveUserProfile(profile);
        }
        localStorage.setItem('mindshift_auth_session', JSON.stringify({ uid: mockUid }));
        setUser(profile);
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      if (isFirebaseMode && firebaseAuth) {
        const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const newProfile: UserProfile = {
          uid: cred.user.uid,
          email,
          name,
          createdAt: new Date().toISOString(),
          hasCompletedAssessment: false
        };
        await storageService.saveUserProfile(newProfile);
        setUser(newProfile);
      } else {
        // Mock signup
        const mockUid = `local_user_${email.replace(/[^a-zA-Z0-9]/g, '')}`;
        const existing = await storageService.getUserProfile(mockUid);
        if (existing) {
          throw new Error('An account with this email address already exists.');
        }

        const newProfile: UserProfile = {
          uid: mockUid,
          email,
          name,
          createdAt: new Date().toISOString(),
          hasCompletedAssessment: false
        };
        await storageService.saveUserProfile(newProfile);
        localStorage.setItem('mindshift_auth_session', JSON.stringify({ uid: mockUid }));
        setUser(newProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isFirebaseMode && firebaseAuth) {
        await signOut(firebaseAuth);
      } else {
        localStorage.removeItem('mindshift_auth_session');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (isFirebaseMode && firebaseAuth) {
      await sendPasswordResetEmail(firebaseAuth, email);
    } else {
      // Mock password reset logic
      const mockUid = `local_user_${email.replace(/[^a-zA-Z0-9]/g, '')}`;
      const profile = await storageService.getUserProfile(mockUid);
      if (!profile) {
        throw new Error('No account found with this email address.');
      }
      // Simulate success with local mock
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, sendPasswordReset, isFirebaseMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
