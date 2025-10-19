// src/components/PublicDigitalCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import MagicBorder from '@/components/ui/MagicBorder';
import type { DigitalCard } from '@/types/digitalCard';

const S3_PUBLIC = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE ?? '';

type Props = { card: DigitalCard };

/* ------------------------------- Icons ------------------------------- */

function Svg(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox='0 0 24 24'
      width='1em'
      height='1em'
      stroke='currentColor'
      fill='none'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      {...props}
    />
  );
}
function GitHubIcon() {
  return (
    <svg viewBox='0 0 24 24' width='1em' height='1em' aria-hidden='true'>
      <path
        fill='currentColor'
        d='M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.41-1.35-1.79-1.35-1.79-1.11-.76.08-.75.08-.75 1.22.09 1.86 1.26 1.86 1.26 1.09 1.86 2.86 1.32 3.55 1.01.11-.8.43-1.32.79-1.62-2.66-.3-5.46-1.33-5.46-5.9 0-1.3.47-2.37 1.25-3.21-.13-.3-.54-1.5.12-3.14 0 0 1.01-.32 3.3 1.23.96-.27 1.99-.4 3.01-.4 1.02 0 2.05.13 3.01.4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.64.25 2.84.12 3.14.78.84 1.25 1.9 1.25 3.21 0 4.58-2.8 5.6-5.47 5.89.44.38.83 1.12.83 2.26v3.35c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z'
      />
    </svg>
  );
}
function TwitterIcon() {
  return (
    <Svg>
      <path d='M22 5.8c-.7.3-1.4.5-2.2.6.8-.5 1.3-1.2 1.6-2-.7.4-1.6.8-2.5 1a3.9 3.9 0 0 0-6.7 3.5A11.1 11.1 0 0 1 3 4.7a3.9 3.9 0 0 0 1.2 5.2c-.6 0-1.2-.2-1.7-.5 0 1.9 1.3 3.6 3.2 4-.5.1-1 .2-1.6.1.5 1.6 2 2.8 3.8 2.8A7.8 7.8 0 0 1 2 18.6a11 11 0 0 0 6 1.8c7.2 0 11.2-6 11.2-11.2v-.5c.8-.5 1.4-1.2 1.8-2Z' />
    </Svg>
  );
}
function InstagramIcon() {
  return (
    <Svg>
      <rect x='3' y='3' width='18' height='18' rx='5' />
      <path d='M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z' />
      <path d='M17.5 6.5h.01' />
    </Svg>
  );
}
function YouTubeIcon() {
  return (
    <Svg>
      <path d='M22.54 6.42a2.8 2.8 0 0 0-2-2C18.9 4 12 4 12 4s-6.9 0-8.54.42a2.8 2.8 0 0 0-2 2A29.6 29.6 0 0 0 1 12a29.6 29.6 0 0 0 .46 5.58 2.8 2.8 0 0 0 2 2C5.1 20 12 20 12 20s6.9 0 8.54-.42a2.8 2.8 0 0 0 2-2A29.6 29.6 0 0 0 23 12a29.6 29.6 0 0 0-.46-5.58Z' />
      <path d='m10 15 5-3-5-3v6Z' />
    </Svg>
  );
}
function TikTokIcon() {
  return (
    <Svg>
      <path d='M15 3v3a5 5 0 0 0 5 5' />
      <path d='M15 11.5v1.8A4.7 4.7 0 1 1 10.3 8h.7' />
    </Svg>
  );
}
function LinkedInIcon() {
  return (
    <Svg>
      <rect x='3' y='3' width='18' height='18' rx='2' />
      <path d='M8 11v6' />
      <path d='M8 7v.01' />
      <path d='M12 17v-4a3 3 0 0 1 6 0v4' />
    </Svg>
  );
}
function FacebookIcon() {
  return (
    <Svg>
      <path d='M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z' />
    </Svg>
  );
}
function GlobeIcon() {
  return (
    <Svg>
      <circle cx='12' cy='12' r='10' />
      <path d='M2 12h20' />
      <path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z' />
    </Svg>
  );
}
function platformIcon(platform?: string) {
  const p = (platform ?? '').toUpperCase();
  if (p.includes('GITHUB')) return <GitHubIcon />;
  if (p.includes('TWITTER') || p.includes('X')) return <TwitterIcon />;
  if (p.includes('INSTAGRAM')) return <InstagramIcon />;
  if (p.includes('YOUTUBE')) return <YouTubeIcon />;
  if (p.includes('TIKTOK')) return <TikTokIcon />;
  if (p.includes('LINKEDIN')) return <LinkedInIcon />;
  if (p.includes('FACEBOOK')) return <FacebookIcon />;
  if (p.includes('WEBSITE') || p.includes('SITE') || p.includes('PERSONAL'))
    return <GlobeIcon />;
  return <GlobeIcon />;
}

/* ------------------------------- Bits ------------------------------- */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className='inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700'>
      {children}
    </span>
  );
}

/** StatusChip — string based, so any backend enum works */
function StatusChip({ status }: { status?: DigitalCard['status'] }) {
  if (!status) return null;
  const v = String(status);
  const clsMap: Record<string, string> = {
    PUBLISHED: 'bg-emerald-100 text-emerald-700',
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    PRIVATE: 'bg-gray-200 text-gray-700',
    INACTIVE: 'bg-gray-200 text-gray-700',
    DRAFT: 'bg-amber-100 text-amber-700',
    ARCHIVED: 'bg-rose-100 text-rose-700'
  };
  const cls = clsMap[v] ?? 'bg-gray-100 text-gray-700';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {v}
    </span>
  );
}

function SocialPill({
  platform,
  handle,
  url
}: {
  platform?: string;
  handle?: string | null;
  url?: string | null;
}) {
  const disabled = !url;
  const label = handle || platform || 'social';
  return (
    <a
      href={url ?? '#'}
      target='_blank'
      rel='noopener noreferrer'
      aria-label={label ?? 'social link'}
      className={[
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm',
        disabled
          ? 'border border-gray-200 text-gray-400 cursor-not-allowed'
          : 'border border-gray-300 text-gray-800 hover:bg-gray-50'
      ].join(' ')}
      onClick={e => {
        if (disabled) e.preventDefault();
      }}
      title={label ?? undefined}
    >
      <span className='text-base leading-none'>{platformIcon(platform)}</span>
      <span className='uppercase text-[11px] text-gray-500'>{platform}</span>
      {handle ? <span className='truncate max-w-[180px]'>{handle}</span> : null}
    </a>
  );
}

/* ------------------------------ Main ------------------------------ */

export default function PublicDigitalCard({ card }: Props) {
  const avatarUrl =
    card.avatarKey && S3_PUBLIC ? `${S3_PUBLIC}/${card.avatarKey}` : undefined;
  const bannerUrl =
    card.bannerKey && S3_PUBLIC ? `${S3_PUBLIC}/${card.bannerKey}` : undefined;

  // Independent slugs (as users configure them)
  // If your type doesn't include profileSlug / portfolioSlug yet, they’ll be undefined
  // and we gracefully fall back to appName or digital card slug where sensible.
  const profileSlug =
    (card as any).profileSlug ?? card.slug ?? card.appName ?? null;
  const portfolioSlug =
    (card as any).portfolioSlug ?? card.appName ?? card.slug ?? null;

  const profileHref = profileSlug
    ? `/profile/${encodeURIComponent(profileSlug)}`
    : null;
  const portfolioHref = portfolioSlug
    ? `/profile/portfolio/${encodeURIComponent(portfolioSlug)}`
    : null;

  return (
    <MagicBorder radius='rounded-3xl' className='bg-transparent'>
      <div className='rounded-3xl overflow-hidden'>
        {/* Banner — flat, no overlay/shadow */}
        <div className='relative h-44 w-full md:h-56'>
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt='banner'
              fill
              priority
              sizes='(max-width: 768px) 100vw, 1024px'
              className='object-cover'
            />
          ) : (
            <div className='absolute inset-0 bg-gray-100' />
          )}
        </div>

        {/* Header */}
        <div className='px-5 md:px-6 py-4'>
          <div className='flex items-start gap-4'>
            <div className='relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-200'>
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={
                    `${card.firstName ?? ''} ${card.lastName ?? ''}`.trim() ||
                    'Avatar'
                  }
                  fill
                  sizes='80px'
                  className='object-cover'
                  priority
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center text-xl font-semibold text-gray-700'>
                  {card.firstName?.[0] ?? 'U'}
                </div>
              )}
            </div>

            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                {/* Display name */}
                <h1 className='text-xl md:text-2xl font-semibold text-gray-900 truncate'>
                  {card.firstName} {card.lastName}
                </h1>
                <StatusChip status={card.status} />
              </div>

              {/* Handle + Role */}
              {card.appName ? (
                <div className='text-sm text-gray-500 truncate'>
                  @{card.appName}
                </div>
              ) : null}
              {card.role ? (
                <div className='text-sm text-gray-700'>{card.role}</div>
              ) : null}

              {/* Chips */}
              <div className='mt-2 flex flex-wrap gap-2'>
                {card.company && card.showCompany ? (
                  <Chip>{card.company}</Chip>
                ) : null}
                {card.university && card.showUniversity ? (
                  <Chip>{card.university}</Chip>
                ) : null}
                {card.country && card.showCountry ? (
                  <Chip>{card.country}</Chip>
                ) : null}
              </div>

              {/* Actions row (neutral buttons, no purple) */}
              <div className='mt-3 flex flex-wrap gap-2'>
                {profileHref ? (
                  <Link
                    href={profileHref}
                    className='inline-flex items-center rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition'
                  >
                    Profile
                  </Link>
                ) : (
                  <span className='inline-flex items-center rounded-full bg-gray-300 px-4 py-1.5 text-sm font-medium text-white opacity-70 cursor-not-allowed'>
                    Profile
                  </span>
                )}

                {portfolioHref ? (
                  <Link
                    href={portfolioHref}
                    className='inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-50 transition'
                  >
                    Portfolio
                  </Link>
                ) : (
                  <span className='inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-400 cursor-not-allowed'>
                    Portfolio
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className='px-5 md:px-6 pb-6'>
          {card.shortBio ? (
            <p className='text-sm leading-relaxed text-gray-800 whitespace-pre-line'>
              {card.shortBio}
            </p>
          ) : null}

          {/* Contact / personal */}
          <div className='mt-4 grid gap-2 text-sm'>
            {card.phone && card.showPhone && (
              <div className='text-gray-700'>
                <span className='text-gray-500 mr-2'>Phone:</span>
                {card.phone}
              </div>
            )}
            {card.religion && card.showReligion && (
              <div className='text-gray-700'>
                <span className='text-gray-500 mr-2'>Religion:</span>
                {card.religion}
              </div>
            )}
          </div>

          {/* Socials */}
          {card.socials?.length ? (
            <div className='mt-5 flex flex-wrap gap-2'>
              {card.socials.map(s => (
                <SocialPill
                  key={s.id ?? `${s.platform}-${s.handle}-${s.url}`}
                  platform={s.platform}
                  handle={s.handle ?? undefined}
                  url={s.url ?? undefined}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </MagicBorder>
  );
}
