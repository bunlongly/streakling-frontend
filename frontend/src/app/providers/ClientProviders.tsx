// src/app/providers/ClientProviders.tsx
'use client';

import { PrimaryThemeProvider } from '@/styles/muiTheme';
import { ClerkProvider } from '@clerk/nextjs';
import UsernameGate from '@/components/onboarding/UsernameGate';

export default function ClientProviders({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <PrimaryThemeProvider>
        <UsernameGate />
        {children}
      </PrimaryThemeProvider>
    </ClerkProvider>
  );
}
