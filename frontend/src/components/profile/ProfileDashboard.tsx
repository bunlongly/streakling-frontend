// src/components/profile/ProfileDashboard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { PublicProfile } from '@/types/profile';

/** Optional/owner-only fields your API may return */
type OwnerMaybe = Partial<{
  email: string | null;
  phone: string | null;
  bio: string | null;
  shortBio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
}>;

type Props = { profile: PublicProfile & OwnerMaybe };

function mediaUrlFromKey(
  key?: string | null,
  fallbackUrl?: string | null
): string | null {
  if (!key && !fallbackUrl) return null;
  const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || '';
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';
  if (key) {
    if (PUBLIC_BASE) return `${PUBLIC_BASE}/${key}`;
    if (API_BASE)
      return `${API_BASE}/api/uploads/view/${encodeURIComponent(key)}`;
  }
  return fallbackUrl ?? null;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className='inline-flex items-center rounded-full border border-token bg-white px-2.5 py-1 text-[13px]'>
      {children}
    </span>
  );
}

function VisibilityBadge({ visible }: { visible: boolean }) {
  return (
    <span
      className={[
        'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
        visible
          ? 'bg-[color-mix(in_oklab,var(--color-success)_20%,transparent)] text-[var(--color-success)] border border-[color-mix(in_oklab,var(--color-success)_35%,transparent)]'
          : 'bg-gray-50 text-gray-600 border border-token'
      ].join(' ')}
      aria-label={visible ? 'Visible publicly' : 'Hidden from public'}
      title={visible ? 'Visible publicly' : 'Hidden from public'}
    >
      {visible ? 'Public' : 'Private'}
    </span>
  );
}

export default function ProfileDashboard({ profile }: Props) {
  const bannerUrl = mediaUrlFromKey(
    profile.bannerKey,
    profile.bannerUrl ?? null
  );
  const avatarUrl = mediaUrlFromKey(
    profile.avatarKey,
    profile.avatarUrl ?? null
  );

  const displayName =
    profile.displayName?.trim() || profile.username?.trim() || 'Unnamed user';

  const industries = (profile.industries || []).map(i => i.name || i.slug);

  // Public / secondary pages (adjust if your routes differ)
  const publicProfileUrl = profile.username ? `/profile/${profile.username}` : '/';
  const portfolioUrl = '/profile/portfolios';
  const namecardUrl = '/profile/cards';

  return (
    <div className='relative'>
      {/* HERO: Banner */}
      <div
        className='relative h-44 w-full overflow-hidden rounded-xl border border-token bg-surface sm:h-56 md:h-64'
        style={{
          boxShadow:
            '0 2px 10px rgba(10,10,15,0.06), 0 18px 36px rgba(10,10,15,0.08)'
        }}
      >
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt='Profile banner'
            fill
            priority
            sizes='100vw'
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className='absolute inset-0 grid place-items-center text-sm text-gray-500'>
            No banner
          </div>
        )}
      </div>

      {/* HEADER: avatar + name + CTAs */}
      <div className='-mt-10 md:-mt-12'>
        <div
          className='relative z-10 rounded-2xl border border-token bg-surface p-4 md:p-6'
          style={{
            boxShadow:
              '0 2px 10px rgba(10,10,15,0.06), 0 18px 36px rgba(10,10,15,0.08)'
          }}
        >
          <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
            {/* Avatar + identity */}
            <div className='flex items-end gap-4'>
              <div className='relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white ring-4 ring-white shadow-[0_12px_30px_rgba(10,10,15,0.22)]'>
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt='Avatar'
                    fill
                    sizes='96px'
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                ) : (
                  <div className='absolute inset-0 grid place-items-center text-xs text-gray-500'>
                    No avatar
                  </div>
                )}
              </div>
              <div className='pb-1'>
                <h1 className='text-2xl font-semibold text-foreground'>
                  {displayName}
                </h1>
                <p className='text-sm text-gray-600'>
                  {profile.username
                    ? `@${profile.username}`
                    : 'No username yet'}
                </p>

                {/* quick chips */}
                <div className='mt-2 flex flex-wrap gap-2 text-sm'>
                  {profile.country ? <Chip>{profile.country}</Chip> : null}
                  {profile.email && profile.showEmail ? (
                    <Chip>{profile.email}</Chip>
                  ) : null}
                  {profile.phone && profile.showPhone ? (
                    <Chip>{profile.phone}</Chip>
                  ) : null}
                </div>
              </div>
            </div>

            {/* CTAs (uniform outline style) */}
            <div className='flex flex-wrap gap-2'>
              {[
                {
                  href: namecardUrl,
                  label: 'View Digital Namecard',
                  iconPath:
                    'M20 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Zm-7 2h7v2h-7V8ZM4 12h8v2H4v-2Zm0 4h8v2H4v-2Z'
                },
                {
                  href: portfolioUrl,
                  label: 'View Digital Portfolio',
                  iconPath:
                    'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z'
                },
                {
                  href: publicProfileUrl,
                  label: 'View Public Profile',
                  iconPath:
                    'M12 2a10 10 0 1 0 10 10A10.012 10.012 0 0 0 12 2Zm0 16c-.325 0-2.355-2.63-2.745-6h5.49c-.39 3.37-2.42 6-2.745 6Z'
                }
              ].map(b => (
                <Link
                  key={b.label}
                  href={b.href}
                  className='inline-flex items-center gap-2 rounded-xl border border-token bg-white px-4 py-2 text-[var(--color-foreground)] shadow-sm transition hover:bg-white/85'
                >
                  <svg
                    width='18'
                    height='18'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                    aria-hidden
                  >
                    <path d={b.iconPath} />
                  </svg>
                  {b.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN: Summary + Skills */}
      <div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr]'>
        <section
          className='rounded-2xl border border-token bg-surface p-6'
          style={{
            boxShadow:
              '0 2px 10px rgba(10,10,15,0.06), 0 18px 36px rgba(10,10,15,0.08)'
          }}
        >
          <h4 className='mt-5 text-sm font-semibold text-gray-700'>
            Industries
          </h4>
          {industries.length > 0 ? (
            <div className='mt-2 flex flex-wrap gap-2'>
              {industries.map(tag => (
                <span
                  key={`skill-${tag}`}
                  className='inline-flex items-center rounded-full border border-token bg-white/90 px-2.5 py-1 text-[13px]'
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className='mt-2 text-sm text-gray-600'>No skills added yet.</p>
          )}
        </section>

        {/* DETAILS with visibility labels */}
        <section
          className='rounded-2xl border border-token bg-surface p-6'
          style={{
            boxShadow:
              '0 2px 10px rgba(10,10,15,0.06), 0 18px 36px rgba(10,10,15,0.08)'
          }}
        >
          <h3 className='text-lg font-semibold'>Details</h3>

          <div className='mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2'>
            {profile.country ? (
              <div className='flex items-center justify-between rounded-xl border border-token bg-white px-3 py-2'>
                <span className='text-gray-500'>Country</span>
                <span className='flex items-center font-medium'>
                  {profile.country}
                  <VisibilityBadge visible={!!profile.showCountry} />
                </span>
              </div>
            ) : null}

            {profile.email ? (
              <div className='flex items-center justify-between rounded-xl border border-token bg-white px-3 py-2'>
                <span className='text-gray-500'>Email</span>
                <span className='flex items-center truncate pl-2 font-medium'>
                  {profile.email}
                  <VisibilityBadge visible={!!profile.showEmail} />
                </span>
              </div>
            ) : null}

            {profile.phone ? (
              <div className='flex items-center justify-between rounded-xl border border-token bg-white px-3 py-2'>
                <span className='text-gray-500'>Phone</span>
                <span className='flex items-center font-medium'>
                  {profile.phone}
                  <VisibilityBadge visible={!!profile.showPhone} />
                </span>
              </div>
            ) : null}

            {profile.religion ? (
              <div className='flex items-center justify-between rounded-xl border border-token bg-white px-3 py-2'>
                <span className='text-gray-500'>Religion</span>
                <span className='flex items-center font-medium'>
                  {profile.religion}
                  <VisibilityBadge visible={!!profile.showReligion} />
                </span>
              </div>
            ) : null}

            {profile.dateOfBirth ? (
              <div className='flex items-center justify-between rounded-xl border border-token bg-white px-3 py-2'>
                <span className='text-gray-500'>DOB</span>
                <span className='flex items-center font-medium'>
                  {profile.dateOfBirth.slice(0, 10)}
                  <VisibilityBadge visible={!!profile.showDateOfBirth} />
                </span>
              </div>
            ) : null}
          </div>

          {/* Industries again under details, if you want them here too */}
          <div className='mt-5'>
            <div className='text-xs uppercase tracking-wide text-gray-500'>
              Industries
            </div>
            {industries.length > 0 ? (
              <div className='mt-2 flex flex-wrap gap-2'>
                {industries.map(tag => (
                  <Chip key={`ind-${tag}`}>{tag}</Chip>
                ))}
              </div>
            ) : (
              <p className='mt-1 text-sm text-gray-600'>—</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
