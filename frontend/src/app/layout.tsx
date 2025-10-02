// src/app/layout.tsx
import type { ReactNode } from 'react';
import type { Metadata } from 'next'; // 👈 add this
import './globals.css';
import './theme.css';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata: Metadata = {
  // 👈 type it as Metadata
  title: 'Streakling',
  description: 'Creator profiles'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' data-theme='dark' suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
