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

function StatusBadge({ status }: { status: ChallengeSubmission['status'] }) {
  const cls =
    status === 'WINNER'
      ? 'bg-yellow-100 text-yellow-800'
      : status === 'APPROVED'
      ? 'bg-green-100 text-green-800'
      : status === 'REJECTED'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-800';
  return <span className={`px-2 py-0.5 text-xs rounded ${cls}`}>{status}</span>;
}

export default function OwnerSubmissionsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ Unwrap params Promise (future-proof for Next 15+)
  const { id } = React.use(params);
  const challengeId = id;

  const { isLoaded, isSignedIn } = useAuth();
  const synced = useBackendSessionSync(); // ensures backend session cookie

  const [data, setData] = useState<PageData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // submissionId when patching
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
    try {
      await api.challenge.updateSubmissionStatus(challengeId, id, status);
      await load(); // refresh after update
    } catch (e: any) {
      setErr(e?.message || 'Failed to update status');
    } finally {
      setBusy(null);
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

  if (!isLoaded || !synced)
    return <div className='p-6'>Preparing your session…</div>;
  if (!isSignedIn) return <div className='p-6'>Please sign in.</div>;
  if (err) return <div className='p-6 text-red-600'>{err}</div>;
  if (!data) return <div className='p-6'>Loading…</div>;

  return (
    <div className='max-w-5xl mx-auto px-4 py-8 space-y-6'>
      <div className='flex items-center justify-between gap-3'>
        <h1 className='text-2xl font-semibold'>Submissions</h1>
        <Link
          href={`/profile/challenges/${challengeId}`}
          className='text-sm underline'
        >
          ← Back to edit
        </Link>
      </div>

      <div className='flex flex-wrap gap-3 items-center'>
        <select
          className='rounded-lg border px-3 py-2 text-sm'
          value={filter}
          onChange={e => setFilter(e.target.value as any)}
        >
          <option value='ALL'>All statuses</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          className='rounded-lg border px-3 py-2 text-sm flex-1 min-w-[220px]'
          placeholder='Search by name, handle, link…'
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className='text-sm text-gray-600'>
          {filtered.length} of {data.items.length} shown
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className='text-gray-600'>No submissions yet.</p>
      ) : (
        <ul className='space-y-3'>
          {filtered.map(s => (
            <li key={s.id} className='rounded-xl border p-4 space-y-3'>
              <div className='flex items-center justify-between gap-3'>
                <div className='font-medium'>
                  #{s.submissionOrder} • {s.platform}
                </div>
                <StatusBadge status={s.status} />
              </div>

              <div className='text-sm text-gray-700 space-y-1'>
                {s.submitterName ? <div>By: {s.submitterName}</div> : null}

                {s.submitterId ? (
                  <div>
                    Profile:{' '}
                    <Link
                      href={`/profiles/${encodeURIComponent(s.submitterId)}`}
                      className='text-blue-600 underline'
                    >
                      View submitter
                    </Link>
                  </div>
                ) : null}

                {s.linkUrl ? (
                  <div>
                    Link:{' '}
                    <a
                      href={s.linkUrl}
                      className='text-blue-600 underline break-all'
                      target='_blank'
                      rel='noreferrer'
                    >
                      {s.linkUrl}
                    </a>
                  </div>
                ) : null}

                {Array.isArray(s.submitterSocials) &&
                s.submitterSocials.length ? (
                  <div className='text-xs text-gray-600'>
                    Socials:{' '}
                    {s.submitterSocials
                      .map(x => x.handle || x.url || x.label || x.platform)
                      .filter(Boolean)
                      .join(' • ')}
                  </div>
                ) : null}

                <div className='text-xs text-gray-500'>
                  Submitted at: {s.createdAt.slice(0, 19).replace('T', ' ')}
                </div>
              </div>

              <div className='flex flex-wrap items-center gap-2'>
                {ALL_STATUSES.map(st => (
                  <button
                    key={st}
                    onClick={() => changeStatus(s.id, st)}
                    disabled={busy === s.id || s.status === st}
                    className={`text-sm rounded px-3 py-1.5 border hover:bg-gray-50 disabled:opacity-50 ${
                      s.status === st ? 'bg-gray-100' : ''
                    }`}
                  >
                    Set {st}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {data.nextCursor ? (
        <div className='pt-2'>
          <button
            onClick={() => load(data.nextCursor)}
            className='px-3 py-1.5 rounded-lg border'
          >
            Load more
          </button>
        </div>
      ) : null}
    </div>
  );
}
