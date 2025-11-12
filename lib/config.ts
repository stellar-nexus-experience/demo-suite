import clientEnv from './utils/client-env';

// Centralized configuration for the Trustless Work application
// This file provides a single source of truth for all environment variables

export const config = {
  // Stellar Network Configuration
  stellar: {
    network: clientEnv.NEXT_PUBLIC_STELLAR_NETWORK,
    horizonUrl:
      clientEnv.NEXT_PUBLIC_STELLAR_NETWORK === 'PUBLIC'
        ? clientEnv.NEXT_PUBLIC_STELLAR_HORIZON_PUBLIC
        : clientEnv.NEXT_PUBLIC_STELLAR_HORIZON_TESTNET,
  },

  // Asset Configuration
  asset: {
    defaultAsset: {
      code: clientEnv.NEXT_PUBLIC_DEFAULT_ASSET_CODE,
      issuer: clientEnv.NEXT_PUBLIC_DEFAULT_ASSET_ISSUER,
      decimals: 7, // Default decimals for Stellar assets
    },
    platformFee: clientEnv.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE,
    defaultEscrowDeadlineDays: clientEnv.NEXT_PUBLIC_DEFAULT_ESCROW_DEADLINE_DAYS,
  },

  // App Configuration
  app: {
    name: clientEnv.NEXT_PUBLIC_APP_NAME,
    version: clientEnv.NEXT_PUBLIC_APP_VERSION,
    debugMode: clientEnv.NEXT_PUBLIC_DEBUG_MODE || false,
    platformPublicKey: clientEnv.NEXT_PUBLIC_PLATFORM_PUBLIC_KEY,
  },

  // Development Configuration
  development: {
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
    isProduction: (process.env.NODE_ENV || 'development') === 'production',
    isTest: (process.env.NODE_ENV || 'development') === 'test',
  },

  // Feature Flags (using defaults since not in client-env)
  features: {
    escrow: true,
    wallet: true,
    demo: true,
    ai: true,
  },

  // UI Configuration (using defaults since not in client-env)
  ui: {
    animations: true,
    glassmorphism: true,
    gradientEffects: true,
  },

  // Performance Configuration (using defaults since not in client-env)
  performance: {
    lazyLoading: true,
    imageOptimization: true,
    codeSplitting: true,
  },

  // Security Configuration (using defaults since not in client-env)
  security: {
    contentSecurityPolicy: true,
    xssProtection: true,
    frameOptions: true,
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
  },

  // Analytics & Monitoring
  analytics: {
    enabled: clientEnv.NEXT_PUBLIC_ANALYTICS_ENABLED,
    id: clientEnv.NEXT_PUBLIC_ANALYTICS_ID,
    errorReporting: {
      enabled: clientEnv.NEXT_PUBLIC_ERROR_REPORTING_ENABLED,
      endpoint: clientEnv.NEXT_PUBLIC_ERROR_REPORTING_API_KEY,
    },
  },

  // AI Assistant Configuration (using defaults since not in client-env)
  ai: {
    enabled: true,
    name: 'NEXUS PRIME',
    voiceEnabled: true,
  },

  // Demo Configuration (using defaults since not in client-env)
  demo: {
    modeEnabled: true,
    dataEnabled: true,
  },

  // Wallet Configuration (using defaults since not in client-env)
  wallet: {
    freighterAppId: 'nexus-experience',
    albedoAppName: 'NEXUS EXPERIENCE',
  },
};

// Export individual config sections for convenience
export const {
  stellar,
  asset,
  app,
  development,
  features,
  ui,
  performance,
  security,
  analytics,
  ai,
  demo,
  wallet,
} = config;

// Default export
export default config;
