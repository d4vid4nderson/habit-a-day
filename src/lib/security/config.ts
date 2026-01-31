/**
 * HIPAA Security Configuration
 *
 * Centralized security settings for HIPAA compliance.
 * These values can be overridden via environment variables.
 */

export const HIPAA_CONFIG = {
  /**
   * Session timeout in milliseconds (default: 15 minutes)
   * HIPAA recommends 15-30 minutes for automatic logout
   */
  SESSION_TIMEOUT_MS: parseInt(
    process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS || '900000',
    10
  ),

  /**
   * Warning before session expires in milliseconds (default: 2 minutes)
   */
  SESSION_WARNING_MS: parseInt(
    process.env.NEXT_PUBLIC_SESSION_WARNING_MS || '120000',
    10
  ),

  /**
   * Maximum session duration in milliseconds (default: 8 hours)
   * Forces re-authentication even with activity
   */
  MAX_SESSION_DURATION_MS: parseInt(
    process.env.NEXT_PUBLIC_MAX_SESSION_DURATION_MS || '28800000',
    10
  ),

  /**
   * Audit log retention period in days (HIPAA minimum: 6 years = 2190 days)
   */
  AUDIT_LOG_RETENTION_DAYS: parseInt(
    process.env.AUDIT_LOG_RETENTION_DAYS || '2190',
    10
  ),

  /**
   * Enable encryption for sensitive fields at rest
   */
  ENCRYPT_PHI_AT_REST: process.env.ENCRYPT_PHI_AT_REST === 'true',

  /**
   * Encryption key for application-level PHI encryption
   * Must be 32 bytes (256 bits) for AES-256
   */
  PHI_ENCRYPTION_KEY: process.env.PHI_ENCRYPTION_KEY,

  /**
   * List of fields considered PHI that require encryption
   */
  PHI_FIELDS: [
    'notes', // Can contain health information
    'pain_level', // Health data
    'urine_color', // Health indicator
    'stream_strength', // Health data
  ] as const,

  /**
   * Session cookie settings
   */
  SESSION_COOKIE: {
    name: 'hab-session-activity',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
} as const;

/**
 * Security headers for HIPAA compliance
 */
export const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS filter
  'X-XSS-Protection': '1; mode=block',

  // Referrer policy - don't leak URLs
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy - disable unnecessary features
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',

  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js
    "style-src 'self' 'unsafe-inline'", // Required for Tailwind
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.dicebear.com https://oauth.fatsecret.com https://platform.fatsecret.com https://api.duckduckgo.com https://world.openfoodfacts.org",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  // HSTS - Force HTTPS (only in production)
  ...(process.env.NODE_ENV === 'production'
    ? {
        'Strict-Transport-Security':
          'max-age=31536000; includeSubDomains; preload',
      }
    : {}),
} as const;
