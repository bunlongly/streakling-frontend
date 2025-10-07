'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { PublicProfile } from '@/types/profile';
import Link from 'next/link';

function avatarFrom(profile: PublicProfile) {
  const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || '';
  if (profile.avatarKey && PUBLIC_BASE)
    return `${PUBLIC_BASE}/${profile.avatarKey}`;
  return profile.avatarUrl ?? null;
}

export default function PublicProfilesPage() {
  const [items, setItems] = useState<PublicProfile[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerSearch = () => load(true);

  return (
    <div className='max-w-6xl mx-auto px-4 py-8 space-y-6'>
      <h1 className='text-2xl font-semibold'>People</h1>

      {/* NOT A <form> → no native POST */}
      <div className='flex gap-3'>
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
          className='w-full rounded-xl border px-3 py-2'
        />
        <button
          type='button'
          onClick={triggerSearch}
          className='px-3 py-2 rounded-xl border'
        >
          Search
        </button>
      </div>

      {err ? <div className='text-red-600'>{err}</div> : null}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {items.map(p => {
          const avatar = avatarFrom(p);
          const href = p.username
            ? `/u/${encodeURIComponent(p.username)}`
            : `/u/id/${p.id}`;
          return (
            <Link
              key={`${p.id}-${p.username ?? 'nou'}`}
              href={href}
              className='rounded-2xl border p-4 hover:bg-gray-50'
            >
              <div className='flex items-center gap-3'>
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt='avatar'
                    className='h-12 w-12 rounded-lg object-cover border'
                  />
                ) : (
                  <div className='h-12 w-12 rounded-lg bg-gray-200' />
                )}
                <div>
                  <div className='font-medium'>{p.displayName}</div>
                  <div className='text-xs text-gray-600'>
                    {p.username ? `@${p.username}` : 'No username'}
                  </div>
                </div>
              </div>
              <div className='mt-3 text-xs text-gray-600'>
                {p.industries.length
                  ? p.industries.map(i => i.name || i.slug).join(', ')
                  : '—'}
              </div>
            </Link>
          );
        })}
      </div>

      <div className='pt-4'>
        {nextCursor ? (
          <button
            onClick={() => load(false)}
            disabled={loading}
            className='px-4 py-2 rounded-xl border'
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        ) : (
          <div className='text-sm text-gray-500'>No more profiles.</div>
        )}
      </div>
    </div>
  );
}
