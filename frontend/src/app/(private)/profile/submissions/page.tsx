// src/app/profile/submissions/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useFlash } from '@/components/ui/useFlash';

type Row = {
  id: string;
  challengeId: string;
  platform: string;
  linkUrl: string | null;
  imageKey: string | null;
  notes: string | null;
  submissionOrder: number;
  status: string;
  createdAt: string;
};

const S3_PUBLIC = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE ?? '';

/* ===== UI tokens (shared look) ===== */
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

const chipBase =
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold';

function statusChip(s: string) {
  const t = (s || '').toUpperCase();
  if (t === 'APPROVED') return `${chipBase} text-white bg-green-600/90`;
  if (t === 'REVIEW') return `${chipBase} text-white bg-blue-600/90`;
  if (t === 'REJECTED') return `${chipBase} text-white bg-red-600/90`;
  return `${chipBase} text-white bg-slate-600/90`;
}

/* ===== Platform icon + chip ===== */
function PlatformIcon({ platform }: { platform: string }) {
  const p = (platform || '').toLowerCase();
  // lightweight inline icons; swap for lucide or brand svgs if you prefer
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
    <li className={`${cardCls} animate-pulse`}>
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
  const { show, node: flash } = useFlash();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.challenge.listMySubmissions();
        if (!mounted) return;
        setRows(res.data ?? []);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'Failed to load submissions';
        setErr(msg);
        show({ kind: 'error', title: 'Load failed', message: msg });
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [show]);

  const countLabel = useMemo(() => {
    if (!rows) return '—';
    const n = rows.length;
    return `${n} submission${n === 1 ? '' : 's'}`;
  }, [rows]);

  return (
    <main className='min-h-dvh bg-brand-mix'>
      {flash}
      <section className='max-w-5xl mx-auto px-4 md:px-6 py-10'>
        {/* Header */}
        <div className='flex items-center justify-between gap-3'>
          <div>
            <h1 className='h1'>My Submissions</h1>
            <p className='muted text-sm'>{countLabel}</p>
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
              return (
                <li key={s.id} className={cardCls}>
                  <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                    {/* Left: thumb + meta */}
                    <div className='flex items-center gap-4 min-w-0'>
                      <div className='size-14 rounded-xl overflow-hidden bg-white/60 border border-token shrink-0 grid place-items-center'>
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt='Submission image'
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          <PlatformIcon platform={s.platform} />
                        )}
                      </div>
                      <div className='min-w-0'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <PlatformChip platform={s.platform} />
                          <span className={statusChip(s.status)}>
                            {s.status}
                          </span>
                        </div>
                        <div className='text-sm opacity-80 truncate mt-0.5'>
                          Submitted: {created} • Order #{s.submissionOrder}
                        </div>
                        {s.linkUrl ? (
                          <div className='text-sm mt-1 truncate'>
                            <span className='opacity-70'>Link:&nbsp;</span>
                            <a
                              href={s.linkUrl}
                              target='_blank'
                              rel='noreferrer'
                              className='underline break-all'
                            >
                              {s.linkUrl}
                            </a>
                          </div>
                        ) : null}
                        {s.notes ? (
                          <p className='text-sm mt-1 text-[var(--color-dark)]/80'>
                            {s.notes}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className='flex items-center gap-2 md:shrink-0'>
                      <Link
                        className={btnOutline}
                        href={`/profile/challenges/${s.challengeId}`}
                      >
                        Edit Challenge
                      </Link>
                      <Link
                        className={btnOutline}
                        href={`/challenges/${s.challengeId}`}
                      >
                        View Challenge
                      </Link>
                      {s.linkUrl && (
                        <a
                          className={btnOutline}
                          href={s.linkUrl}
                          target='_blank'
                          rel='noreferrer'
                          title='Open your submitted post'
                        >
                          Open Post
                        </a>
                      )}
                    </div>
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
