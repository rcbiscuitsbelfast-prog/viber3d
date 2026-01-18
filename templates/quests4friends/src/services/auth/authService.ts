import { auth } from "../../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

export async function signUpEmail(email: string, password: string): Promise<string> {
  console.log('[Auth] Signing up:', email);
  const result = await createUserWithEmailAndPassword(auth, email, password);
  console.log('[Auth] Sign up successful:', result.user.uid);
  return result.user.uid;
}

export async function signInEmail(email: string, password: string): Promise<string> {
  console.log('[Auth] Signing in:', email);
  const result = await signInWithEmailAndPassword(auth, email, password);
  console.log('[Auth] Sign in successful:', result.user.uid);
  return result.user.uid;
}

export async function signOut(): Promise<void> {
  console.log('[Auth] Signing out');
  await firebaseSignOut(auth);
  console.log('[Auth] Sign out successful');
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  console.log('[Auth] Setting up auth state listener');
  return onAuthStateChanged(auth, callback);
}
