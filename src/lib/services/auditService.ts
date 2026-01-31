/**
 * HIPAA-Compliant Audit Logging Service
 *
 * This service provides comprehensive audit logging for all PHI access
 * to maintain HIPAA compliance. Logs are retained for minimum 6 years.
 *
 * IMPORTANT: Never log actual PHI data - only log metadata about access.
 */

import { createClient } from '@/lib/supabase/server';

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGE'
  | 'ACCESS_DENIED'
  | 'PHI_ACCESS';

export type ResourceType =
  | 'profile'
  | 'bathroom_entry'
  | 'water_entry'
  | 'food_entry'
  | 'pt_entry'
  | 'custom_food'
  | 'user_goal'
  | 'account'
  | 'session'
  | 'export';

export type AuditStatus = 'success' | 'failure' | 'denied';

export interface AuditLogEntry {
  user_id?: string;
  session_id?: string;
  action: AuditAction;
  resource_type: ResourceType;
  resource_id?: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  request_path?: string;
  status?: AuditStatus;
  error_message?: string;
}

/**
 * Sanitize any potentially sensitive data from log descriptions
 * Removes names, emails, specific health values, etc.
 */
function sanitizeDescription(description: string): string {
  // Remove email patterns
  let sanitized = description.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL_REDACTED]'
  );

  // Remove potential SSN patterns
  sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');

  // Remove phone numbers
  sanitized = sanitized.replace(
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    '[PHONE_REDACTED]'
  );

  // Remove specific health values (weight, calories with units)
  sanitized = sanitized.replace(
    /\b\d+\.?\d*\s*(lbs?|kg|pounds?|kilograms?|calories?|cal)\b/gi,
    '[VALUE_REDACTED]'
  );

  return sanitized;
}

/**
 * Log an audit event for HIPAA compliance
 *
 * @param entry - The audit log entry details
 * @returns Promise<boolean> - Whether the log was successfully recorded
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Sanitize description if provided
    const sanitizedDescription = entry.description
      ? sanitizeDescription(entry.description)
      : undefined;

    const { error } = await supabase.from('audit_logs').insert({
      user_id: entry.user_id,
      session_id: entry.session_id,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      description: sanitizedDescription,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      request_path: entry.request_path,
      status: entry.status || 'success',
      error_message: entry.error_message,
    });

    if (error) {
      // Log to console as fallback - audit logging should not break the app
      console.error('[AUDIT] Failed to write audit log:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    // Audit logging failures should not break application functionality
    console.error('[AUDIT] Exception writing audit log:', error);
    return false;
  }
}

/**
 * Log PHI access event - convenience wrapper for common health data access
 */
export async function logPHIAccess(
  userId: string,
  resourceType: ResourceType,
  action: AuditAction,
  resourceId?: string,
  requestContext?: {
    ip_address?: string;
    user_agent?: string;
    request_path?: string;
  }
): Promise<boolean> {
  return logAuditEvent({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    description: `PHI ${action.toLowerCase()} on ${resourceType}`,
    ...requestContext,
  });
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE',
  userId?: string,
  status: AuditStatus = 'success',
  requestContext?: {
    ip_address?: string;
    user_agent?: string;
  }
): Promise<boolean> {
  return logAuditEvent({
    user_id: userId,
    action,
    resource_type: 'session',
    status,
    description: `Authentication event: ${action}`,
    ...requestContext,
  });
}

/**
 * Log data export events (required for HIPAA - track when PHI leaves the system)
 */
export async function logDataExport(
  userId: string,
  exportType: string,
  requestContext?: {
    ip_address?: string;
    user_agent?: string;
    request_path?: string;
  }
): Promise<boolean> {
  return logAuditEvent({
    user_id: userId,
    action: 'EXPORT',
    resource_type: 'export',
    description: `Data export: ${exportType}`,
    ...requestContext,
  });
}

/**
 * Log access denied events
 */
export async function logAccessDenied(
  userId: string | undefined,
  resourceType: ResourceType,
  reason: string,
  requestContext?: {
    ip_address?: string;
    user_agent?: string;
    request_path?: string;
  }
): Promise<boolean> {
  return logAuditEvent({
    user_id: userId,
    action: 'ACCESS_DENIED',
    resource_type: resourceType,
    status: 'denied',
    description: `Access denied: ${reason}`,
    ...requestContext,
  });
}

/**
 * Batch log multiple audit events (for bulk operations)
 */
export async function logBatchAuditEvents(
  entries: AuditLogEntry[]
): Promise<boolean> {
  try {
    const supabase = await createClient();

    const sanitizedEntries = entries.map((entry) => ({
      ...entry,
      description: entry.description
        ? sanitizeDescription(entry.description)
        : undefined,
      status: entry.status || 'success',
    }));

    const { error } = await supabase.from('audit_logs').insert(sanitizedEntries);

    if (error) {
      console.error('[AUDIT] Failed to write batch audit logs:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[AUDIT] Exception writing batch audit logs:', error);
    return false;
  }
}

/**
 * Get request context from headers (for use in API routes)
 */
export function getRequestContext(headers: Headers): {
  ip_address?: string;
  user_agent?: string;
} {
  return {
    ip_address:
      headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headers.get('x-real-ip') ||
      undefined,
    user_agent: headers.get('user-agent') || undefined,
  };
}
