'use client';

import { SessionProvider } from 'next-auth/react';
import { SolanaProvider } from './SolanaProvider';
import { AuthProvider } from './AuthProvider';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <SolanaProvider>
        <AuthProvider>{children}</AuthProvider>
      </SolanaProvider>
    </SessionProvider>
  );
}
