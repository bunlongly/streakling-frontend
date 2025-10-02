'use client';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import type { ReactNode } from 'react';

export default function AuthGate({ children }: { children: ReactNode }) {
  return (
    <>
      <SignedOut>
        <div className='min-h-dvh bg-brand-mix grid place-items-center p-8'>
          <div className='card-surface p-8 text-center'>
            <h2 className='text-2xl font-semibold'>Sign in required</h2>
            <p className='mt-2 muted'>
              Please sign in to access your dashboard.
            </p>
            <div className='mt-4'>
              <SignInButton mode='modal'>
                <button className='btn'>Sign in</button>
              </SignInButton>
            </div>
          </div>
        </div>
      </SignedOut>
      <SignedIn>{children}</SignedIn>
    </>
  );
}
