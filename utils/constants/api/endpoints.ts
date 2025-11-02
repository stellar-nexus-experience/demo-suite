// API Endpoints and URLs
export const API_ENDPOINTS = {
  // Stellar Horizon URLs
  HORIZON: {
    TESTNET: 'https://horizon-testnet.stellar.org',
    MAINNET: 'https://horizon.stellar.org',
  },

  // Stellar Expert Explorer URLs
  STELLAR_EXPERT: {
    BASE_URL: 'https://stellar.expert/explorer',
    TESTNET_SUFFIX: 'testnet',
    MAINNET_SUFFIX: 'public',
  },

  // External Services
  EXTERNAL: {
    FREIGHTER_APP: 'https://freighter.app',
    FREIGHTER_INSTALL: 'https://freighter.app',
    ALBEDO_LINK: 'https://albedo.link/',
    XBULL_APP: 'https://xbull.app/',
    FRIENDBOT: 'https://friendbot.stellar.org',
  },
} as const;

// API Response Timeouts
export const API_TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  QUICK: 5000, // 5 seconds
  LONG: 60000, // 60 seconds
} as const;

// API Retry Configuration
export const API_RETRY = {
  MAX_ATTEMPTS: 3,
  DELAY_MS: 1000,
  BACKOFF_MULTIPLIER: 2,
} as const;
