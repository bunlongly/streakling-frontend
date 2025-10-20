// src/app/profile/challenges/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import { api } from '@/lib/api';
import type { Challenge } from '@/types/challenge';
import Link from 'next/link';
import { useFlash } from '@/components/ui/useFlash';

/* ===== UI tokens (same vibe as portfolio/digital card) ===== */
const cardCls =
  'rounded-2xl border border-token bg-surface/60 backdrop-blur-sm p-4 md:p-5 ' +
  'shadow-[0_1px_2px_rgba(10,10,15,0.06),_0_12px_24px_rgba(10,10,15,0.06)]';

const btnBase =
  'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition';
const btnPrimary =
  btnBase +
  ' text-white bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] ' +
  'hover:brightness-110 active:brightness-95 shadow-[0_8px_24px_rgba(77,56,209,0.35)] disabled:opacity-60';
const btnOutline =
  btnBase +
  ' border border-token bg-white/70 hover:bg-white text-[var(--color-dark)]';

function publishChip(s: Challenge['publishStatus']) {
  const base =
    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold';
  switch (s) {
    case 'PUBLISHED':
      return base + ' text-white bg-green-600/90';
    case 'PRIVATE':
      return base + ' text-white bg-gray-600/90';
    case 'DRAFT':
    default:
      return base + ' text-white bg-amber-600/90';
  }
}

function lifeChip(s: Challenge['status'] | undefined) {
  const base =
    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold';
  switch (s) {
    case 'OPEN':
      return base + ' text-white bg-blue-600/90';
    case 'CLOSED':
      return base + ' text-white bg-slate-600/90';
    case 'ARCHIVED':
      return base + ' text-white bg-neutral-600/90';
    default:
      return base + ' text-white bg-slate-500/90';
  }
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  try {
    return d.slice(0, 10);
  } catch {
    return '—';
  }
}

const S3_PUBLIC = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE ?? '';
const urlFor = (key?: string | null) =>
  key && S3_PUBLIC ? `${S3_PUBLIC}/${key}` : null;

function pickThumb(c: Challenge): string | null {
  // Prefer first gallery image with url, then key, then brand logo
  const first = Array.isArray((c as any).images)
    ? (c as any).images[0]
    : (null as any);
  if (first?.url) return first.url as string;
  if (first?.key) return urlFor(first.key);
  if ((c as any).brandLogoKey) return urlFor((c as any).brandLogoKey);
  return null;
}

function SkeletonRow() {
  return (
    <li className={`${cardCls} animate-pulse`}>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3 min-w-0'>
          <div className='size-16 rounded-xl bg-black/10' />
          <div className='space-y-2'>
            <div className='h-3 w-48 rounded bg-black/10' />
            <div className='h-3 w-28 rounded bg-black/10' />
          </div>
        </div>
        <div className='h-8 w-44 rounded bg-black/10' />
      </div>
    </li>
  );
}

export default function MyChallengesPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const synced = useBackendSessionSync(); // sets backend session cookie
  const [items, setItems] = useState<Challenge[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { show, node: flash } = useFlash();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !synced) return;
    (async () => {
      try {
        const res = await api.challenge.listMine({
          headers: { 'cache-control': 'no-cache' }
        });
        setItems(res.data ?? []);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'Failed to load challenges';
        setErr(msg);
        show({ kind: 'error', title: 'Load failed', message: msg });
        setItems([]); // prevent perpetual loading state
      }
    })();
  }, [isLoaded, isSignedIn, synced, show]);

  const countLabel = useMemo(() => {
    if (!items) return '—';
    const n = items.length;
    return `${n} challenge${n === 1 ? '' : 's'}`;
  }, [items]);

  if (!isLoaded || !synced) {
    return (
      <main className='min-h-dvh bg-brand-mix'>
        <section className='max-w-6xl mx-auto px-4 md:px-6 py-10'>
          <div className={cardCls}>Loading…</div>
        </section>
      </main>
    );
  }
  if (!isSignedIn) {
    return (
      <main className='min-h-dvh bg-brand-mix'>
        <section className='max-w-6xl mx-auto px-4 md:px-6 py-10'>
          <div className={cardCls}>Please sign in.</div>
        </section>
      </main>
    );
  }

  return (
    <main className='min-h-dvh bg-brand-mix'>
      {flash}
      <section className='max-w-6xl mx-auto px-4 md:px-6 py-10'>
        {/* Header */}
        <div className='flex items-center justify-between gap-3'>
          <div>
            <h1 className='h1'>My Challenges</h1>
            <p className='muted text-sm'>{countLabel}</p>
          </div>
          <Link href='/profile/challenges/create' className={btnPrimary}>
            + New Challenge
          </Link>
        </div>

        {/* Body */}
        {!items ? (
          <ul className='mt-6 grid gap-3'>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </ul>
        ) : items.length === 0 ? (
          <div className='mt-10 rounded-3xl border border-token bg-white/70 p-10 text-center shadow-[0_1px_2px_rgba(10,10,15,0.06),_0_12px_24px_rgba(10,10,15,0.06)]'>
            <div className='mx-auto mb-4 size-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)]/70' />
            <h2 className='text-xl font-semibold'>No challenges yet</h2>
            <p className='muted mt-1'>
              Create your first challenge and start collecting submissions.
            </p>
            <div className='mt-5'>
              <Link href='/profile/challenges/create' className={btnPrimary}>
                Create challenge
              </Link>
            </div>
          </div>
        ) : (
          <ul className='mt-6 grid gap-4'>
            {items.map(c => {
              const published = c.publishStatus === 'PUBLISHED';
              const publicHref = `/challenges/${encodeURIComponent(c.slug)}`;
              const dateStr = formatDate(c.postedOn ?? c.createdAt);
              const thumb = pickThumb(c);

              return (
                <li key={c.id} className={cardCls}>
                  <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                    {/* Left: thumbnail + title/meta */}
                    <div className='flex items-center gap-4 min-w-0'>
                      <div className='size-16 rounded-xl overflow-hidden bg-white/60 border border-token shrink-0'>
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt=''
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          <div className='h-full w-full grid place-items-center text-xs opacity-60'>
                            No img
                          </div>
                        )}
                      </div>

                      <div className='min-w-0'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <div className='font-semibold truncate'>
                            {c.title}
                          </div>
                          <span className={publishChip(c.publishStatus)}>
                            {c.publishStatus}
                          </span>
                          <span className={lifeChip(c.status)}>
                            {c.status ?? '—'}
                          </span>
                        </div>
                        <div className='text-sm opacity-80 truncate mt-0.5'>
                          {c.brandName ?? '—'} • {dateStr}
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className='flex items-center gap-2 md:shrink-0'>
                      <Link
                        className={btnOutline}
                        href={`/profile/challenges/${c.id}`}
                      >
                        Edit
                      </Link>

                      <Link
                        className={
                          btnOutline +
                          ' ' +
                          (published
                            ? 'hover:brightness-110'
                            : 'opacity-50 cursor-not-allowed')
                        }
                        href={published ? publicHref : '#'}
                        aria-disabled={!published}
                        onClick={e => {
                          if (!published) e.preventDefault();
                        }}
                        title={
                          published
                            ? 'Open public page'
                            : 'Publish first to enable View'
                        }
                      >
                        View Public
                      </Link>

                      <Link
                        className={btnOutline}
                        href={`/profile/challenges/${c.id}/submissions`}
                      >
                        Submissions
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* inline error fallback (toast also shown) */}
        {err && (
          <div className='mt-6 rounded-2xl border border-token bg-white/70 p-4 text-red-700'>
            {err}
          </div>
        )}
      </section>
    </main>
  );
}
