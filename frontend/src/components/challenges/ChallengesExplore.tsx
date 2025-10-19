// src/components/challenges/ChallengesExplore.tsx
'use client';

import * as React from 'react';
import { api } from '@/lib/api';
import ChallengePosterCard from '@/components/challenges/ChallengePosterCard';
import type { Challenge as ApiChallenge } from '@/types/challenge';

// Narrowed shape that satisfies ChallengePosterCard:
// - brandName: string | null (no undefined)
// - postedOn: string (no undefined)
type CardChallenge = Omit<ApiChallenge, 'brandName' | 'postedOn'> & {
  brandName: string | null;
  postedOn: string;
};

function normalize(c: ApiChallenge): CardChallenge {
  return {
    ...c,
    brandName: c.brandName ?? null,
    postedOn: c.postedOn ?? c.createdAt ?? ''
  };
}

export default function ChallengesExplore({
  initialItems
}: {
  initialItems: ApiChallenge[];
}) {
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState<CardChallenge[]>(
    initialItems.map(normalize)
  );
  const [loading, setLoading] = React.useState(false);

  async function runSearch(query: string) {
    setLoading(true);
    try {
      const { data } = await api.challenge.listPublic({
        limit: 24,
        q: query || undefined
      });

      const list = (data.items ?? []) as ApiChallenge[];
      setItems(list.map(normalize));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runSearch(q.trim());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      void runSearch(q.trim());
    }
  }

  return (
    <>
      {/* Search bar */}
      <form onSubmit={onSubmit} className='mb-6'>
        <div className='flex items-center gap-2'>
          <div className='flex-1'>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder='Search challenges (title, brand, etc.)'
              className='
                w-full h-11 px-4 rounded-xl border border-neutral-200 bg-white
                text-[15px] outline-none
                focus:ring-2 focus:ring-[#7b39e8] focus:border-transparent
              '
            />
          </div>
          <button
            type='submit'
            className='
              h-11 px-4 rounded-xl text-sm font-semibold text-white
              bg-[linear-gradient(120deg,#7b39e8_0%,#2d69ea_55%,#10a991_100%)]
              hover:opacity-95 active:opacity-90
              transition
            '
            disabled={loading}
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {/* Results */}
      {items.length === 0 ? (
        <p className='text-neutral-600'>
          {loading ? 'Searching…' : 'No challenges found.'}
        </p>
      ) : (
        <section className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {items.map(c => (
            <ChallengePosterCard key={c.id} c={c} />
          ))}
        </section>
      )}
    </>
  );
}
