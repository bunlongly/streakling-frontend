// src/components/cards/CardExploreGrid.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { DigitalCard } from '@/types/digitalCard';
import PublicCardItem from './PublicCardItem';

type PageState = {
  items: (DigitalCard & { canEdit?: boolean })[];
  nextCursor: string | null;
  q: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
};

export default function CardExploreGrid() {
  const [state, setState] = useState<PageState>({
    items: [],
    nextCursor: null,
    q: '',
    isLoading: true,
    isLoadingMore: false,
    error: null
  });

  const fetchInitial = useCallback(async (q: string) => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const r = await api.card.listPublished({ q, take: 24 });
      setState(s => ({
        ...s,
        items: r.data.items,
        nextCursor: r.data.nextCursor,
        isLoading: false
      }));
    } catch (e) {
      const err = e as Error;
      setState(s => ({
        ...s,
        isLoading: false,
        error: err.message || 'Failed to load cards'
      }));
    }
  }, []);

  const loadMore = useCallback(async () => {
    setState(s => s); // no-op to capture latest state
    if (!state.nextCursor || state.isLoadingMore) return;
    setState(s => ({ ...s, isLoadingMore: true, error: null }));
    try {
      const r = await api.card.listPublished({
        q: state.q,
        take: 24,
        cursor: state.nextCursor
      });
      setState(s => ({
        ...s,
        items: [...s.items, ...r.data.items],
        nextCursor: r.data.nextCursor,
        isLoadingMore: false
      }));
    } catch (e) {
      const err = e as Error;
      setState(s => ({
        ...s,
        isLoadingMore: false,
        error: err.message || 'Failed to load more'
      }));
    }
  }, [state.nextCursor, state.isLoadingMore, state.q]);

  useEffect(() => {
    fetchInitial('');
  }, [fetchInitial]);

  // simple debounced search
  const [query, setQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setState(s => ({ ...s, q: query }));
      fetchInitial(query);
    }, 400);
    return () => clearTimeout(t);
  }, [query, fetchInitial]);

  const onDeleteAction = useCallback(
    async (id: string) => {
      await api.card.deleteById(id);
      await fetchInitial(state.q);
    },
    [fetchInitial, state.q]
  );

  const hasItems = state.items.length > 0;

  return (
    <div className='space-y-6'>
      {/* Header + Search */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <h1 className='text-2xl font-semibold'>Digital Cards</h1>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='Search name, role, app name…'
          className='w-full md:w-96 rounded border px-3 py-2'
        />
      </div>

      {state.isLoading ? (
        <div className='text-sm text-gray-600'>Loading…</div>
      ) : state.error ? (
        <div className='text-sm text-red-600'>{state.error}</div>
      ) : !hasItems ? (
        <div className='text-sm text-gray-600'>No published cards found.</div>
      ) : (
        <>
          <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {state.items.map(card => (
              <PublicCardItem
                key={card.id}
                card={card}
                onDeleteAction={onDeleteAction}
              />
            ))}
          </div>

          {state.nextCursor ? (
            <div className='pt-4'>
              <button
                className='rounded border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60'
                disabled={state.isLoadingMore}
                onClick={loadMore}
              >
                {state.isLoadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
