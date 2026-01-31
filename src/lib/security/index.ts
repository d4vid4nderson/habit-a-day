/**
 * HIPAA Security Module
 *
 * Centralized exports for all security-related utilities.
 * Import from '@/lib/security' for all security functionality.
 */

// Configuration
export { HIPAA_CONFIG, SECURITY_HEADERS } from './config';

// Encryption utilities
export {
  encryptPHI,
  decryptPHI,
  isEncrypted,
  encryptFields,
  decryptFields,
  generateEncryptionKey,
  hashForLogging,
} from './encryption';

// Data sanitization
export {
  sanitizeForExternalAPI,
  sanitizeAIResponse,
  containsPotentialPHI,
  extractFoodContentOnly,
  createExternalAPIAuditHash,
} from './sanitizer';
