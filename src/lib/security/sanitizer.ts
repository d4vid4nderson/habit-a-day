/**
 * HIPAA-Compliant Data Sanitization
 *
 * Utilities to sanitize data before sending to external services (like AI APIs)
 * to prevent inadvertent PHI disclosure.
 */

/**
 * Patterns that might indicate PHI in free-text fields
 */
const PHI_PATTERNS = {
  // Personal identifiers
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /\b(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,

  // Names (common patterns - first last, Dr. Name, etc.)
  // Be careful not to match food items
  namePatterns:
    /\b(my name is|i am|i'm|patient|dr\.?|doctor)\s+[A-Z][a-z]+\s+[A-Z][a-z]+/gi,

  // Dates that might be birth dates or appointment dates
  birthDate:
    /\b(born|dob|birth\s*date|birthday)[:\s]+\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/gi,

  // Medical record numbers
  medicalRecord: /\b(mrn|medical record|patient id)[:\s#]*[A-Z0-9]+/gi,

  // Addresses
  address:
    /\b\d+\s+[A-Za-z]+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|court|ct)\b/gi,

  // Health conditions mentioned with personal context
  personalHealth:
    /\b(i have|diagnosed with|my|suffering from)\s+(diabetes|cancer|hiv|aids|depression|anxiety|heart disease)/gi,

  // Medication with personal context
  personalMedication:
    /\b(taking|prescribed|my medication)\s+[A-Za-z]+\s*\d*\s*mg?/gi,
};

/**
 * Sanitize text before sending to external AI services
 * Removes potential PHI while preserving food/nutrition context
 *
 * @param text - Input text (typically food descriptions)
 * @returns Sanitized text safe for external APIs
 */
export function sanitizeForExternalAPI(text: string): string {
  let sanitized = text;

  // Remove email addresses
  sanitized = sanitized.replace(PHI_PATTERNS.email, '[EMAIL]');

  // Remove phone numbers
  sanitized = sanitized.replace(PHI_PATTERNS.phone, '[PHONE]');

  // Remove SSN
  sanitized = sanitized.replace(PHI_PATTERNS.ssn, '[REDACTED]');

  // Remove name patterns
  sanitized = sanitized.replace(PHI_PATTERNS.namePatterns, '[NAME]');

  // Remove birth dates
  sanitized = sanitized.replace(PHI_PATTERNS.birthDate, '[DATE]');

  // Remove medical record numbers
  sanitized = sanitized.replace(PHI_PATTERNS.medicalRecord, '[MRN]');

  // Remove addresses
  sanitized = sanitized.replace(PHI_PATTERNS.address, '[ADDRESS]');

  // Remove personal health mentions
  sanitized = sanitized.replace(
    PHI_PATTERNS.personalHealth,
    '[HEALTH_CONDITION]'
  );

  // Remove personal medication mentions
  sanitized = sanitized.replace(
    PHI_PATTERNS.personalMedication,
    '[MEDICATION]'
  );

  return sanitized;
}

/**
 * Check if text contains potential PHI
 *
 * @param text - Text to check
 * @returns true if potential PHI detected
 */
export function containsPotentialPHI(text: string): boolean {
  for (const [, pattern] of Object.entries(PHI_PATTERNS)) {
    if (pattern.test(text)) {
      // Reset regex state
      pattern.lastIndex = 0;
      return true;
    }
    // Reset regex state
    pattern.lastIndex = 0;
  }
  return false;
}

/**
 * Extract only food-related content from text
 * More aggressive sanitization for maximum safety
 *
 * @param text - Input text
 * @returns Text with only food-related content
 */
export function extractFoodContentOnly(text: string): string {
  // If the text is short and looks like a simple food item, return it
  if (text.length < 100 && !containsPotentialPHI(text)) {
    return text;
  }

  // For longer text, be more aggressive
  let sanitized = sanitizeForExternalAPI(text);

  // Remove anything after common phrases that might lead to personal info
  const cutoffPhrases = [
    'because i',
    'since i',
    'due to my',
    'for my',
    'to help with',
    'doctor said',
    'prescribed',
  ];

  for (const phrase of cutoffPhrases) {
    const index = sanitized.toLowerCase().indexOf(phrase);
    if (index > 0) {
      sanitized = sanitized.substring(0, index).trim();
    }
  }

  return sanitized;
}

/**
 * Validate that AI responses don't contain echoed PHI
 * (In case PHI was accidentally included and the AI echoed it back)
 *
 * @param response - AI response text
 * @returns Sanitized response
 */
export function sanitizeAIResponse(response: string): string {
  return sanitizeForExternalAPI(response);
}

/**
 * Log that data is being sent to external service (for audit purposes)
 * Returns a hash of the content for audit trail without storing PHI
 */
export function createExternalAPIAuditHash(
  content: string
): { hash: string; containedPHI: boolean } {
  const containedPHI = containsPotentialPHI(content);

  // Create a simple hash for audit trail
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return {
    hash: Math.abs(hash).toString(16).padStart(8, '0'),
    containedPHI,
  };
}
