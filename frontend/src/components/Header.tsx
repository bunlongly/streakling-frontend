'use client';

import Link from 'next/link';
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton
} from '@clerk/nextjs';

export default function Header() {
  return (
    <header className='w-full max-w-6xl mx-auto flex items-center justify-between py-4 px-4'>
      <Link href='/' className='font-bold'>
        Streakling
      </Link>

      <nav className='flex items-center gap-3'>
        <Link href='/dashboard' className='btn-outline'>
          Dashboard
        </Link>

        {/* Avoid SSR ↔ client mismatch by waiting for Clerk to be ready */}
        <ClerkLoading>
          {/* tiny skeleton to keep DOM stable */}
          <div
            className='w-24 h-9 rounded card-surface animate-pulse'
            aria-hidden
          />
        </ClerkLoading>

        <ClerkLoaded>
          <SignedOut>
            <SignInButton mode='modal'>
              <button className='btn'>Sign in</button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl='/' />
          </SignedIn>
        </ClerkLoaded>
      </nav>
    </header>
  );
}
