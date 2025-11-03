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

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let initializedWithPlaceholder = false;

// Initialize Firebase with runtime config check
function initializeFirebase() {
  // If already initialized, return existing instances
  if (app && db && auth) {
    return { app, db, auth };
  }

  const config = getFirebaseConfig();
  const isValid = isConfigValid(config);
  const isBrowser = typeof window !== 'undefined';

  // Use placeholder ONLY during build/SSR if config is missing
  // In browser runtime, always use real config if available, never placeholder
  const usePlaceholder = !isValid && !isBrowser;

  const finalConfig = usePlaceholder ? placeholderConfig : config;

  try {
    // Check if Firebase app already exists
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
      db = getFirestore(app);
      auth = getAuth(app);
      return { app, db, auth };
    }

    // In browser runtime, only initialize with real config
    if (isBrowser && !isValid) {
      throw new Error(
        'Missing required Firebase configuration. Please set all NEXT_PUBLIC_FIREBASE_* environment variables.'
      );
    }

    app = initializeApp(finalConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    // Track if we used placeholder (only happens during build/SSR)
    if (usePlaceholder) {
      initializedWithPlaceholder = true;
    } else if (isBrowser && isValid) {
      initializedWithPlaceholder = false;
    }
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
      // In browser runtime, throw error if config is invalid
      if (!isValid) {
        throw new Error(
          'Missing required Firebase configuration. Please set all NEXT_PUBLIC_FIREBASE_* environment variables.'
        );
      }
      throw error;
    }
  }

  return { app, db, auth };
}

// Initialize immediately for build-time compatibility
// This will be re-initialized with real config at runtime if available
try {
  const result = initializeFirebase();
  app = result.app;
  db = result.db;
  auth = result.auth;
} catch (error) {
  // Silently fail during build, will be re-initialized at runtime
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
