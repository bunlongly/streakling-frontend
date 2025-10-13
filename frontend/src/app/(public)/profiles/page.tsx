// src/app/(public)/profiles/page.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { PublicProfile } from '@/types/profile';
import MagicBorder from '@/components/ui/MagicBorder';

/* ===================== utils ===================== */
function avatarFrom(profile: PublicProfile) {
  const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || '';
  if (profile.avatarKey && PUBLIC_BASE)
    return `${PUBLIC_BASE}/${profile.avatarKey}`;
  return profile.avatarUrl ?? null;
}
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return 'Failed to load profiles';
}
function profileHref(p: PublicProfile) {
  return p.username
    ? `/profile/${encodeURIComponent(p.username)}`
    : `/profile/id/${p.id}`;
}

/* ===================== tiny UI bits ===================== */
function Badge({
  children,
  tone = 'primary'
}: {
  children: React.ReactNode;
  tone?: 'primary' | 'social' | 'work' | 'friends' | 'neutral';
}) {
  const map: Record<string, string> = {
    primary:
      'bg-[color-mix(in_srgb,theme(colors.primary)_12%,white)] text-[color-mix(in_srgb,theme(colors.primary)_70%,black)] border-[color-mix(in_srgb,theme(colors.primary)_30%,white)]',
    social:
      'bg-[rgba(68,122,238,0.12)] text-[rgb(45,105,234)] border-[rgba(68,122,238,0.3)]',
    work: 'bg-[rgba(245,158,11,0.15)] text-[rgb(217,119,6)] border-[rgba(245,158,11,0.35)]',
    friends:
      'bg-[rgba(236,72,153,0.12)] text-[rgb(219,39,119)] border-[rgba(236,72,153,0.3)]',
    neutral: 'bg-gray-50 text-gray-700 border-gray-200'
  };
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-5',
        map[tone]
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function IconBtn({
  label,
  onClick,
  children
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type='button'
      aria-label={label}
      onClick={e => {
        e.stopPropagation(); // don’t navigate the card
        onClick(e);
      }}
      className='flex items-center justify-center h-9 w-9 rounded-full border border-gray-200 bg-white/80 hover:bg-white transition'
      title={label}
    >
      {children}
    </button>
  );
}

/* minimalist SVG icons */
const XIcon = () => (
  <svg viewBox='0 0 24 24' className='h-4 w-4' fill='currentColor'>
    <path d='M18 3h3l-7.5 8.6L22 21h-6l-4.5-5.8L6 21H3l7.9-9.1L2 3h6l4 5.3L18 3z' />
  </svg>
);
const FacebookIcon = () => (
  <svg viewBox='0 0 24 24' className='h-4 w-4' fill='currentColor'>
    <path d='M13 22v-8h3l1-4h-4V7.5A1.5 1.5 0 0 1 14.5 6H17V2h-2.5A4.5 4.5 0 0 0 10 6.5V10H7v4h3v8h3z' />
  </svg>
);
const LinkedInIcon = () => (
  <svg viewBox='0 0 24 24' className='h-4 w-4' fill='currentColor'>
    <path d='M6.94 21H3.5V9h3.44v12zM5.2 7.5a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM21 21h-3.43v-6.38c0-1.52-.55-2.56-1.93-2.56-1.05 0-1.67.71-1.95 1.39-.1.24-.13.57-.13.9V21H9.13s.05-10.35 0-11.41H12.6v1.62c.46-.7 1.28-1.7 3.1-1.7 2.27 0 3.98 1.48 3.98 4.65V21z' />
  </svg>
);
const TelegramIcon = () => (
  <svg viewBox='0 0 24 24' className='h-4 w-4' fill='currentColor'>
    <path d='M9.9 17.2 9.7 21l3-2.8 6.5 4.3c.7.4 1.3.2 1.5-.7L23.9 3c.2-.9-.3-1.3-1.1-1L2.1 9.6c-.9.3-.9.8-.2 1l5.8 1.8 13.4-8.3L9.9 17.2z' />
  </svg>
);
const CopyIcon = () => (
  <svg
    viewBox='0 0 24 24'
    className='h-4 w-4'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
  >
    <rect x='9' y='9' width='13' height='13' rx='2' />
    <rect x='2' y='2' width='13' height='13' rx='2' />
  </svg>
);
function DotsIcon() {
  return (
    <svg
      viewBox='0 0 24 24'
      className='h-5 w-5 opacity-50 group-hover:opacity-80 transition'
      fill='currentColor'
    >
      <circle cx='5' cy='12' r='2' />
      <circle cx='12' cy='12' r='2' />
      <circle cx='19' cy='12' r='2' />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg
      viewBox='0 0 24 24'
      className='h-5 w-5 opacity-70'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
    >
      <circle cx='11' cy='11' r='7' />
      <path d='M20 20l-3.5-3.5' />
    </svg>
  );
}

/* ===================== card ===================== */
function ProfileCard({ p }: { p: PublicProfile }) {
  const router = useRouter();
  const href = profileHref(p);
  const go = useCallback(() => router.push(href), [router, href]);

  const avatar = avatarFrom(p);
  const industries = useMemo(
    () =>
      p.industries.length
        ? p.industries.map(i => i.name || i.slug).filter(Boolean)
        : [],
    [p.industries]
  );

  // tone by first industry
  const first = (industries[0] || '').toLowerCase();
  const tone: 'primary' | 'social' | 'work' | 'friends' | 'neutral' =
    first.includes('tech') || first.includes('primary')
      ? 'primary'
      : first.includes('social') || first.includes('media')
      ? 'social'
      : first.includes('work') || first.includes('business')
      ? 'work'
      : first.includes('friend') || first.includes('community')
      ? 'friends'
      : 'neutral';

  // share helpers
  const shareUrl =
    typeof window !== 'undefined'
      ? new URL(href, window.location.origin).toString()
      : href;
  const shareText = p.username ? `@${p.username}` : p.displayName;
  const shareTitle = `${p.displayName} on Streakling`;

  const openShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  const shareX = () =>
    openShare(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        shareUrl
      )}&text=${encodeURIComponent(shareTitle + ' — ' + shareText)}`
    );
  const shareFacebook = () =>
    openShare(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`
    );
  const shareLinkedIn = () =>
    openShare(
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
        shareUrl
      )}&title=${encodeURIComponent(shareTitle)}`
    );
  const shareTelegram = () =>
    openShare(
      `https://t.me/share/url?url=${encodeURIComponent(
        shareUrl
      )}&text=${encodeURIComponent(shareTitle)}`
    );

  // ✅ copy without alert → tiny “Copied” tag
  const [copied, setCopied] = useState(false);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div
      role='button'
      onClick={go}
      className='cursor-pointer select-none group h-full'
    >
      <MagicBorder className='h-full' radius='rounded-2xl'>
        <div className='relative p-4'>
          {/* top-right menu (decor) */}
          <button
            type='button'
            className='absolute right-3 top-3 group'
            aria-label='More'
            onClick={e => e.stopPropagation()}
          >
            <DotsIcon />
          </button>

          {/* avatar */}
          <div className='flex items-center justify-center pt-2'>
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={`${p.displayName} avatar`}
                className='h-16 w-16 rounded-full object-cover border'
              />
            ) : (
              <div className='h-16 w-16 rounded-full bg-gray-100 border' />
            )}
          </div>

          {/* name */}
          <div className='mt-3 text-center'>
            <div className='inline-flex items-center gap-1'>
              <span className='font-medium'>{p.displayName}</span>
              {p.username ? (
                <span
                  className='inline-block h-2.5 w-2.5 rounded-full bg-[--color-secondary] opacity-80'
                  title='verified'
                />
              ) : null}
            </div>
            <div className='text-xs text-gray-500'>
              {p.username ? `@${p.username}` : p.country || '—'}
            </div>
          </div>

          {/* industries + country */}
          <div className='mt-3 flex items-center justify-center gap-2 flex-wrap'>
            {industries.length ? (
              <>
                <Badge tone={tone}>{industries[0]}</Badge>
                {industries[1] ? (
                  <Badge tone='neutral'>{industries[1]}</Badge>
                ) : null}
                {industries[2] ? (
                  <Badge tone='neutral'>{industries[2]}</Badge>
                ) : null}
                {industries.length > 3 ? (
                  <Badge tone='neutral'>+{industries.length - 3}</Badge>
                ) : null}
              </>
            ) : (
              <Badge tone='neutral'>Creator</Badge>
            )}
            {p.country ? <Badge tone='neutral'>{p.country}</Badge> : null}
          </div>

          {/* meta */}
          <div className='mt-3 text-center text-[12px] text-gray-500'>
            Member
          </div>

          {/* SHARE row */}
          <div className='mt-4 flex items-center justify-center gap-3 relative'>
            <IconBtn label='Share on X' onClick={shareX}>
              <XIcon />
            </IconBtn>
            <IconBtn label='Share on Facebook' onClick={shareFacebook}>
              <FacebookIcon />
            </IconBtn>
            <IconBtn label='Share on LinkedIn' onClick={shareLinkedIn}>
              <LinkedInIcon />
            </IconBtn>
            <IconBtn label='Share on Telegram' onClick={shareTelegram}>
              <TelegramIcon />
            </IconBtn>
            <div className='relative'>
              <IconBtn label='Copy link' onClick={copyLink}>
                <CopyIcon />
              </IconBtn>
              {copied ? (
                <span className='absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shadow'>
                  Copied
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </MagicBorder>
    </div>
  );
}

/* ===================== skeleton ===================== */
function SkeletonCard() {
  return (
    <MagicBorder className='h-full' radius='rounded-2xl'>
      <div className='p-4'>
        <div className='flex items-center justify-center pt-2'>
          <div className='h-16 w-16 rounded-full bg-gray-200 animate-pulse' />
        </div>
        <div className='mt-3 space-y-2'>
          <div className='h-4 w-40 mx-auto bg-gray-200 rounded animate-pulse' />
          <div className='h-3 w-24 mx-auto bg-gray-200 rounded animate-pulse' />
        </div>
        <div className='mt-4 flex items-center justify-center gap-2'>
          <div className='h-6 w-16 bg-gray-200 rounded-full animate-pulse' />
          <div className='h-6 w-20 bg-gray-200 rounded-full animate-pulse' />
        </div>
        <div className='mt-4 flex items-center justify-center gap-3'>
          <div className='h-9 w-9 bg-gray-200 rounded-full animate-pulse' />
          <div className='h-9 w-9 bg-gray-200 rounded-full animate-pulse' />
          <div className='h-9 w-9 bg-gray-200 rounded-full animate-pulse' />
        </div>
      </div>
    </MagicBorder>
  );
}

/* ===================== page ===================== */
export default function PublicProfilesPage() {
  const [items, setItems] = useState<PublicProfile[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  async function load(reset = false) {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.profile.listPublic({
        q: q || undefined,
        limit: 24,
        cursor: reset ? undefined : nextCursor || undefined
      });
      setItems(prev => (reset ? res.data.items : [...prev, ...res.data.items]));
      setNextCursor(res.data.nextCursor);
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerSearch = () => load(true);

  // helper to show "X results" nicely
  const resultsLabel = items.length
    ? `${items.length}${nextCursor ? '+' : ''} result${
        items.length > 1 ? 's' : ''
      }${q ? ` for “${q}”` : ''}`
    : q && initialLoaded
    ? `No results for “${q}”`
    : '';

  return (
    <div className='max-w-6xl mx-auto px-4 py-8 space-y-6'>
      {/* header */}
      <div className='flex items-center justify-between gap-4'>
        <h1 className='text-2xl font-semibold'>People</h1>
        <div className='text-xs text-gray-500'>{resultsLabel}</div>
      </div>

      {/* search – soft ring, no dark border */}
      <MagicBorder radius='rounded-2xl'>
        <div className='p-2 md:p-3'>
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-2 flex-1 rounded-xl bg-white px-3 py-2 ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-[--color-primary]'>
              <SearchIcon />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    triggerSearch();
                  }
                }}
                placeholder='Search by username, name or country…'
                className='w-full outline-none'
              />
              {q ? (
                <button
                  type='button'
                  onClick={() => {
                    setQ('');
                    setTimeout(() => load(true), 0);
                  }}
                  className='text-xs text-gray-600 hover:text-gray-900'
                >
                  Clear
                </button>
              ) : null}
            </div>
            <button
              type='button'
              onClick={triggerSearch}
              disabled={loading}
              className={[
                'px-4 py-2 text-sm rounded-xl border border-transparent disabled:opacity-60',
                'bg-[linear-gradient(120deg,#9e55f7_0%,#447aee_50%,#13b9a3_100%)] text-white',
                'shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]'
              ].join(' ')}
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </div>
      </MagicBorder>

      {err ? <div className='text-red-600'>{err}</div> : null}

      {/* grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {items.map(p => (
          <ProfileCard key={`${p.id}-${p.username ?? 'nou'}`} p={p} />
        ))}
        {!initialLoaded &&
          Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={`sk-${i}`} />
          ))}
      </div>

      {/* empty state */}
      {initialLoaded && !items.length && !loading && !err ? (
        <div className='flex flex-col items-center justify-center gap-2 text-center py-10'>
          <div className='text-lg font-medium'>No results</div>
          <div className='text-sm text-gray-500'>
            Try a different name, username, or country.
          </div>
        </div>
      ) : null}

      {/* load more */}
      <div className='pt-2'>
        {nextCursor ? (
          <button
            onClick={() => load(false)}
            disabled={loading}
            className='px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-60'
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        ) : initialLoaded && items.length ? (
          <div className='text-sm text-gray-500'>You’ve reached the end.</div>
        ) : null}
      </div>
    </div>
  );
}
