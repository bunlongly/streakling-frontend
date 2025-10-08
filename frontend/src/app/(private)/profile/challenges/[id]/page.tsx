'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { Challenge } from '@/types/challenge';
import ChallengeForm from '@/components/challenges/ChallengeForm';
import Link from 'next/link';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return 'Failed to load challenge';
}

export default function EditChallengePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const synced = useBackendSessionSync();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [c, setC] = useState<Challenge | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !synced || !params?.id) return;
    (async () => {
      try {
        const res = await api.challenge.getById(params.id, {
          headers: { 'cache-control': 'no-cache' }
        });
        setC(res.data);
      } catch (e) {
        setErr(getErrorMessage(e));
      }
    })();
  }, [isLoaded, isSignedIn, synced, params?.id]);

  if (!isLoaded || !synced)
    return <div className='p-6'>Preparing your session…</div>;
  if (!isSignedIn) return <div className='p-6'>Please sign in.</div>;
  if (err) return <div className='p-6 text-red-600'>{err}</div>;
  if (!c) return <div className='p-6'>Loading…</div>;

  function onSaved(next: Challenge) {
    setC(next);
  }

  return (
    <div className='max-w-3xl mx-auto px-4 py-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Edit Challenge</h1>
        <Link
          href='/public/challenges'
          className='px-3 py-1.5 rounded-lg border'
        >
          Back
        </Link>
      </div>

      <ChallengeForm mode='edit' initial={c} onSaved={onSaved} />

      <div className='pt-4'>
        <button
          className='text-sm rounded px-3 py-1.5 border text-red-600 hover:bg-red-50'
          onClick={async () => {
            await api.challenge.deleteById(c.id);
            router.replace('/public/challenges');
          }}
        >
          Delete challenge
        </button>
      </div>
    </div>
  );
}
