'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import { api } from '@/lib/api';
import type { ChallengeSubmission } from '@/types/challenge';
import Link from 'next/link';

type PageData = {
  items: ChallengeSubmission[];
  nextCursor: string | null;
};

const ALL_STATUSES: Array<ChallengeSubmission['status']> = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'WINNER'
];

/* ---------- tiny helpers ---------- */
function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(' ');
}
const BRAND = {
  primary: 'var(--color-primary)',
  success: '#22c55e',
  warn: '#f59e0b',
  danger: '#ef4444'
};

function StatusBadge({ status }: { status: ChallengeSubmission['status'] }) {
  const tone =
    status === 'WINNER'
      ? ['bg-amber-100/70', 'text-amber-800', 'ring-amber-300/60']
      : status === 'APPROVED'
      ? ['bg-emerald-100/70', 'text-emerald-800', 'ring-emerald-300/60']
      : status === 'REJECTED'
      ? ['bg-rose-100/70', 'text-rose-700', 'ring-rose-300/60']
      : ['bg-gray-100/70', 'text-gray-800', 'ring-gray-300/60'];

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1',
        ...tone
      )}
    >
      <span
        className={cx(
          'h-1.5 w-1.5 rounded-full',
          status === 'WINNER'
            ? 'bg-amber-500'
            : status === 'APPROVED'
            ? 'bg-emerald-500'
            : status === 'REJECTED'
            ? 'bg-rose-500'
            : 'bg-gray-500'
        )}
      />
      {status.toLowerCase()}
    </span>
  );
}

function Pill({
  active,
  children,
  onClick
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'rounded-full px-3 py-1.5 text-sm transition ring-1',
        active
          ? 'bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)] ring-[color:var(--color-primary)]/30 shadow-[inset_0_0_0_1px_rgba(255,255,255,.25)]'
          : 'text-gray-700 ring-gray-200/80 hover:bg-white/60 hover:shadow-sm'
      )}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  tone,
  active,
  disabled,
  onClick,
  title
}: {
  children: React.ReactNode;
  tone: 'neutral' | 'success' | 'danger' | 'winner';
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  const map: Record<
    typeof tone,
    {
      text: string;
      ring: string;
      hover: string;
      activeBg: string;
      activeText: string;
    }
  > = {
    neutral: {
      text: 'text-gray-800',
      ring: 'ring-gray-200/80',
      hover: 'hover:bg-gray-50/80',
      activeBg: 'bg-gray-100',
      activeText: 'text-gray-900'
    },
    success: {
      text: 'text-emerald-700',
      ring: 'ring-emerald-200/70',
      hover: 'hover:bg-emerald-50/70',
      activeBg: 'bg-emerald-100',
      activeText: 'text-emerald-800'
    },
    danger: {
      text: 'text-rose-700',
      ring: 'ring-rose-200/70',
      hover: 'hover:bg-rose-50/70',
      activeBg: 'bg-rose-100',
      activeText: 'text-rose-800'
    },
    winner: {
      text: 'text-amber-700',
      ring: 'ring-amber-200/70',
      hover: 'hover:bg-amber-50/70',
      activeBg: 'bg-amber-100',
      activeText: 'text-amber-800'
    }
  } as const;

  const m = map[tone];
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'rounded-xl px-3 py-1.5 text-sm ring-1 transition',
        m.text,
        m.ring,
        m.hover,
        active && m.activeBg,
        active && m.activeText,
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

function ToolbarSkeleton() {
  return (
    <div className='sticky top-0 z-10 -mx-4 px-4 py-4 backdrop-blur-md'>
      <div className='h-10 rounded-2xl bg-white/30 shadow-sm ring-1 ring-white/50' />
    </div>
  );
}

/* =================== PAGE =================== */

export default function OwnerSubmissionsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ Promise unwrap (Next 15+)
  const { id } = React.use(params);
  const challengeId = id;

  const { isLoaded, isSignedIn } = useAuth();
  const synced = useBackendSessionSync();

  const [data, setData] = useState<PageData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | ChallengeSubmission['status']>(
    'ALL'
  );
  const [query, setQuery] = useState('');

  async function load(cursor?: string | null) {
    setErr(null);
    try {
      const res = await api.challenge.listSubmissions(challengeId, {
        limit: 100,
        cursor: cursor ?? undefined
      });
      setData(res.data);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load submissions');
    }
  }

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !synced) return;
    void load();
  }, [isLoaded, isSignedIn, synced, challengeId]);

  async function changeStatus(
    id: string,
    status: ChallengeSubmission['status']
  ) {
    setBusy(id);
    setErr(null);
    setFlash(null);
    try {
      await api.challenge.updateSubmissionStatus(challengeId, id, status);
      await load();
      setFlash({ type: 'success', msg: `Updated to ${status}.` });
    } catch (e: any) {
      const msg = e?.message || 'Failed to update status';
      setErr(msg);
      setFlash({ type: 'error', msg });
    } finally {
      setBusy(null);
      setTimeout(() => setFlash(null), 2400);
    }
  }

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    const byStatus =
      filter === 'ALL' ? items : items.filter(s => s.status === filter);
    if (!query.trim()) return byStatus;
    const q = query.toLowerCase();
    return byStatus.filter(s => {
      const hay = [
        s.submitterName || '',
        s.platform || '',
        s.linkUrl || '',
        (s.submitterSocials || [])
          .map(x => x.handle || x.url || x.label || '')
          .join(' ')
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, filter, query]);

  /* ---------- early states ---------- */

  if (!isLoaded || !synced) {
    return (
      <div className='min-h-dvh bg-brand-mix'>
        <div className='max-w-6xl mx-auto px-4'>
          <ToolbarSkeleton />
          <div className='py-10 text-gray-700'>Preparing your session…</div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <main className='min-h-dvh bg-brand-mix'>
        <div className='max-w-6xl mx-auto px-4 py-10'>
          <div className='card-surface rounded-2xl p-6'>Please sign in.</div>
        </div>
      </main>
    );
  }

  if (err && !data) {
    return (
      <main className='min-h-dvh bg-brand-mix'>
        <div className='max-w-6xl mx-auto px-4 py-10'>
          <div className='rounded-2xl p-6 ring-1 ring-rose-200/60 bg-rose-50/80 text-rose-700'>
            {err}
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <div className='min-h-dvh bg-brand-mix'>
        <div className='max-w-6xl mx-auto px-4'>
          <ToolbarSkeleton />
          <div className='py-10'>Loading…</div>
        </div>
      </div>
    );
  }

  /* ---------- UI ---------- */

  return (
    <main className='min-h-dvh bg-brand-mix'>
      <div className='max-w-6xl mx-auto px-4 pb-16'>
        {/* Sticky, glass toolbar */}
        <div className='sticky top-0 z-20 -mx-4 px-4 pt-4 backdrop-blur-md'>
          <div className='card-surface rounded-2xl shadow-sm ring-1 ring-white/40 px-4 py-4'>
            <div className='flex flex-wrap items-center gap-3'>
              <h1 className='text-2xl font-semibold tracking-tight'>
                Submissions
                <span className='ms-2 text-sm text-gray-600 font-normal'>
                  {filtered.length} of {data.items.length} shown
                </span>
              </h1>

              <div className='ms-auto flex items-center gap-2'>
                <div className='hidden md:flex items-center gap-2'>
                  <Pill
                    active={filter === 'ALL'}
                    onClick={() => setFilter('ALL')}
                  >
                    All
                  </Pill>
                  {ALL_STATUSES.map(s => (
                    <Pill
                      key={s}
                      active={filter === s}
                      onClick={() => setFilter(s)}
                    >
                      {s}
                    </Pill>
                  ))}
                </div>

                {/* search */}
                <div className='relative w-[260px] max-w-full'>
                  <input
                    className='w-full rounded-xl border border-white/40 bg-white/70 px-3 py-2.5 pr-9 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,.4)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/30'
                    placeholder='Search by name, handle, link…'
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                  <svg
                    className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                    aria-hidden
                  >
                    <path
                      fillRule='evenodd'
                      d='M12.9 14.32a7 7 0 111.414-1.414l3.387 3.386a1 1 0 01-1.414 1.415l-3.387-3.387zM14 9a5 5 0 11-10 0 5 5 0 0110 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>

                <Link
                  href={`/profile/challenges/${challengeId}`}
                  className='hidden sm:inline-block rounded-xl px-3 py-2 text-sm ring-1 ring-white/50 hover:bg-white/60'
                >
                  ← Back to edit
                </Link>
              </div>

              {/* mobile filter row */}
              <div className='md:hidden flex w-full flex-wrap gap-2 pt-2'>
                <Pill
                  active={filter === 'ALL'}
                  onClick={() => setFilter('ALL')}
                >
                  All
                </Pill>
                {ALL_STATUSES.map(s => (
                  <Pill
                    key={s}
                    active={filter === s}
                    onClick={() => setFilter(s)}
                  >
                    {s}
                  </Pill>
                ))}
              </div>

              {/* flash */}
              {flash ? (
                <div
                  className={cx(
                    'w-full rounded-xl px-3 py-2 text-sm ring-1',
                    flash.type === 'success'
                      ? 'bg-emerald-50/90 text-emerald-700 ring-emerald-200/80'
                      : 'bg-rose-50/90 text-rose-700 ring-rose-200/80'
                  )}
                >
                  {flash.msg}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* list */}
        {filtered.length === 0 ? (
          <div className='mx-auto max-w-lg text-center py-14'>
            <div className='mx-auto h-16 w-16 rounded-2xl bg-white/60 ring-1 ring-white/40 flex items-center justify-center shadow'>
              <svg
                className='h-7 w-7 text-gray-400'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
              >
                <path
                  d='M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z'
                  strokeWidth='1.5'
                />
              </svg>
            </div>
            <h2 className='mt-4 text-lg font-semibold'>No submissions found</h2>
            <p className='mt-1 text-sm text-gray-600'>
              Try a different status or search term.
            </p>
          </div>
        ) : (
          <ul className='mt-6 space-y-4'>
            {filtered.map(s => {
              const submittedAt = (() => {
                try {
                  const d = new Date(s.createdAt);
                  return isNaN(d.getTime())
                    ? s.createdAt.slice(0, 19).replace('T', ' ')
                    : d.toLocaleString();
                } catch {
                  return s.createdAt;
                }
              })();

              return (
                <li
                  key={s.id}
                  className='rounded-2xl bg-white/75 ring-1 ring-black/5 shadow-[0_2px_10px_rgba(0,0,0,.04)] hover:shadow-[0_6px_16px_rgba(0,0,0,.06)] transition'
                >
                  <div className='p-4 md:p-5'>
                    <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4'>
                      {/* left */}
                      <div className='space-y-2'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='text-sm text-gray-500'>
                            #{s.submissionOrder}
                          </span>
                          <span className='font-semibold'>{s.platform}</span>
                          <StatusBadge status={s.status} />
                        </div>

                        <div className='text-sm text-gray-800 space-y-1.5'>
                          {s.submitterName ? (
                            <div>
                              <span className='text-gray-500'>By: </span>
                              <span className='font-medium'>
                                {s.submitterName}
                              </span>
                            </div>
                          ) : null}

                          {s.submitterId ? (
                            <div>
                              <span className='text-gray-500'>Profile: </span>
                              <Link
                                href={`/profiles/${encodeURIComponent(
                                  s.submitterId
                                )}`}
                                className='underline underline-offset-2 text-[color:var(--color-primary)]'
                              >
                                View submitter
                              </Link>
                            </div>
                          ) : null}

                          {s.linkUrl ? (
                            <div className='break-all'>
                              <span className='text-gray-500'>Link: </span>
                              <a
                                href={s.linkUrl}
                                target='_blank'
                                rel='noreferrer'
                                className='underline underline-offset-2 text-[color:var(--color-primary)]'
                              >
                                {s.linkUrl}
                              </a>
                            </div>
                          ) : null}

                          {Array.isArray(s.submitterSocials) &&
                          s.submitterSocials.length ? (
                            <div className='text-xs text-gray-600'>
                              <span className='text-gray-500'>Socials:</span>{' '}
                              {s.submitterSocials
                                .map(
                                  x =>
                                    x.handle || x.url || x.label || x.platform
                                )
                                .filter(Boolean)
                                .join(' • ')}
                            </div>
                          ) : null}

                          <div className='text-xs text-gray-500'>
                            Submitted: {submittedAt}
                          </div>
                        </div>
                      </div>

                      {/* right – action cluster */}
                      <div className='flex flex-wrap items-center gap-1.5 md:gap-2'>
                        <GhostButton
                          tone='neutral'
                          active={s.status === 'PENDING'}
                          disabled={busy === s.id || s.status === 'PENDING'}
                          onClick={() => changeStatus(s.id, 'PENDING')}
                          title='Mark as pending'
                        >
                          Pending
                        </GhostButton>
                        <GhostButton
                          tone='success'
                          active={s.status === 'APPROVED'}
                          disabled={busy === s.id || s.status === 'APPROVED'}
                          onClick={() => changeStatus(s.id, 'APPROVED')}
                          title='Approve'
                        >
                          Approve
                        </GhostButton>
                        <GhostButton
                          tone='danger'
                          active={s.status === 'REJECTED'}
                          disabled={busy === s.id || s.status === 'REJECTED'}
                          onClick={() => changeStatus(s.id, 'REJECTED')}
                          title='Reject'
                        >
                          Reject
                        </GhostButton>
                        <GhostButton
                          tone='winner'
                          active={s.status === 'WINNER'}
                          disabled={busy === s.id || s.status === 'WINNER'}
                          onClick={() => changeStatus(s.id, 'WINNER')}
                          title='Set as winner'
                        >
                          Winner
                        </GhostButton>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* load more */}
        {data.nextCursor ? (
          <div className='pt-6'>
            <button
              onClick={() => load(data.nextCursor)}
              className='mx-auto block rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-white/50 bg-white/70 hover:bg-white shadow-sm'
            >
              Load more
            </button>
          </div>
        ) : null}

        {/* bottom, non-blocking error */}
        {err ? (
          <div className='mt-6 rounded-xl bg-rose-50/90 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200/80'>
            {err}
          </div>
        ) : null}
      </div>
    </main>
  );
}
