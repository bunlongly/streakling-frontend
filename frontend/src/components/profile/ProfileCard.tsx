// src/components/profile/ProfileCard.tsx
'use client';

import Image from 'next/image';
import type { PublicProfile } from '@/types/profile';

function previewFromKeyOrUrl(key?: string | null, url?: string | null) {
  const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || '';
  if (key && PUBLIC_BASE) return `${PUBLIC_BASE}/${key}`;
  return url ?? null;
}

export default function ProfileCard({ profile }: { profile: PublicProfile }) {
  const avatarSrc =
    previewFromKeyOrUrl(profile.avatarKey, profile.avatarUrl) ?? undefined;
  const bannerSrc = previewFromKeyOrUrl(profile.bannerKey, null) ?? undefined;

  return (
    <div className='rounded-2xl border overflow-hidden'>
      {bannerSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bannerSrc}
          alt='banner'
          className='h-40 w-full object-cover'
        />
      ) : (
        <div className='h-40 w-full bg-gray-100' />
      )}

      <div className='p-5 space-y-4'>
        <div className='flex items-center gap-4'>
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt='avatar'
              width={72}
              height={72}
              className='h-18 w-18 rounded-xl object-cover border'
              priority
            />
          ) : (
            <div className='h-18 w-18 rounded-xl bg-gray-200' />
          )}
          <div>
            <h2 className='text-xl font-semibold'>{profile.displayName}</h2>
            <p className='text-sm text-gray-600'>
              {profile.username ? `@${profile.username}` : 'No username yet'}
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-2 text-sm'>
          {profile.email != null && (
            <div>
              <span className='text-gray-500'>Email:</span>{' '}
              {profile.email || '—'}
            </div>
          )}
          {profile.phone != null && (
            <div>
              <span className='text-gray-500'>Phone:</span>{' '}
              {profile.phone || '—'}
            </div>
          )}
          {profile.country != null && (
            <div>
              <span className='text-gray-500'>Country:</span>{' '}
              {profile.country || '—'}
            </div>
          )}
          {profile.religion != null && (
            <div>
              <span className='text-gray-500'>Religion:</span>{' '}
              {profile.religion || '—'}
            </div>
          )}
          {profile.dateOfBirth != null && (
            <div>
              <span className='text-gray-500'>DOB:</span>{' '}
              {profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '—'}
            </div>
          )}
        </div>

        <div className='text-sm'>
          <span className='text-gray-500'>Industries:</span>{' '}
          {profile.industries.length > 0
            ? profile.industries.map(i => i.name || i.slug).join(', ')
            : '—'}
        </div>
      </div>
    </div>
  );
}
