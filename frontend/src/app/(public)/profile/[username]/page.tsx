// src/app/(public)/profile/[username]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { PublicProfile } from '@/types/profile';
import ProfileQR from '@/components/profile/ProfileQR';
import FlipCard from '@/components/ui/FlipCard';
import MagicBorder from '@/components/ui/MagicBorder';

function previewFromAnywhere(key?: string | null, url?: string | null) {
  const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || '';
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';
  if (key) {
    if (PUBLIC_BASE) return `${PUBLIC_BASE}/${key}`;
    if (API_BASE)
      return `${API_BASE}/api/uploads/view/${encodeURIComponent(key)}`;
  }
  return url ?? null;
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || '';

type Props = { params: Promise<{ username: string }> }; // ✅ params is a Promise in Next 15

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params; // ✅ await the params

  const res = await api.profile
    .publicGetByUsername(username, { cache: 'no-store' })
    .catch(() => null);
  if (!res) notFound();

  const p: PublicProfile = res.data;
  const bannerSrc = previewFromAnywhere(p.bannerKey, null);
  const avatarSrc = previewFromAnywhere(p.avatarKey, p.avatarUrl ?? null);

  const profileUrl = SITE
    ? `${SITE}/profile/${encodeURIComponent(username)}`
    : `/profile/${encodeURIComponent(username)}`;

  const primaryIndustry = p.industries?.[0]?.name ?? 'Member';
  const portfolioHref = `/profile/${encodeURIComponent(username)}/portfolio`;
  const fallbackLetter = (p.displayName || p.username || 'C')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className='mx-auto px-4 py-8 max-w-[480px]'>
      <FlipCard
        className='mx-auto w-full max-w-[380px] h-[600px]'
        front={
          <MagicBorder radius='rounded-[22px]' className='h-full'>
            <div className='h-full rounded-[20px] overflow-hidden bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]'>
              {/* Banner */}
              <div className='relative h-[34%]'>
                {bannerSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bannerSrc}
                    alt='banner'
                    className='absolute inset-0 h-full w-full object-cover'
                  />
                ) : (
                  <div className='absolute inset-0 bg-[#ec7b57]' />
                )}
                <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.28)_0%,rgba(0,0,0,0.14)_46%,rgba(0,0,0,0)_100%)]' />
                <div className='absolute inset-y-0 right-0 w-16 opacity-20 pointer-events-none'>
                  <div className='h-full bg-[radial-gradient(circle_at_100%_50%,transparent_32%,rgba(255,255,255,0.65)_33%)]' />
                </div>

                <div className='relative z-10 px-4 pt-3 text-white'>
                  <div className='text-xs font-medium'>Creators</div>
                </div>

                <div className='relative z-10 ml-4 mt-3 h-16 w-16 rounded-full border-4 border-white overflow-hidden shadow bg-white/40'>
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarSrc}
                      alt='avatar'
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <div className='h-full w-full grid place-items-center bg-purple-600 text-white text-lg font-semibold'>
                      {fallbackLetter}
                    </div>
                  )}
                </div>

                <div className='relative z-10 px-4 mt-2 text-white'>
                  <div className='text-[20px] font-semibold leading-tight'>
                    {p.displayName}
                  </div>
                  <div className='text-[13px] opacity-95'>
                    {primaryIndustry}
                    {p.username ? (
                      <span> · @{p.username}</span>
                    ) : p.country ? (
                      <span> · {p.country}</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* QR */}
              <div className='h-[66%] px-4 py-5'>
                <div className='mx-auto w-full max-w-[260px]'>
                  <ProfileQR
                    url={profileUrl}
                    label={p.displayName || 'Profile'}
                    size={240}
                    showActions={false}
                    showLabel={false}
                    className='shadow-none p-0 bg-transparent'
                  />
                </div>
                <div className='mt-2 text-center text-[10px] text-gray-600 tracking-wider'>
                  {p.id}
                </div>
              </div>
            </div>
          </MagicBorder>
        }
        back={
          <MagicBorder radius='rounded-[22px]' className='h-full'>
            <div className='h-full rounded-[20px] overflow-hidden bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]'>
              {/* Tiny banner */}
              <div className='relative h-[12%]'>
                {bannerSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bannerSrc}
                    alt='banner'
                    className='absolute inset-0 h-full w-full object-cover'
                  />
                ) : (
                  <div className='absolute inset-0 bg-[#ec7b57]' />
                )}
                <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.28)_0%,rgba(0,0,0,0.18)_100%)]' />
                <div className='relative z-10 h-full flex items-center px-4'>
                  <div className='text-xs font-medium text-white'>Creators</div>
                </div>
              </div>

              {/* Details (no borders) */}
              <div className='px-4 pt-4 pb-6'>
                <div className='text-sm text-gray-500 mb-2'>Public details</div>

                <div className='divide-y divide-gray-100 rounded-xl bg-white'>
                  {p.showEmail && p.email ? (
                    <Row label='Email' value={p.email} />
                  ) : null}
                  {p.showPhone && p.phone ? (
                    <Row label='Phone' value={p.phone} />
                  ) : null}
                  {p.showCountry && p.country ? (
                    <Row label='Country' value={p.country} />
                  ) : null}
                  {p.showReligion && p.religion ? (
                    <Row label='Religion' value={p.religion} />
                  ) : null}
                  {p.showDateOfBirth && p.dateOfBirth ? (
                    <Row label='DOB' value={p.dateOfBirth.slice(0, 10)} />
                  ) : null}
                </div>

                {p.industries?.length ? (
                  <div className='mt-3'>
                    <div className='text-gray-600 text-sm mb-1'>Industries</div>
                    <div className='flex flex-wrap gap-2'>
                      {p.industries.map(ind => (
                        <span
                          key={ind.slug}
                          className='px-2.5 py-1 rounded-full border text-xs bg-white'
                        >
                          {ind.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* CTAs */}
                <div className='mt-4 flex flex-wrap gap-2'>
                  <Link
                    href={portfolioHref}
                    className='px-3 py-1.5 text-sm rounded-full border bg-white hover:bg-gray-50'
                    data-stopflip='true'
                  >
                    View portfolio
                  </Link>
                  <Link
                    href={`/profile/${encodeURIComponent(p.username || '')}`}
                    className='px-3 py-1.5 text-sm rounded-full border bg-white hover:bg-gray-50'
                    data-stopflip='true'
                  >
                    View digital card
                  </Link>
                  <a
                    href={profileUrl}
                    className='px-3 py-1.5 text-sm rounded-full border bg-white hover:bg-gray-50'
                    data-stopflip='true'
                  >
                    Copy link
                  </a>
                  <a
                    href='#download-qr'
                    className='px-3 py-1.5 text-sm rounded-full border bg-white hover:bg-gray-50'
                    data-stopflip='true'
                  >
                    Download PNG
                  </a>
                </div>

                <div className='mt-3'>
                  <button
                    type='button'
                    data-stopflip='true'
                    className='px-2.5 py-1 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200'
                  >
                    Flip to front ↺
                  </button>
                </div>
              </div>
            </div>
          </MagicBorder>
        }
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className='grid grid-cols-[96px_1fr] items-start gap-3 py-2'>
      <div className='text-gray-600 leading-6'>{label}</div>
      <div className='font-medium text-gray-900 leading-6 min-w-0 break-words break-all'>
        {value}
      </div>
    </div>
  );
}
