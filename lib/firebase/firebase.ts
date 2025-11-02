// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate all required Firebase configuration values are present
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  throw new Error(
    'Missing required Firebase configuration. Please set all NEXT_PUBLIC_FIREBASE_* environment variables.'
  );
}

const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connect to emulators in development (only if explicitly enabled)
if (process.env.NODE_ENV === 'development' && process.env.FIREBASE_USE_EMULATOR === 'true') {
  try {
    // Only connect if not already connected
    if (!(db as any)._delegate._databaseId.projectId.includes('demo-')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
  } catch (error) {
    // Firestore emulator already connected or not available
  }

  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
  } catch (error) {
    // Auth emulator already connected or not available
  }
}

// Initialize Analytics
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      getAnalytics(app);
    }
  });
}
