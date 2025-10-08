// src/app/(public)/profile/[username]/page.tsx
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import type { PublicProfile } from '@/types/profile';
import ProfileQR from '@/components/profile/ProfileQR';

// Reuse the same key-or-url helper pattern as ProfileCard
function previewFromKeyOrUrl(key?: string | null, url?: string | null) {
  const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || '';
  if (key && PUBLIC_BASE) return `${PUBLIC_BASE}/${key}`;
  return url ?? null;
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || '';

type Props = { params: { username: string } };

export default async function PublicProfilePage({ params }: Props) {
  const res = await api.profile
    .publicGetByUsername(params.username, { cache: 'no-store' })
    .catch(() => null);

  if (!res) notFound();

  const p: PublicProfile = res.data;

  const bannerSrc = previewFromKeyOrUrl(p.bannerKey, null) ?? null;
  const avatarSrc =
    previewFromKeyOrUrl(p.avatarKey, p.avatarUrl ?? null) ?? null;

  // Absolute URL for this profile (matches this route)
  // Example result: https://your-domain.com/profile/alice
  const profileUrl = SITE
    ? `${SITE}/profile/${encodeURIComponent(params.username)}`
    : `/profile/${encodeURIComponent(params.username)}`;

  return (
    <div className='max-w-4xl mx-auto px-4 py-10'>
      <div className='rounded-2xl border overflow-hidden bg-white'>
        {/* Banner */}
        <div className='h-40 w-full bg-gray-100'>
          {bannerSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerSrc}
              alt='banner'
              className='h-full w-full object-cover'
            />
          ) : null}
        </div>

        {/* Main profile info */}
        <div className='p-6'>
          <div className='flex items-center gap-4'>
            <div className='h-20 w-20 rounded-full bg-gray-200 border overflow-hidden'>
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt='avatar'
                  className='h-full w-full object-cover'
                />
              ) : null}
            </div>
            <div>
              <h1 className='text-xl font-semibold'>{p.displayName}</h1>
              {p.username ? (
                <p className='text-gray-500'>@{p.username}</p>
              ) : null}
            </div>
          </div>

          {/* Public fields */}
          <div className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
            {p.showEmail && p.email ? (
              <div>
                <span className='text-gray-500'>Email:</span> {p.email}
              </div>
            ) : null}
            {p.showPhone && p.phone ? (
              <div>
                <span className='text-gray-500'>Phone:</span> {p.phone}
              </div>
            ) : null}
            {p.showCountry && p.country ? (
              <div>
                <span className='text-gray-500'>Country:</span> {p.country}
              </div>
            ) : null}
            {p.showReligion && p.religion ? (
              <div>
                <span className='text-gray-500'>Religion:</span> {p.religion}
              </div>
            ) : null}
            {p.showDateOfBirth && p.dateOfBirth ? (
              <div>
                <span className='text-gray-500'>DOB:</span>{' '}
                {p.dateOfBirth.slice(0, 10)}
              </div>
            ) : null}
          </div>

          {/* Industries */}
          {p.industries?.length ? (
            <div className='mt-6 flex flex-wrap gap-2'>
              {p.industries.map(ind => (
                <span
                  key={ind.slug}
                  className='px-3 py-1 rounded-full bg-gray-100 text-xs'
                >
                  {ind.name} ({ind.slug})
                </span>
              ))}
            </div>
          ) : null}

          {/* QR code */}
          <div className='mt-8 space-y-3'>
            <h2 className='text-lg font-semibold'>Share this profile</h2>
            <ProfileQR url={profileUrl} label={p.displayName || 'Profile'} />
          </div>
        </div>
      </div>
    </div>
  );
}
