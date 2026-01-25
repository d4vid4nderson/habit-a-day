'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { ProfileProvider, useProfile } from '@/lib/hooks/useProfile';
import { TermsAcceptanceModal } from '@/components/TermsAcceptanceModal';

// Paths that don't require terms acceptance
const PUBLIC_PATHS = ['/auth/login', '/auth/callback', '/auth/setup'];

function TermsGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, termsAccepted } = useProfile();
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    try {
      // Don't show modal on public paths
      if (PUBLIC_PATHS.some(path => pathname?.startsWith(path))) {
        setShowTermsModal(false);
        return;
      }

      // Don't show while loading - keep current state
      if (authLoading || profileLoading) {
        return;
      }

      // Show modal if user is logged in, has a profile, but hasn't accepted terms
      const shouldShowModal = !!(user && profile && !termsAccepted);
      setShowTermsModal(shouldShowModal);
    } catch (err) {
      console.error('TermsGate error:', err);
      setShowTermsModal(false);
    }
  }, [user, profile, termsAccepted, authLoading, profileLoading, pathname]);

  const handleTermsAccepted = () => {
    setShowTermsModal(false);
  };

  return (
    <>
      <div className={showTermsModal ? 'blur-sm pointer-events-none select-none' : ''}>
        {children}
      </div>
      {showTermsModal && <TermsAcceptanceModal onAccepted={handleTermsAccepted} />}
    </>
  );
}

function ProvidersInner({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <TermsGate>{children}</TermsGate>
    </ProfileProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProvidersInner>{children}</ProvidersInner>
    </AuthProvider>
  );
}
