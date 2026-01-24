'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ProfileProvider } from '@/lib/hooks/useProfile';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>{children}</ProfileProvider>
    </AuthProvider>
  );
}
