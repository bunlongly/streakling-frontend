'use client';

import ProfileCardForm from '@/components/digital-card/ProfileCardForm';
import AuthGate from '@/components/AuthGate';
import Header from '@/components/Header';
import useBackendSessionSync from '@/lib/useBackendSessionSync';

export default function ProfilePage() {
  const synced = useBackendSessionSync();

  return (
    <AuthGate>
      <main className='min-h-dvh bg-brand-mix'>
        <Header />
        <section className='max-w-3xl mx-auto mt-16 p-6 card-surface'>
          <h1 className='h1 mb-4'>Edit Digital Name Card</h1>
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
