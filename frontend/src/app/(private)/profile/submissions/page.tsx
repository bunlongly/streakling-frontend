// src/app/profile/submissions/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import type { ApiSuccess } from '@/lib/api';
import { useFlash } from '@/components/ui/useFlash';

/** Local normalized row */
type Row = {
  id: string;
  challengeId: string;
  challengeSlug: string | null;
  challengeTitle: string | null;
  platform: string;
  linkUrl: string | null;
  imageKey: string | null;
  notes: string | null;
  submissionOrder: number;
  status: string;
  createdAt: string; // ISO
};

/** Shape from API (allows undefined) */
type ApiSubmission = {
  id: string;
  challengeId: string;
  platform: string;
  linkUrl?: string | null;
  imageKey?: string | null;
  notes?: string | null;
  submissionOrder: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  /** added by backend listMySubmissions */
  challengeSlug?: string | null;
  challengeTitle?: string | null;
};

/** Minimal public challenge (from /api/challenges/slug/:slug) */
type PublicChallenge = {
  id: string;
  slug: string;
  title: string;
  brandName: string | null;
  status: string; // OPEN / CLOSED / etc
  publishStatus: string; // PUBLISHED / DRAFT
  deadline: string | null; // ISO
  images?: Array<{ id: string; key: string; url: string; sortOrder: number }>;
};

const S3_PUBLIC = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE ?? '';

/* ===== UI tokens ===== */
const pageTitle =
  'text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-dark)]';
const subMuted = 'muted text-sm';

const cardCls =
  'rounded-2xl border border-token bg-surface/60 backdrop-blur-sm p-4 md:p-5 ' +
  'shadow-[0_1px_2px_rgba(10,10,15,0.06),_0_12px_24px_rgba(10,10,15,0.06)]';

const btnPrimary =
  'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white ' +
  'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] hover:brightness-110 ' +
  'active:brightness-95 shadow-[0_8px_24px_rgba(77,56,209,0.35)] disabled:opacity-60';

/** prettier “view challenge” CTA */
const btnCta =
  'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ' +
  'bg-white/70 border-token hover:bg-white transition shadow-[0_4px_14px_rgba(0,0,0,0.06)] ' +
  'ring-1 ring-transparent hover:ring-[var(--color-secondary)]/30';

const btnIcon =
  'inline-flex items-center justify-center rounded-full border border-token bg-white/70 ' +
  'hover:bg-white h-9 w-9';

const chipBase =
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold';

function statusChip(s: string) {
  const t = (s || '').toUpperCase();
  if (t === 'APPROVED') return `${chipBase} text-white bg-green-600/90`;
  if (t === 'REVIEW' || t === 'PENDING')
    return `${chipBase} text-white bg-blue-600/90`;
  if (t === 'REJECTED') return `${chipBase} text-white bg-red-600/90`;
  return `${chipBase} text-white bg-slate-600/90`;
}

function challengeStatusChip(s?: string) {
  const t = (s || '').toUpperCase();
  if (t === 'OPEN') return `${chipBase} text-white bg-emerald-600/90`;
  if (t === 'CLOSED') return `${chipBase} text-white bg-gray-500/90`;
  if (t === 'ARCHIVED') return `${chipBase} text-white bg-zinc-600/90`;
  return `${chipBase} text-white bg-slate-600/90`;
}

function smallMeta(text: string) {
  return `text-[12px] leading-5 text-[var(--color-dark)]/70 ${text}`;
}

/* ===== Platform icon + chip ===== */
function PlatformIcon({ platform }: { platform: string }) {
  const p = (platform || '').toLowerCase();
  if (p.includes('tiktok')) {
    return (
      <svg viewBox='0 0 24 24' className='size-4' aria-hidden>
        <path
          d='M13.5 3c.5 2.7 2.2 4.5 4.9 4.9v3.2c-1.8.17-3.5-.36-4.9-1.3v5.9a5.3 5.3 0 1 1-5.3-5.3c.3 0 .6 0 .9.06v3.3a2 2 0 1 0 1.8 2V3h2.6z'
          fill='currentColor'
        />
      </svg>
    );
  }
  if (p.includes('instagram') || p === 'ig') {
    return (
      <svg viewBox='0 0 24 24' className='size-4' aria-hidden>
        <path
          d='M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6-1.2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z'
          fill='currentColor'
        />
      </svg>
    );
  }
  if (p.includes('youtube') || p === 'yt') {
    return (
      <svg viewBox='0 0 24 24' className='size-4' aria-hidden>
        <path
          d='M23 7.5a3.5 3.5 0 0 0-2.5-2.4C18.5 4.5 12 4.5 12 4.5s-6.5 0-8.5.6A3.5 3.5 0 0 0 1 7.5 36.7 36.7 0 0 0 .5 12 36.7 36.7 0 0 0 1 16.5a3.5 3.5 0 0 0 2.5 2.4c2 .6 8.5.6 8.5.6s6.5 0 8.5-.6A3.5 3.5 0 0 0 23 16.5 36.7 36.7 0 0 0 23.5 12 36.7 36.7 0 0 0 23 7.5zM10 15.5v-7l6 3.5-6 3.5z'
          fill='currentColor'
        />
      </svg>
    );
  }
  if (p.includes('twitter') || p === 'x') {
    return (
      <svg viewBox='0 0 24 24' className='size-4' aria-hidden>
        <path
          d='M18 2h4l-7.5 8.6L23 22h-7l-4.6-6.8L5 22H1l8.3-9.6L1 2h7l4.2 6.2L18 2z'
          fill='currentColor'
        />
      </svg>
    );
  }
  if (p.includes('facebook') || p === 'fb') {
    return (
      <svg viewBox='0 0 24 24' className='size-4' aria-hidden>
        <path
          d='M13 22v-8h3l1-4h-4V7.5A1.5 1.5 0 0 1 14.5 6H17V2h-3.5A4.5 4.5 0 0 0 9 6.5V10H6v4h3v8h4z'
          fill='currentColor'
        />
      </svg>
    );
  }
  return (
    <span className='text-[11px] font-semibold uppercase'>
      {platform.slice(0, 2)}
    </span>
  );
}

function PlatformChip({ platform }: { platform: string }) {
  return (
    <span
      className={`${chipBase} bg-white text-[var(--color-dark)] border border-token`}
    >
      <PlatformIcon platform={platform} />
      <span className='capitalize'>{platform}</span>
    </span>
  );
}

function SkeletonRow() {
  return (
    <li className={cardCls + ' animate-pulse'}>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3 min-w-0'>
          <div className='size-14 rounded-xl bg-black/10' />
          <div className='space-y-2'>
            <div className='h-3 w-48 rounded bg-black/10' />
            <div className='h-3 w-28 rounded bg-black/10' />
          </div>
        </div>
        <div className='h-8 w-40 rounded bg-black/10' />
      </div>
    </li>
  );
}

export default function MySubmissionsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, PublicChallenge>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { show, node: flash } = useFlash();

  // Load my submissions
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.challenge.listMySubmissions();
        if (!mounted) return;

        const list = (res.data ?? []) as ApiSubmission[];
        const mapped: Row[] = list.map(s => ({
          id: s.id,
          challengeId: s.challengeId,
          challengeSlug: s.challengeSlug ?? null,
          challengeTitle: s.challengeTitle ?? null,
          platform: s.platform,
          linkUrl: s.linkUrl ?? null,
          imageKey: s.imageKey ?? null,
          notes: s.notes ?? null,
          submissionOrder: s.submissionOrder,
          status: s.status,
          createdAt: s.createdAt
        }));

        setRows(mapped);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'Failed to load submissions';
        setErr(msg);
        show({ kind: 'error', title: 'Load failed', message: msg });
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [show]);

  // After submissions load, fetch public challenge details by slug
  useEffect(() => {
    if (!rows?.length) return;

    const neededSlugs = Array.from(
      new Set(rows.map(r => r.challengeSlug).filter(Boolean) as string[])
    ).filter(sl => !details[sl]);

    if (!neededSlugs.length) return;

    let mounted = true;
    setLoadingDetails(true);
    (async () => {
      try {
        const pairs = await Promise.all(
          neededSlugs.map(async sl => {
            const res = (await api.challenge.publicGetBySlug(
              sl
            )) as ApiSuccess<PublicChallenge>;
            return [sl, res.data] as const;
          })
        );

        if (!mounted) return;

        const next: Record<string, PublicChallenge> = { ...details };
        for (const [key, data] of pairs) {
          if (data?.slug) next[data.slug] = data;
          else if (key) next[key] = data as PublicChallenge;
        }
        setDetails(next);
      } catch {
        // Soft-fail challenge details; keep UI usable
      } finally {
        if (mounted) setLoadingDetails(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [rows, details]);

  const countLabel = useMemo(() => {
    if (!rows) return '—';
    const n = rows.length;
    return `${n} submission${n === 1 ? '' : 's'}`;
  }, [rows]);

  return (
    <main className='min-h-dvh bg-brand-mix'>
      {flash}
      <section className='mx-auto max-w-5xl px-4 py-10 md:px-6'>
        {/* Header */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className={pageTitle}>Your Challenge Submissions</h1>
            <p className={subMuted}>{countLabel}</p>
          </div>
          <Link href='/challenges' className={btnPrimary}>
            Explore Challenges
          </Link>
        </div>

        {/* States */}
        {loading ? (
          <ul className='mt-6 grid gap-3'>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </ul>
        ) : err ? (
          <div className={`${cardCls} mt-6 text-red-700`}>{err}</div>
        ) : !rows || rows.length === 0 ? (
          <div className='mt-10 rounded-3xl border border-token bg-white/70 p-10 text-center shadow-[0_1px_2px_rgba(10,10,15,0.06),_0_12px_24px_rgba(10,10,15,0.06)]'>
            <div className='mx-auto mb-4 size-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)]/70' />
            <h2 className='text-xl font-semibold'>No submissions yet</h2>
            <p className='muted mt-1'>
              Join a challenge and submit your best work.
            </p>
            <div className='mt-5'>
              <Link href='/challenges' className={btnPrimary}>
                Browse challenges
              </Link>
            </div>
          </div>
        ) : (
          <ul className='mt-6 grid gap-4'>
            {rows.map(s => {
              const thumb =
                s.imageKey && S3_PUBLIC ? `${S3_PUBLIC}/${s.imageKey}` : null;
              const created = s.createdAt.slice(0, 19).replace('T', ' ');
              const challengeHref = s.challengeSlug
                ? `/challenges/${s.challengeSlug}`
                : `/challenges`;

              const challenge = s.challengeSlug
                ? details[s.challengeSlug]
                : undefined;
              const cover =
                challenge?.images?.[0]?.url ||
                (challenge?.images?.[0]?.key && S3_PUBLIC
                  ? `${S3_PUBLIC}/${challenge.images[0].key}`
                  : null);

              const deadline = challenge?.deadline
                ? new Date(challenge.deadline).toLocaleDateString()
                : null;

              return (
                <li key={s.id} className={cardCls}>
                  {/* Challenge header */}
                  <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                    <div className='flex min-w-0 items-center gap-3'>
                      <div className='relative h-16 w-24 overflow-hidden rounded-xl border border-token bg-white/70'>
                        {cover ? (
                          <Image
                            src={cover}
                            alt='Challenge cover'
                            fill
                            sizes='(max-width: 768px) 96px, 96px'
                            className='object-cover'
                          />
                        ) : (
                          <div className='grid h-full w-full place-items-center text-xs text-[var(--color-dark)]/50'>
                            No cover
                          </div>
                        )}
                      </div>

                      <div className='min-w-0'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <Link
                            href={challengeHref}
                            className='font-semibold no-underline hover:opacity-90 focus:opacity-90'
                          >
                            {s.challengeTitle || s.challengeSlug || 'Challenge'}
                          </Link>
                          {challenge?.status ? (
                            <span
                              className={challengeStatusChip(challenge.status)}
                            >
                              {challenge.status}
                            </span>
                          ) : null}
                        </div>
                        <div className={smallMeta('mt-0.5 truncate')}>
                          {challenge?.brandName
                            ? `Brand: ${challenge.brandName}`
                            : '—'}
                          {deadline ? ` • Deadline: ${deadline}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Right: polished “View Public Challenge” */}
                    <div className='flex items-center gap-2 md:shrink-0'>
                      {s.challengeSlug && (
                        <Link
                          className={btnCta}
                          href={challengeHref}
                          title='View public challenge'
                        >
                          <svg
                            viewBox='0 0 24 24'
                            className='size-4'
                            aria-hidden
                          >
                            <path
                              d='M12 5l1.41 1.41L9.83 10H20v2H9.83l3.58 3.59L12 17l-6-6 6-6z'
                              fill='currentColor'
                            />
                          </svg>
                          <span>View Public Challenge</span>
                          <svg
                            viewBox='0 0 24 24'
                            className='size-4'
                            aria-hidden
                          >
                            <path
                              d='M12 5l6 6-6 6-1.41-1.41L14.17 12 10.59 8.41 12 7z'
                              fill='currentColor'
                            />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className='my-4 h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent' />

                  {/* Submission row */}
                  <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div className='flex min-w-0 items-center gap-4'>
                      <div className='relative size-14 shrink-0 overflow-hidden rounded-xl border border-token bg-white/60'>
                        {thumb ? (
                          <Image
                            src={thumb}
                            alt='Submission image'
                            fill
                            sizes='56px'
                            className='object-cover'
                          />
                        ) : (
                          <div className='grid h-full w-full place-items-center'>
                            <PlatformIcon platform={s.platform} />
                          </div>
                        )}
                      </div>

                      <div className='min-w-0'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <PlatformChip platform={s.platform} />
                          <span className={statusChip(s.status)}>
                            {s.status}
                          </span>
                        </div>

                        <div className='mt-1 truncate text-sm opacity-80'>
                          Submitted: {created} • Order #{s.submissionOrder}
                        </div>

                        {s.notes ? (
                          <p className='mt-1 text-sm text-[var(--color-dark)]/80'>
                            {s.notes}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Right actions: icon-only external link to the post */}
                    <div className='flex items-center gap-2 md:shrink-0'>
                      {s.linkUrl && (
                        <a
                          className={btnIcon}
                          href={s.linkUrl}
                          target='_blank'
                          rel='noreferrer'
                          title='Open your submitted post'
                          aria-label='Open your submitted post'
                        >
                          <svg
                            viewBox='0 0 24 24'
                            className='size-5'
                            aria-hidden
                          >
                            <path
                              d='M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z'
                              fill='currentColor'
                            />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Subtle footer hint */}
                  <div className='mt-3 text-[12px] text-[var(--color-dark)]/60'>
                    This is your submission for the challenge above. Status
                    badges reflect moderation results.
                    {loadingDetails ? ' Loading challenge details…' : ''}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
