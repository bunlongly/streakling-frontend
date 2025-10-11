// src/app/(private)/profile/portfolios/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import { api } from '@/lib/api';
import type { Portfolio } from '@/types/portfolio';
import Link from 'next/link';
import MagicBorder from '@/components/ui/MagicBorder';

/* ---------- helpers (type-safe) ---------- */

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

function toStringArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map(v => (typeof v === 'string' ? v : String(v)))
      .filter(Boolean);
  }
  if (input && typeof input === 'object') {
    return Object.values(input as Record<string, unknown>)
      .map(v => (typeof v === 'string' ? v : String(v)))
      .filter(Boolean);
  }
  return [];
}

function safeDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value));
}

function getPublishStatus(p: Portfolio): string | undefined {
  const raw = (p as unknown as { publishStatus?: unknown }).publishStatus;
  return typeof raw === 'string' ? raw : undefined;
}

const S3_PUBLIC = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || '';
function previewFromKeyOrUrl(key?: string | null, url?: string | null) {
  if (key && S3_PUBLIC) return `${S3_PUBLIC}/${key}`;
  return url ?? null;
}

function getCoverUrl(p: Portfolio): string | null {
  const main = p.mainImageKey ?? null;
  const firstSub =
    Array.isArray(p.subImages) && p.subImages.length > 0
      ? p.subImages[0]
      : undefined;
  return (
    (main && previewFromKeyOrUrl(main, null)) ||
    (firstSub?.url ??
      (firstSub?.key ? previewFromKeyOrUrl(firstSub.key, null) : null)) ||
    null
  );
}

function getRole(p: Portfolio): string | undefined {
  const about = (p as unknown as { about?: unknown }).about;
  if (!about || typeof about !== 'object') return undefined;
  const role = (about as Record<string, unknown>).role;
  return typeof role === 'string' ? role : undefined;
}

/* ---------- row skeleton (matches list layout) ---------- */

function RowSkeleton() {
  return (
    <MagicBorder radius='rounded-xl'>
      <div className='grid grid-cols-[88px_1fr_auto] gap-4 items-center px-4 py-4 rounded-xl bg-white'>
        <div className='h-16 w-22 rounded-md bg-gray-100 animate-pulse' />
        <div className='min-w-0 space-y-2'>
          <div className='h-4 w-40 rounded bg-gray-200 animate-pulse' />
          <div className='h-3 w-24 rounded bg-gray-200 animate-pulse' />
          <div className='flex gap-2 mt-1'>
            <div className='h-5 w-14 rounded-full bg-gray-200 animate-pulse' />
            <div className='h-5 w-16 rounded-full bg-gray-200 animate-pulse' />
            <div className='h-5 w-12 rounded-full bg-gray-200 animate-pulse' />
          </div>
          <div className='h-3 w-36 rounded bg-gray-200 animate-pulse' />
        </div>
        <div className='flex gap-2'>
          <div className='h-8 w-16 rounded-full bg-gray-200 animate-pulse' />
          <div className='h-8 w-24 rounded-full bg-gray-200 animate-pulse' />
        </div>
      </div>
    </MagicBorder>
  );
}

/* ---------- page ---------- */

export default function MyPortfoliosClientPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const synced = useBackendSessionSync();

  const [items, setItems] = useState<Portfolio[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }
    if (!synced) return;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await api.portfolio.listMine();
        setItems(Array.isArray(res.data) ? (res.data as Portfolio[]) : []);
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : 'Failed to load portfolios';
        setErr(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, isSignedIn, synced, router]);

  // Sort by updatedAt desc
  const display = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return [...items].sort((a, b) => {
      const ax = safeDate(a.updatedAt).getTime();
      const bx = safeDate(b.updatedAt).getTime();
      return bx - ax;
    });
  }, [items]);

  // Skeletons for pre-auth or syncing states (instead of plain text)
  if (!isLoaded || !isSignedIn || !synced) {
    return (
      <main className='min-h-[80vh] bg-[radial-gradient(1200px_500px_at_-10%_-20%,rgba(158,85,247,0.08)_0%,transparent_55%),radial-gradient(900px_400px_at_120%_120%,rgba(68,122,238,0.08)_0%,transparent_60%)]'>
        <div className='max-w-4xl mx-auto p-6 space-y-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <div className='h-6 w-44 rounded bg-gray-200 animate-pulse' />
              <div className='mt-2 h-4 w-64 rounded bg-gray-200 animate-pulse' />
            </div>
            <div className='h-10 w-40 rounded-full bg-gray-200 animate-pulse' />
          </div>

          <section className='space-y-3' aria-label='Skeleton'>
            {Array.from({ length: 5 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      className='
        min-h-[80vh]
        bg-[radial-gradient(1200px_500px_at_-10%_-20%,rgba(158,85,247,0.08)_0%,transparent_55%),radial-gradient(900px_400px_at_120%_120%,rgba(68,122,238,0.08)_0%,transparent_60%)]
      '
    >
      <div className='max-w-4xl mx-auto p-6 space-y-6'>
        {/* Header */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h1 className='text-2xl font-semibold'>My Portfolios</h1>
            <p className='text-sm text-neutral-600'>
              Manage and edit your portfolio entries.
            </p>
          </div>

          <Link
            href='/profile/portfolios/create'
            className='
              inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium
              bg-gradient-to-r from-[#9e55f7] to-[#447aee] text-white
              shadow-sm hover:opacity-95 active:opacity-90
              focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500
            '
          >
            <svg width='16' height='16' viewBox='0 0 24 24' aria-hidden='true'>
              <path
                d='M12 5v14M5 12h14'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                fill='none'
              />
            </svg>
            Create Portfolio
          </Link>
        </div>

        {/* Error state (kept concise) */}
        {err && (
          <div className='p-4 rounded-lg bg-red-50 text-red-700'>{err}</div>
        )}

        {/* Loading skeletons */}
        {loading ? (
          <section className='space-y-3' aria-label='Loading portfolios'>
            {Array.from({ length: 6 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </section>
        ) : items && items.length === 0 ? (
          // Empty state
          <div className='rounded-2xl border bg-white/80 backdrop-blur p-8 text-center'>
            <div className='mx-auto mb-3 h-10 w-10 rounded-full bg-gradient-to-r from-[#9e55f7] to-[#447aee]' />
            <p className='font-medium'>You have no portfolios yet</p>
            <p className='text-sm text-neutral-600 mt-1'>
              Create your first portfolio to showcase your work.
            </p>
            <div className='mt-4'>
              <Link
                href='/profile/portfolios/create'
                className='
                  inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium
                  bg-gradient-to-r from-[#9e55f7] to-[#447aee] text-white
                  hover:opacity-95 active:opacity-90
                '
              >
                Create Portfolio
              </Link>
            </div>
          </div>
        ) : (
          // List
          <section className='space-y-3' aria-label='Your portfolios'>
            {display.map(p => {
              const cover = getCoverUrl(p);
              const role = getRole(p);
              const publishStatus = getPublishStatus(p);
              const tags = toStringArray(p.tags as unknown as Json);

              return (
                <MagicBorder key={p.id} radius='rounded-xl'>
                  <div className='grid grid-cols-[88px_1fr_auto] gap-4 items-center px-4 py-4 rounded-xl bg-white'>
                    {/* Thumb */}
                    <div className='relative h-16 w-22 rounded-md overflow-hidden bg-neutral-100'>
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover}
                          alt={p.title || 'Cover image'}
                          className='absolute inset-0 h-full w-full object-cover'
                        />
                      ) : (
                        <div className='h-full w-full grid place-items-center text-[10px] text-neutral-400'>
                          No image
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2'>
                        <h3 className='font-medium truncate'>
                          {p.title || 'Untitled'}
                        </h3>
                        {publishStatus && (
                          <span className='text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700'>
                            {publishStatus}
                          </span>
                        )}
                      </div>

                      {role && (
                        <p className='text-xs text-neutral-600 mt-0.5 truncate'>
                          {role}
                        </p>
                      )}

                      {!!tags.length && (
                        <div className='mt-2 flex flex-wrap gap-1'>
                          {tags.slice(0, 8).map((t, i) => (
                            <span
                              key={`${t}-${i}`}
                              className='text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700'
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className='mt-1 text-xs text-neutral-500'>
                        slug: <code>{p.slug}</code>
                      </div>
                      <div className='mt-1 text-xs text-neutral-500'>
                        Updated {safeDate(p.updatedAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className='flex items-center gap-2 self-start md:self-center'>
                      <Link
                        href={`/profile/portfolios/${p.id}`}
                        className='inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium border hover:bg-neutral-50'
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/profile/portfolio/${encodeURIComponent(p.slug)}`}
                        className='inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-[#9e55f7] to-[#447aee] text-white hover:opacity-95 active:opacity-90'
                      >
                        Public page
                      </Link>
                    </div>
                  </div>
                </MagicBorder>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
