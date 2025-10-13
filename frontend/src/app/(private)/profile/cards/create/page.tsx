'use client';

import AuthGate from '@/components/AuthGate';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import ProfileCardForm from '@/components/digital-card/ProfileCardForm';

export default function CreateCardPage() {
  const synced = useBackendSessionSync();
  return (
    <AuthGate>
      <main className='min-h-dvh bg-brand-mix'>
        <section className='max-w-3xl mx-auto mt-16 p-6 card-surface'>
          <h1 className='h1 mb-4'>Create Digital Card</h1>
          {!synced ? (
            <p className='muted'>Preparing your session…</p>
          ) : (
            <ProfileCardForm />
          )}
        </section>
      </main>
    </AuthGate>
  );
}
