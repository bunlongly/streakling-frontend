import { Montserrat } from 'next/font/google';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import './theme.css';
import Navbar from '@/components/nav/Navbar';
import ClientProviders from './providers/ClientProviders';

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
          <div className='app-shell'>
            <Navbar />
            {children}
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
