"use client";

import { getAnalytics, isSupported } from "firebase/analytics";
import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCc3HBdYRbAyMxDdHd5GHZDQbW4s0BqXVI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "fencing-bf4d1.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fencing-bf4d1",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "fencing-bf4d1.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "222561568249",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:222561568249:web:5edd5d5d6360710a816928",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-2S9Z428KR0",
};

export const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

export async function initializeFirebaseAnalytics() {
  if (typeof window === "undefined") {
    return null;
  }

  return (await isSupported()) ? getAnalytics(firebaseApp) : null;
}
