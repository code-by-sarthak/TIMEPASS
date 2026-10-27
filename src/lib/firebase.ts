import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  Auth,
  User as FirebaseUser,
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDvuGuP-i4rc7V6deQnPaLxEiQnbdl3OhE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "timepass-e3887.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "timepass-e3887",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "timepass-e3887.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "592299842010",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:592299842010:web:310d26c896b205734808e3",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-JVWZF2QBN0"
};

// Initialize Firebase singleton
let app: FirebaseApp;
let auth: Auth;

if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
}

export { app, auth };

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// 1. Google Sign-In Popup (Real Google OAuth)
export async function signInWithGooglePopup(): Promise<FirebaseUser> {
  if (!auth) throw new Error('Firebase Auth is only available in the browser.');
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// 2. Setup RecaptchaVerifier for Real Phone Number OTP
export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  if (!auth) throw new Error('Firebase Auth is only available in the browser.');
  
  // Clear any existing recaptcha widget on window if present
  if (typeof window !== 'undefined') {
    const existingRecaptcha = (window as unknown as { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier;
    if (existingRecaptcha) {
      try {
        existingRecaptcha.clear();
      } catch {
        // Safe clear
      }
    }
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA verified successfully for SMS delivery.');
    },
    'expired-callback': () => {
      console.warn('reCAPTCHA expired. Please retry.');
    }
  });

  if (typeof window !== 'undefined') {
    (window as unknown as { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier = verifier;
  }

  return verifier;
}

// 3. Send Real SMS OTP to Mobile Phone
export async function sendFirebasePhoneOtp(
  phoneNumber: string,
  appVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  if (!auth) throw new Error('Firebase Auth not initialized.');
  return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
}

// 4. Register with Real Email / Password
export async function registerWithFirebaseEmail(
  email: string,
  pass: string,
  displayName: string
): Promise<FirebaseUser> {
  if (!auth) throw new Error('Firebase Auth not initialized.');
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }
  return userCredential.user;
}

// 5. Login with Real Email / Password
export async function loginWithFirebaseEmail(
  email: string,
  pass: string
): Promise<FirebaseUser> {
  if (!auth) throw new Error('Firebase Auth not initialized.');
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

// 6. Sign Out
export async function signOutFirebase(): Promise<void> {
  if (auth) {
    await firebaseSignOut(auth);
  }
}
