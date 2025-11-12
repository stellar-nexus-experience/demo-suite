import { z } from 'zod';

// Client-side environment schema validation
const clientEnvSchema = z.object({
  // Stellar Network Configuration
  NEXT_PUBLIC_STELLAR_NETWORK: z.enum(['TESTNET', 'PUBLIC']).default('TESTNET'),
  NEXT_PUBLIC_STELLAR_HORIZON_TESTNET: z
    .string()
    .url()
    .default('https://horizon-testnet.stellar.org'),
  NEXT_PUBLIC_STELLAR_HORIZON_PUBLIC: z.string().url().default('https://horizon.stellar.org'),

  // Asset Configuration
  NEXT_PUBLIC_DEFAULT_ASSET_CODE: z.string().min(1).default('USDC'),
  NEXT_PUBLIC_DEFAULT_ASSET_ISSUER: z
    .string()
    .min(1)
    .default('CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA'),
  NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().min(0).max(100))
    .default(() => 4),
  NEXT_PUBLIC_DEFAULT_ESCROW_DEADLINE_DAYS: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().min(1))
    .default(() => 7),

  // App Configuration
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('Stellar Nexus'),
  NEXT_PUBLIC_APP_VERSION: z.string().min(1).default('0.1.0'),
  NEXT_PUBLIC_DEBUG_MODE: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  NEXT_PUBLIC_PLATFORM_PUBLIC_KEY: z.string().default(''),

  // EmailJS Configuration
  NEXT_PUBLIC_EMAILJS_SERVICE_ID: z.string().optional(),
  NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: z.string().optional(),
  NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: z.string().optional(),

  // Analytics Configuration
  NEXT_PUBLIC_ANALYTICS_ENABLED: z
    .string()
    .optional()
    .transform(val => val === 'true')
    .default(() => false),
  NEXT_PUBLIC_ANALYTICS_ID: z.string().optional().default(''),
  NEXT_PUBLIC_ERROR_REPORTING_ENABLED: z
    .string()
    .optional()
    .transform(val => val === 'true')
    .default(() => false),
  NEXT_PUBLIC_ERROR_REPORTING_API_KEY: z.string().optional().default(''),
});

// Parse and validate client-side environment variables
const parseClientEnv = () => {
  try {
    return clientEnvSchema.parse(process.env);
  } catch (error) {
    throw new Error('Client environment validation failed');
  }
};

// Parse client environment variables
const clientEnv = parseClientEnv();

// Export validated client environment
export default clientEnv;

// Export type for TypeScript
export type ClientEnv = z.infer<typeof clientEnvSchema>;
