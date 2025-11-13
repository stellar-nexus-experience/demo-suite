/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimized for Vercel deployment
  poweredByHeader: false,
  compress: true,
  generateEtags: false,

  // Security headers to prevent phishing and malware detection
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://horizon-testnet.stellar.org https://horizon.stellar.org https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://firebase.googleapis.com https://firebaseinstallations.googleapis.com https://firebaselogging.googleapis.com https://firebaseremoteconfig.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com wss://horizon-testnet.stellar.org wss://horizon.stellar.org",
              "frame-src 'self' https://*.youtube.com https://www.youtube.com",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ]
      }
    ]
  },

  // ESLint configuration - ignore during builds to prevent warnings from failing CI
  eslint: {
    // Ignore ESLint during builds - run linting separately in CI
    ignoreDuringBuilds: true,
  },

  // Webpack configuration to suppress Stellar SDK warnings and optimize build
  webpack: (config, { dev, isServer }) => {
    // Suppress critical dependency warnings from stellar-sdk and related packages
    config.module.exprContextCritical = false;
    config.module.unknownContextCritical = false;
    config.module.wrappedContextCritical = false;

    // Add fallbacks for Node.js modules that aren't available in the browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
      buffer: false,
      process: false,
      util: false,
    };

    // Ignore specific warnings from stellar-sdk dependencies
    config.ignoreWarnings = [
      // Ignore critical dependency warnings from stellar-sdk
      /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      // Ignore warnings from specific modules
      /require-addon/,
      /sodium-native/,
      /@stellar\/stellar-base/,
      /stellar-sdk/,
      // Additional common warnings to ignore
      /Module not found: Can't resolve/,
      /export .* was not found in/,
    ];

    // Optimize for client-side builds
    if (!isServer) {
      // Exclude server-only modules from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'sodium-native': 'sodium-native',
        'require-addon': 'require-addon',
      });
    }

    // Additional optimization for stellar-sdk (removed alias to prevent module resolution issues)

    return config;
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['stellar-sdk', '@stellar/stellar-sdk'],
  },
};

module.exports = nextConfig;
