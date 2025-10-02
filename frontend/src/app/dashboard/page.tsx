'use client';

import Header from '@/components/Header';
import AuthGate from '@/components/AuthGate';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import { backendLogout } from '@/lib/backend';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  useBackendSessionSync(); // sync cookie with backend
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await backendLogout();
    await signOut();
    router.push('/');
  };

  return (
    <AuthGate>
      <main className='min-h-dvh bg-brand-mix'>
        <Header />
        <section className='max-w-3xl mx-auto mt-16 p-6 card-surface'>
          <h1 className='h1'>Dashboard</h1>
          <p className='mt-2 muted'>
            You are signed in. We’ve synced your backend cookie via
            /api/session/login.
          </p>
          <div className='mt-6'>
            <button className='btn-outline' onClick={handleLogout}>
              Sign out (Clerk + Backend)
            </button>
          </div>
        </section>
      </main>
    </AuthGate>
  );
}
