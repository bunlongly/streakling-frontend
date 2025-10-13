'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { PrimaryThemeProvider } from '@/styles/muiTheme';
import type { PropsWithChildren } from 'react';

export default function ClientProviders({ children }: PropsWithChildren) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <PrimaryThemeProvider>{children}</PrimaryThemeProvider>
    </ClerkProvider>
  );
}
