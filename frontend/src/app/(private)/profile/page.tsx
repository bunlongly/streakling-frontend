// src/app/(private)/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import { api, HttpError } from '@/lib/api';
import type { PublicProfile } from '@/types/profile';
import ProfileCard from '@/components/profile/ProfileCard';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MyProfileClientPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const synced = useBackendSessionSync();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }
    if (!synced) return;

    (async () => {
      try {
        const res = await api.profile.get({
          headers: { 'cache-control': 'no-cache' }
        });
        setProfile(res.data);
      } catch (e: unknown) {
        const message =
          e instanceof HttpError
            ? e.message
            : e instanceof Error
            ? e.message
            : 'Failed to load profile';
        setErr(message);
      }
    })();
  }, [isLoaded, isSignedIn, synced, router]);

  if (!isLoaded || !synced) {
    return <div className='p-6'>Preparing your session…</div>;
  }
  if (err) {
    return <div className='p-6 text-red-600'>{err}</div>;
  }
  if (!profile) {
    return <div className='p-6'>Loading…</div>;
  }

  return (
    <div className='max-w-3xl mx-auto px-4 py-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>My Profile</h1>
        <Link href='/profile/edit' className='px-3 py-1.5 rounded-lg border'>
          Edit
        </Link>
      </div>
      <ProfileCard profile={profile} />
    </div>
  );
}
