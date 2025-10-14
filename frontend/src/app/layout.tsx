// src/app/layout.tsx
import { Montserrat } from 'next/font/google';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import './theme.css';
import Navbar from '@/components/nav/Navbar';
import ClientProviders from './providers/ClientProviders';
import BackToTop from '@/components/BackToTop';
import Footer from '@/components/Footer';
import IntroSplash from '@/components/IntroSplash';

export const metadata: Metadata = {
  title: 'Streakling',
  description: 'Creator profiles'
};

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700']
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en'>
      <body className={montserrat.variable}>
        <ClientProviders>
          <div className='app-shell min-h-dvh flex flex-col'>
            {/* ⬇️ Intro splash overlays the app on each refresh */}
            <IntroSplash
            // Optional tweaks:
            // src="/intro.mp4"
            // poster="/hero-poster.jpg"
            // logoSrc="/logo.png"
            // maxShowMs={3600}
            // minShowMs={900}
            // showOncePerSession={true}
            />
            <Navbar />
            <div className='flex-1'>{children}</div>
            <Footer />
            <BackToTop />
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
