'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { DigitalCard } from '@/types/digitalCard';
import PublicCardItem from './PublicCardItem';
import CardSkeleton from './CardSkeleton';
import SearchBar from '@/components/ui/SearchBar';

type PageState = {
  items: (DigitalCard & { canEdit?: boolean })[];
  nextCursor: string | null;
  q: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
};

const SKELETON_COUNT = 8;

export default function CardExploreGrid() {
  const [state, setState] = useState<PageState>({
    items: [],
    nextCursor: null,
    q: '',
    isLoading: true,
    isLoadingMore: false,
    error: null
  });

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'recent' | 'alpha'>('recent');

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
    setState(s => s); // capture latest
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

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setState(s => ({ ...s, q: query }));
      fetchInitial(query);
    }, 400);
    return () => clearTimeout(t);
  }, [query, fetchInitial]);

  // optional client-side sort
  const displayItems = useMemo(() => {
    const arr = [...state.items];
    if (sort === 'alpha') {
      arr.sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        )
      );
    }
    return arr;
  }, [state.items, sort]);

  const hasItems = displayItems.length > 0;

  return (
    <div
      className='
        relative min-h-[80vh]
        bg-[radial-gradient(1200px_500px_at_-10%_-20%,rgba(158,85,247,0.15)_0%,transparent_50%),radial-gradient(900px_400px_at_120%_120%,rgba(68,122,238,0.12)_0%,transparent_55%)]
      '
    >
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-6'>
        {/* Header row */}
        <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
          <div className='space-y-1'>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Digital Cards
            </h1>
            <p className='text-sm text-gray-600'>
              Explore public profiles. Click a card to flip for quick actions.
            </p>
          </div>

          {/* Create button */}
          <Link
            href='/profile/cards/create'
            className='inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium
                       bg-gradient-to-r from-[#9e55f7] to-[#447aee] text-white
                       shadow-sm hover:opacity-95 active:opacity-90
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500'
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              aria-hidden='true'
            >
              <path
                d='M12 5v14M5 12h14'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
              />
            </svg>
            Create Digital Name Card
          </Link>
        </div>

        {/* Controls row: Search + Sort */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <SearchBar
            value={query}
            onChange={setQuery}
            onClear={() => setQuery('')}
            onSubmit={() => fetchInitial(query)}
            isLoading={state.isLoading}
            className='w-full sm:w-[560px]'
          />

          {/* Segmented Sort (pill, with animated gradient border) */}
          <div
            className='inline-flex items-center rounded-full p-[2px]
                       bg-[linear-gradient(120deg,#9e55f7,#447aee,#13b9a3)]
                       bg-[length:300%_300%] animate-[border-pan_12s_ease-in-out_infinite]'
            role='tablist'
            aria-label='Sort results'
          >
            <div className='flex rounded-full bg-white/90 backdrop-blur shadow-sm'>
              {[
                { k: 'recent', label: 'Recent' },
                { k: 'alpha', label: 'A–Z' }
              ].map(({ k, label }) => {
                const active = sort === (k as 'recent' | 'alpha');
                return (
                  <button
                    key={k}
                    type='button'
                    role='tab'
                    aria-selected={active}
                    onClick={() => setSort(k as 'recent' | 'alpha')}
                    className={[
                      'px-4 py-1.5 text-sm font-medium rounded-full transition-all',
                      active
                        ? 'bg-gradient-to-r from-[#9e55f7] to-[#447aee] text-white shadow'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    ].join(' ')}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        {state.error ? (
          <div className='text-sm text-red-600'>{state.error}</div>
        ) : state.isLoading ? (
          <div className='grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch'>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : !hasItems ? (
          <div className='rounded-2xl border bg-white/70 backdrop-blur px-6 py-12 text-center'>
            <div className='mx-auto mb-3 h-10 w-10 rounded-full bg-gradient-to-r from-[#9e55f7] to-[#447aee]' />
            <p className='font-medium'>No published cards found</p>
            <p className='text-sm text-gray-600 mt-1'>
              Try a different search or clear filters.
            </p>
          </div>
        ) : (
          <>
            <div className='grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch'>
              {displayItems.map(card => (
                <PublicCardItem
                  key={card.id}
                  card={card}
                  onDeleteAction={async id => {
                    await api.card.deleteById(id);
                    await fetchInitial(state.q);
                  }}
                />
              ))}

              {/* Loading-more skeletons */}
              {state.isLoadingMore &&
                Array.from({ length: Math.min(4, SKELETON_COUNT) }).map(
                  (_, i) => <CardSkeleton key={`more-${i}`} />
                )}
            </div>

            {/* Load more */}
            {state.nextCursor ? (
              <div className='pt-4 flex justify-center'>
                <button
                  className='rounded-full border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60'
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
    </div>
  );
}
