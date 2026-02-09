import { create } from 'zustand';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

interface AuthState {
  user: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: () => {
    if (!isFirebaseConfigured() || !auth) {
      console.warn('[Auth] Firebase not configured - auth disabled');
      set({ isLoading: false });
      return;
    }

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[Auth] State changed:', user ? `User: ${user.email}` : 'No user');
      set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      });
    });

    // Return cleanup function (though Zustand doesn't use it directly)
    // The subscription will be cleaned up when the store is destroyed
    return unsubscribe;
  },

  signIn: async (email: string, password: string) => {
    if (!isFirebaseConfigured() || !auth) {
      throw new Error('Firebase is not configured. Please set up Firebase credentials.');
    }

    set({ isLoading: true });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('[Auth] Sign in successful:', userCredential.user.email);
      // Auth state will be updated by onAuthStateChanged listener
    } catch (error: any) {
      console.error('[Auth] Sign in failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string, displayName?: string) => {
    if (!isFirebaseConfigured() || !auth) {
      throw new Error('Firebase is not configured. Please set up Firebase credentials.');
    }

    set({ isLoading: true });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name if provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      console.log('[Auth] Sign up successful:', userCredential.user.email);
      // Auth state will be updated by onAuthStateChanged listener
    } catch (error: any) {
      console.error('[Auth] Sign up failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    if (!isFirebaseConfigured() || !auth) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      await firebaseSignOut(auth);
      console.log('[Auth] Sign out successful');
      // Auth state will be updated by onAuthStateChanged listener
    } catch (error: any) {
      console.error('[Auth] Sign out failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },
}));
