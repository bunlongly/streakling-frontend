'use client';

import AuthGate from '@/components/AuthGate';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import ProfileCardForm from '@/components/digital-card/ProfileCardForm';

export default function CreateCardPage() {
  const synced = useBackendSessionSync();

  return (
    <AuthGate>
      <main className='min-h-dvh bg-brand-mix'>
        <section
          className='max-w-4xl mx-auto mt-12 md:mt-16 p-6 md:p-8 rounded-2xl border border-token bg-surface'
          style={{
            boxShadow:
              '0 2px 10px rgba(10,10,15,0.06), 0 18px 36px rgba(10,10,15,0.08)'
          }}
        >
          <header className='mb-6'>
            <h1 className='text-2xl md:text-3xl font-semibold'>
              Create Digital Card
            </h1>
            <p className='text-sm text-gray-600 mt-1'>
              Add your basic info, choose what is public, and attach socials. You
              can publish later.
            </p>
          </header>

          {!synced ? (
            <p className='muted'>Loading...</p>
          ) : (
            <ProfileCardForm />
          )}
        </section>
      </main>
    </AuthGate>
  );
}
