// src/app/profile/challenges/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import { api } from '@/lib/api';
import type { Challenge } from '@/types/challenge';
import Link from 'next/link';

export default function MyChallengesPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const synced = useBackendSessionSync(); // sets backend session cookie
  const [items, setItems] = useState<Challenge[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !synced) return;
    (async () => {
      try {
        const res = await api.challenge.listMine({
          headers: { 'cache-control': 'no-cache' }
        });
        setItems(res.data);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load challenges');
      }
    })();
  }, [isLoaded, isSignedIn, synced]);

  if (!isLoaded || !synced)
    return <div className='p-6'>Preparing your session…</div>;
  if (!isSignedIn) return <div className='p-6'>Please sign in.</div>;
  if (err) return <div className='p-6 text-red-600'>{err}</div>;
  if (!items) return <div className='p-6'>Loading…</div>;

  return (
    <div className='max-w-3xl mx-auto px-4 py-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>My Challenges</h1>
        <Link
          href='/profile/challenges/create'
          className='px-3 py-1.5 rounded-lg border'
        >
          New
        </Link>
      </div>

      {items.length === 0 ? (
        <p className='text-gray-600'>No challenges yet.</p>
      ) : (
        <ul className='space-y-3'>
          {items.map(c => (
            <li key={c.id} className='rounded-xl border p-4'>
              <div className='flex items-center justify-between'>
                <div className='font-medium'>{c.title}</div>
                <div className='text-sm text-gray-500'>
                  {c.publishStatus} • {c.status}
                </div>
              </div>

              <div className='mt-2 text-sm text-gray-600'>
                {c.brandName ?? '—'} •{' '}
                {c.postedOn
                  ? c.postedOn.slice(0, 10)
                  : c.createdAt.slice(0, 10)}
              </div>

              <div className='mt-3 flex flex-wrap gap-2'>
                <Link
                  href={`/profile/challenges/${c.id}`}
                  className='px-3 py-1.5 rounded-lg border'
                >
                  Edit
                </Link>
                <Link
                  href={`/challenges/${c.slug}`}
                  className='px-3 py-1.5 rounded-lg border'
                >
                  View Public
                </Link>
                {/* NEW: owner submissions view */}
                <Link
                  href={`/profile/challenges/${c.id}/submissions`}
                  className='px-3 py-1.5 rounded-lg border'
                >
                  Submissions
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
