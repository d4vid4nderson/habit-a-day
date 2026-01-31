/**
 * HIPAA-Compliant Application-Level Encryption
 *
 * Provides AES-256-GCM encryption for sensitive PHI fields.
 * This adds defense-in-depth on top of database-level encryption.
 *
 * IMPORTANT: Store PHI_ENCRYPTION_KEY securely and never commit it to source control.
 * The key must be exactly 32 bytes (256 bits) for AES-256.
 */

import { HIPAA_CONFIG } from './config';

// Encryption configuration
const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 128; // 128 bits

/**
 * Derive a cryptographic key from the configured encryption key
 */
async function getEncryptionKey(): Promise<CryptoKey | null> {
  const keyString = HIPAA_CONFIG.PHI_ENCRYPTION_KEY;

  if (!keyString) {
    console.warn(
      '[SECURITY] PHI_ENCRYPTION_KEY not configured - encryption disabled'
    );
    return null;
  }

  // Ensure key is proper length (32 bytes for AES-256)
  const keyBuffer = Buffer.from(keyString, 'base64');
  if (keyBuffer.length !== 32) {
    console.error(
      '[SECURITY] PHI_ENCRYPTION_KEY must be exactly 32 bytes (256 bits)'
    );
    return null;
  }

  // Import key for Web Crypto API
  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt sensitive data using AES-256-GCM
 *
 * @param plaintext - The data to encrypt
 * @returns Encrypted string in format: iv:ciphertext (base64 encoded)
 */
export async function encryptPHI(plaintext: string): Promise<string> {
  if (!HIPAA_CONFIG.ENCRYPT_PHI_AT_REST) {
    return plaintext; // Encryption disabled
  }

  const key = await getEncryptionKey();
  if (!key) {
    return plaintext; // Key not configured
  }

  try {
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Encrypt the data
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: AUTH_TAG_LENGTH,
      },
      key,
      data
    );

    // Combine IV and ciphertext, encode as base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return `enc:${Buffer.from(combined).toString('base64')}`;
  } catch (error) {
    console.error('[SECURITY] Encryption failed:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 *
 * @param ciphertext - The encrypted string (format: enc:base64data)
 * @returns Decrypted plaintext
 */
export async function decryptPHI(ciphertext: string): Promise<string> {
  // Check if data is encrypted
  if (!ciphertext.startsWith('enc:')) {
    return ciphertext; // Not encrypted, return as-is
  }

  const key = await getEncryptionKey();
  if (!key) {
    console.error('[SECURITY] Cannot decrypt - encryption key not configured');
    return '[ENCRYPTED_DATA]'; // Don't expose encrypted data
  }

  try {
    // Remove prefix and decode
    const encoded = ciphertext.slice(4);
    const combined = Buffer.from(encoded, 'base64');

    // Extract IV and ciphertext
    const iv = combined.slice(0, IV_LENGTH);
    const encrypted = combined.slice(IV_LENGTH);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: AUTH_TAG_LENGTH,
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('[SECURITY] Decryption failed:', error);
    return '[DECRYPTION_FAILED]';
  }
}

/**
 * Check if a string is encrypted
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith('enc:');
}

/**
 * Encrypt multiple fields in an object
 */
export async function encryptFields<T extends Record<string, unknown>>(
  data: T,
  fieldsToEncrypt: (keyof T)[]
): Promise<T> {
  const result = { ...data };

  for (const field of fieldsToEncrypt) {
    const value = data[field];
    if (typeof value === 'string' && value.length > 0) {
      (result as Record<string, unknown>)[field as string] = await encryptPHI(value);
    }
  }

  return result;
}

/**
 * Decrypt multiple fields in an object
 */
export async function decryptFields<T extends Record<string, unknown>>(
  data: T,
  fieldsToDecrypt: (keyof T)[]
): Promise<T> {
  const result = { ...data };

  for (const field of fieldsToDecrypt) {
    const value = data[field];
    if (typeof value === 'string' && isEncrypted(value)) {
      (result as Record<string, unknown>)[field as string] = await decryptPHI(value);
    }
  }

  return result;
}

/**
 * Generate a new encryption key (for initial setup)
 * Run this once to generate your PHI_ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(key).toString('base64');
}

/**
 * Hash sensitive data for logging (one-way, can't be reversed)
 * Use this when you need to log identifiers without exposing PHI
 */
export async function hashForLogging(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  // Return first 8 chars of hash for identification
  return Buffer.from(hashArray).toString('hex').slice(0, 8);
}
