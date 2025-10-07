// src/app/(private)/profile/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import { api } from '@/lib/api';
import type { PublicProfile } from '@/types/profile';
import ProfileForm from '@/components/profile/ProfileForm';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditProfileClientPage() {
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
        const res = await api.profile.get({ headers: { 'cache-control': 'no-cache' } });
        setProfile(res.data);
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to load profile');
      }
    })();
  }, [isLoaded, isSignedIn, synced, router]);

  if (!isLoaded || !synced) return <div className="p-6">Preparing your session…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!profile) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Profile</h1>
        <Link href="/profile" className="px-3 py-1.5 rounded-lg border">
          Back
        </Link>
      </div>
      <ProfileForm initial={profile} />
    </div>
  );
}
