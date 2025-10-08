import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import './theme.css';
import { ClerkProvider } from '@clerk/nextjs';
import Navbar from '@/components/nav/Navbar';
import { Montserrat, Cormorant_Garamond } from 'next/font/google';

export const metadata: Metadata = {
  title: 'Streakling',
  description: 'Creator profiles'
};

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap'
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-display', // used as “Raffles-style” display serif
  display: 'swap',
  weight: ['400', '500', '600', '700']
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* No-flash theme pick */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var theme = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (_) {}
})();
`
          }}
        />
      </head>
      <body className={`${montserrat.variable} ${cormorant.variable}`} suppressHydrationWarning>
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
          <div className="app-shell">
            <Navbar />
            {children}
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
