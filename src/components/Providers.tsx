'use client';

import { ReactNode } from 'react';
import { GenderProvider } from '@/lib/GenderContext';

export function Providers({ children }: { children: ReactNode }) {
  return <GenderProvider>{children}</GenderProvider>;
}
