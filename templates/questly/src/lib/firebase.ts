/**
 * Firebase Configuration and Initialization
 * Phase 4.1 - Cloud Storage Integration
 * 
 * To use Firebase:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Get your config from Project Settings > General > Your apps
 * 3. Set environment variables in .env.local:
 *    VITE_FIREBASE_API_KEY=your_api_key
 *    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
 *    VITE_FIREBASE_PROJECT_ID=your_project_id
 *    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
 *    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
 *    VITE_FIREBASE_APP_ID=your_app_id
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined
};

// Check if Firebase is configured
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "YOUR_API_KEY" && 
         firebaseConfig.projectId !== "YOUR_PROJECT_ID";
};

// Initialize Firebase (only if configured)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

if (isFirebaseConfigured()) {
  // Only initialize if not already initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Initialize Analytics only in browser environment
    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app!);
          console.log('[Firebase] Analytics initialized');
        }
      }).catch(() => {
        console.warn('[Firebase] Analytics not supported in this environment');
      });
    }
    
    console.log('[Firebase] Initialized successfully');
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Initialize Analytics if not already initialized
    if (typeof window !== 'undefined' && !analytics) {
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app!);
        }
      }).catch(() => {});
    }
  }
} else {
  console.warn('[Firebase] Not configured - using localStorage only. Set environment variables to enable cloud storage.');
}

export { app, auth, db, analytics };
export { firebaseConfig };
