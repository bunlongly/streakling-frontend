'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import ChallengeForm from '@/components/challenges/ChallengeForm';
import type { Challenge } from '@/types/challenge';

export default function CreateChallengePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const synced = useBackendSessionSync();

  if (!isLoaded || !synced)
    return <div className='p-6'>Preparing your session…</div>;
  if (!isSignedIn) return <div className='p-6'>Please sign in.</div>;

  function onSaved(c: Challenge) {
    router.replace(`/profile/challenges/${c.id}`);
  }

  return (
    <div className='max-w-3xl mx-auto px-4 py-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>Create Challenge</h1>
      <ChallengeForm mode='create' onSaved={onSaved} />
    </div>
  );
}
