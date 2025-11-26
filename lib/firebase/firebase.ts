// Firebase configuration and initialization
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
// Firebase Analytics is disabled - we use direct Google Analytics instead
// import { getAnalytics, isSupported } from 'firebase/analytics';

// Get Firebase configuration from environment variables
function getFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // Validate required fields
  const requiredFields = ['apiKey', 'authDomain', 'projectId'] as const;
  const missingFields = requiredFields.filter(field => !config[field]);

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required Firebase configuration: ${missingFields.join(', ')}. ` +
        `Please set NEXT_PUBLIC_FIREBASE_${missingFields.join(', NEXT_PUBLIC_FIREBASE_')} environment variables.`
    );
  }

  return config;
}

// Initialize Firebase instances
let app!: FirebaseApp;
let db!: Firestore;
let auth!: Auth;

// Initialize Firebase - only uses real config, fails if config is missing
function initializeFirebase(): { app: FirebaseApp; db: Firestore; auth: Auth } {
  // Check if Firebase is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    db = getFirestore(app);
    auth = getAuth(app);
    return { app, db, auth };
  }

  // Get and validate config
  const config = getFirebaseConfig();

  // Initialize Firebase with real config
  app = initializeApp(config);
  db = getFirestore(app);
  auth = getAuth(app);

  return { app, db, auth };
}

// Initialize Firebase
// In browser: Initialize immediately with real config
// In SSR/Build: Initialize if config is available, otherwise throw error
try {
  const result = initializeFirebase();
  app = result.app;
  db = result.db;
  auth = result.auth;
} catch (error) {
  // In browser, we must have config - fail clearly
  if (typeof window !== 'undefined') {
    throw error;
  }

  // During build, if config is missing, we still need to throw
  // This ensures the build fails if env vars aren't set, rather than silently using placeholder
  throw error;
}

export { db, auth };

// Connect to emulators in development (only if explicitly enabled)
if (
  process.env.NODE_ENV === 'development' &&
  process.env.FIREBASE_USE_EMULATOR === 'true' &&
  db &&
  auth
) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
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
// NOTE: Firebase Analytics is disabled - we use direct Google Analytics instead
// via the GoogleAnalytics component in app/layout.tsx
// Uncomment below if you want to use Firebase Analytics instead:
// if (typeof window !== 'undefined' && app) {
//   isSupported().then(supported => {
//     if (supported) {
//       getAnalytics(app);
//     }
//   });
// }
