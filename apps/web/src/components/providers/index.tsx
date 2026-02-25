'use client';

import { SessionProvider } from 'next-auth/react';
import { EVMProvider } from './EVMProvider';
import { AuthProvider } from './AuthProvider';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <EVMProvider>
        <AuthProvider>{children}</AuthProvider>
      </EVMProvider>
    </SessionProvider>
  );
}
