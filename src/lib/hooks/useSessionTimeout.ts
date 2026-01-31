'use client';

/**
 * HIPAA-Compliant Session Timeout Hook
 *
 * Monitors user activity and automatically logs out inactive users
 * to comply with HIPAA security requirements.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Default: 15 minutes inactivity timeout (HIPAA recommended)
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;
// Default: 2 minutes warning before timeout
const DEFAULT_WARNING_MS = 2 * 60 * 1000;
// Default: 8 hours maximum session duration
const DEFAULT_MAX_SESSION_MS = 8 * 60 * 60 * 1000;

interface UseSessionTimeoutOptions {
  timeoutMs?: number;
  warningMs?: number;
  maxSessionMs?: number;
  onWarning?: () => void;
  onTimeout?: () => void;
  enabled?: boolean;
}

interface SessionTimeoutState {
  isWarningVisible: boolean;
  remainingSeconds: number;
  extendSession: () => void;
}

export function useSessionTimeout(
  options: UseSessionTimeoutOptions = {}
): SessionTimeoutState {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    warningMs = DEFAULT_WARNING_MS,
    maxSessionMs = DEFAULT_MAX_SESSION_MS,
    onWarning,
    onTimeout,
    enabled = true,
  } = options;

  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());

  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.floor(warningMs / 1000)
  );

  // Handle session timeout - log out user
  const handleTimeout = useCallback(async () => {
    const supabase = createClient();

    // Clear all timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setIsWarningVisible(false);

    // Sign out
    await supabase.auth.signOut();

    // Callback
    onTimeout?.();

    // Redirect to login with timeout message
    router.push('/login?reason=timeout');
  }, [router, onTimeout]);

  // Start countdown when warning appears
  const startCountdown = useCallback(() => {
    let seconds = Math.floor(warningMs / 1000);
    setRemainingSeconds(seconds);

    countdownRef.current = setInterval(() => {
      seconds -= 1;
      setRemainingSeconds(seconds);

      if (seconds <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
      }
    }, 1000);
  }, [warningMs]);

  // Show warning before timeout
  const showWarning = useCallback(() => {
    setIsWarningVisible(true);
    onWarning?.();
    startCountdown();
  }, [onWarning, startCountdown]);

  // Reset timers on activity
  const resetTimers = useCallback(() => {
    // Check if max session duration exceeded
    const sessionDuration = Date.now() - sessionStartRef.current;
    if (sessionDuration >= maxSessionMs) {
      handleTimeout();
      return;
    }

    lastActivityRef.current = Date.now();

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setIsWarningVisible(false);

    // Set warning timer
    warningRef.current = setTimeout(showWarning, timeoutMs - warningMs);

    // Set timeout timer
    timeoutRef.current = setTimeout(handleTimeout, timeoutMs);
  }, [timeoutMs, warningMs, maxSessionMs, showWarning, handleTimeout]);

  // Extend session (user clicked "Stay logged in")
  const extendSession = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // Monitor user activity
  useEffect(() => {
    if (!enabled) return;

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle activity handler to avoid excessive timer resets
    let lastReset = Date.now();
    const throttleMs = 30000; // Only reset timers every 30 seconds of activity

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastReset >= throttleMs) {
        lastReset = now;
        resetTimers();
      }
    };

    // Initialize timers
    sessionStartRef.current = Date.now();
    resetTimers();

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [enabled, resetTimers]);

  return {
    isWarningVisible,
    remainingSeconds,
    extendSession,
  };
}
