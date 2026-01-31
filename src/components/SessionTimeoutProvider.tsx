'use client';

/**
 * HIPAA-Compliant Session Timeout Provider
 *
 * Wraps the application to provide automatic session timeout
 * for security compliance. Only active when user is authenticated.
 */

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useSessionTimeout } from '@/lib/hooks/useSessionTimeout';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';

// Session timeout configuration (can be overridden via env vars)
const SESSION_CONFIG = {
  // 15 minutes inactivity timeout (HIPAA recommended)
  timeoutMs: parseInt(
    process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MS || '900000',
    10
  ),
  // 2 minutes warning before timeout
  warningMs: parseInt(
    process.env.NEXT_PUBLIC_SESSION_WARNING_MS || '120000',
    10
  ),
  // 8 hours maximum session
  maxSessionMs: parseInt(
    process.env.NEXT_PUBLIC_MAX_SESSION_DURATION_MS || '28800000',
    10
  ),
};

function SessionTimeoutManager() {
  const { user } = useAuth();

  const { isWarningVisible, remainingSeconds, extendSession } =
    useSessionTimeout({
      ...SESSION_CONFIG,
      enabled: !!user, // Only enable when user is logged in
    });

  // Don't render anything if user is not logged in
  if (!user) return null;

  return (
    <SessionTimeoutWarning
      isVisible={isWarningVisible}
      remainingSeconds={remainingSeconds}
      onExtend={extendSession}
    />
  );
}

export function SessionTimeoutProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SessionTimeoutManager />
    </>
  );
}
