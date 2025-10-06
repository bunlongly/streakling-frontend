'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { Portfolio } from '@/types/portfolio';
import PortfolioExploreCard from './PortfolioExploreCard';

export default function PortfolioExploreGrid() {
  const [items, setItems] = useState<Portfolio[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  async function loadMore(next?: string | null) {
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await api.portfolio.listPublic({
        limit: 24,
        cursor: next || undefined
      });

      // Be defensive about shape and content
      const incoming = Array.isArray(data?.items)
        ? (data.items as Portfolio[])
        : [];

      // Remove falsy and de-dupe by id
      const unique = incoming
        .filter((p): p is Portfolio => !!p && typeof p.id === 'string')
        .filter(p => {
          if (seenIdsRef.current.has(p.id)) return false;
          seenIdsRef.current.add(p.id);
          return true;
        });

      setItems(prev => [...prev, ...unique]);
      setCursor(typeof data?.nextCursor === 'string' ? data.nextCursor : null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMore(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = items.filter(Boolean); // extra guard

  return (
    <>
      {visible.length === 0 && !loading && (
        <p className='text-sm text-neutral-600'>No portfolios yet.</p>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {visible.map(p => (
          <PortfolioExploreCard key={p.id} portfolio={p} />
        ))}
      </div>

      <div className='mt-6 flex justify-center'>
        {cursor && (
          <button
            onClick={() => loadMore(cursor)}
            disabled={loading}
            className='rounded border px-4 py-2 text-sm'
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </>
  );
}
