'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProfile } from '@/lib/hooks/useProfile';
import { SetupWizard } from '@/components/setup';

export default function SetupPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, profileCompleted } = useProfile();
  const router = useRouter();

  useEffect(() => {
    // Wait for loading to complete
    if (authLoading || profileLoading) return;

    // If not logged in, redirect to login
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // If profile is already completed, redirect to home
    if (profileCompleted) {
      router.push('/');
      return;
    }
  }, [user, authLoading, profileLoading, profileCompleted, router]);

  // Show loading state
  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-zinc-50 dark:from-zinc-950 dark:via-teal-950/20 dark:to-zinc-950">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  // Don't render wizard if not authenticated or if profile is completed
  if (!user || profileCompleted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-zinc-50 dark:from-zinc-950 dark:via-teal-950/20 dark:to-zinc-950">
        <div className="text-zinc-500">Redirecting...</div>
      </div>
    );
  }

  return <SetupWizard />;
}
