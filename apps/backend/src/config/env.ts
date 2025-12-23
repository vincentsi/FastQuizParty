import { config } from 'dotenv'
import { z } from 'zod'

config()

/**
 * Environment variables schema with Zod validation
 * Validates and types env vars at startup (fail-fast)
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'staging'])
    .default('development'),

  // Server port
  PORT: z.string().default('3001'),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT Secrets (HS256 requires 256-bit = 64 hex chars for optimal security)
  JWT_SECRET: z
    .string()
    .min(64, 'JWT_SECRET must be at least 64 characters (256-bit)')
    .regex(
      /^[a-fA-F0-9]{64}$/,
      'JWT_SECRET must be exactly 64 hexadecimal characters for HS256'
    ),
  JWT_REFRESH_SECRET: z
    .string()
    .min(64, 'JWT_REFRESH_SECRET must be at least 64 characters (256-bit)')
    .regex(
      /^[a-fA-F0-9]{64}$/,
      'JWT_REFRESH_SECRET must be exactly 64 hexadecimal characters for HS256'
    ),

  // Frontend URL for CORS (supports comma-separated list)
  FRONTEND_URL: z
    .string()
    .default('http://localhost:3000')
    .transform(val => {
      const origins = val.split(',').map(o => o.trim())

      origins.forEach(origin => {
        if (origin === '*') {
          throw new Error(
            'Wildcard CORS origin (*) is not allowed for security'
          )
        }

        try {
          new URL(origin)
        } catch {
          throw new Error(`Invalid CORS origin URL: ${origin}`)
        }
      })

      return origins.join(',')
    }),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Email Service (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@example.com'),

  // Redis (optional but validated if provided)
  REDIS_URL: z.string().url().optional().or(z.literal('')),

  // Cleanup Configuration
  CLEANUP_BATCH_SIZE: z.string().default('1000'),
  CLEANUP_PAUSE_MS: z.string().default('100'),

  // Performance Configuration
  SLOW_QUERY_THRESHOLD: z.string().default('100'), // ms

  // Version
  APP_VERSION: z.string().default('1.0.0'),

  // Worker Configuration
  DISABLE_STRIPE_WORKER: z.string().optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
})

/**
 * Parse and validate environment variables
 * Throws error if any variable is missing or invalid
 */
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  // Use process.stderr.write instead of console to avoid potential issues
  // (this runs before logger is initialized, so we can't use logger here)
  process.stderr.write('❌ Invalid environment variables:\n')

  // Sanitize error messages to avoid exposing secrets in logs
  // Only show which fields are invalid, not their values
  const sanitizedErrors = parsed.error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }))

  process.stderr.write(JSON.stringify(sanitizedErrors, null, 2) + '\n')
  process.exit(1)
}

/**
 * Validated and typed environment variables
 * Fail-fast validation at application startup
 *
 * @example
 * ```typescript
 * import { env } from '@/config/env'
 *
 * logger.info(env.PORT)           // "3001" (string)
 * logger.info(env.NODE_ENV)       // "development" | "production" | "test"
 * logger.info(env.DATABASE_URL)   // "postgresql://..." (validated URL)
 * logger.info(env.JWT_SECRET)     // Min 32 chars guaranteed by Zod
 * ```
 *
 * @example
 * ```bash
 * # .env file
 * NODE_ENV=development
 * PORT=3001
 * DATABASE_URL=postgresql://postgres:password@localhost:5432/mydb
 * JWT_SECRET=your-super-secret-key-min-32-chars
 * JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
 * ```
 */
export const env = parsed.data
