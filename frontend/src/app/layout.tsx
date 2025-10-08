import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import './theme.css';
import { ClerkProvider } from '@clerk/nextjs';
import Header from '@/components/Header'; // or '@/components/Header' if that's your path

export const metadata: Metadata = {
  title: 'Streakling',
  description: 'Creator profiles'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' data-theme='dark' suppressHydrationWarning>
      <head>
        {/* No-flash: pick saved or system theme before paint */}
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
      <body suppressHydrationWarning>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
          {/* The gradient covers the WHOLE app, all routes */}
          <div className='app-shell'>
            <Header />
            {children}
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
