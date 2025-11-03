// Firebase configuration and initialization
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Get Firebase configuration from environment variables
function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

// Check if config is valid (not placeholder)
function isConfigValid(config: ReturnType<typeof getFirebaseConfig>): boolean {
  return !!(
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.apiKey !== 'build-placeholder' &&
    config.projectId !== 'build-placeholder' &&
    !config.apiKey.includes('placeholder') &&
    !config.projectId.includes('placeholder')
  );
}

// Placeholder config for build-time only
const placeholderConfig = {
  apiKey: 'build-placeholder',
  authDomain: 'build-placeholder.firebaseapp.com',
  projectId: 'build-placeholder',
  storageBucket: 'build-placeholder.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:placeholder',
  measurementId: 'G-PLACEHOLDER',
};

// Initialize Firebase instances - always ensure they're defined
// Using definite assignment assertions since they're always initialized in the try-catch below
let app!: FirebaseApp;
let db!: Firestore;
let auth!: Auth;
let initializedWithPlaceholder = false;

// Initialize Firebase with runtime config check
function initializeFirebase(): { app: FirebaseApp; db: Firestore; auth: Auth } {
  // Check if Firebase is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    db = getFirestore(app);
    auth = getAuth(app);
    // Check if we're using placeholder by examining the project ID
    const projectId = (app.options as any).projectId;
    initializedWithPlaceholder = projectId === 'build-placeholder';
    return { app, db, auth };
  }

  const config = getFirebaseConfig();
  const isValid = isConfigValid(config);
  const isBrowser = typeof window !== 'undefined';

  // Use placeholder ONLY during build/SSR if config is missing
  // In browser runtime, always use real config if available, never placeholder
  const usePlaceholder = !isValid && !isBrowser;

  // In browser runtime, only initialize with real config
  if (isBrowser && !isValid) {
    throw new Error(
      'Missing required Firebase configuration. Please set all NEXT_PUBLIC_FIREBASE_* environment variables.'
    );
  }

  const finalConfig = usePlaceholder ? placeholderConfig : config;

  try {
    app = initializeApp(finalConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    initializedWithPlaceholder = usePlaceholder;
  } catch (error) {
    // During build/SSR, use placeholder to allow build to proceed
    if (!isBrowser) {
      try {
        app = initializeApp(placeholderConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        initializedWithPlaceholder = true;
      } catch (fallbackError) {
        // Force initialization with placeholder for build compatibility
        app = initializeApp(placeholderConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        initializedWithPlaceholder = true;
      }
    } else {
      // In browser runtime, re-throw the error
      throw error;
    }
  }

  return { app, db, auth };
}

// Initialize immediately for build-time compatibility
// This will use real config at runtime if available
try {
  const result = initializeFirebase();
  app = result.app;
  db = result.db;
  auth = result.auth;
} catch (error) {
  // Ensure db and auth are always defined, even if initialization fails
  // This prevents TypeScript errors and ensures the build can proceed
  try {
    app = initializeApp(placeholderConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    initializedWithPlaceholder = true;
  } catch (fallbackError) {
    // This should never happen, but ensures TypeScript knows they're defined
    throw new Error('Failed to initialize Firebase with placeholder config');
  }
  
  // Only log error in browser runtime
  if (typeof window !== 'undefined') {
    console.error('Firebase initialization error:', error);
  }
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
if (typeof window !== 'undefined' && app) {
  isSupported().then(supported => {
    if (supported) {
      getAnalytics(app);
    }
  });
}
