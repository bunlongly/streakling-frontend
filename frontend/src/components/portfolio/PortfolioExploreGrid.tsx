'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { Portfolio } from '@/types/portfolio';
import PortfolioExploreCard from './PortfolioExploreCard';
import PortfolioSkeleton from './PortfolioSkeleton';
import SearchBar from '@/components/ui/SearchBar';

type PageState = {
  items: Portfolio[];
  nextCursor: string | null;
  q: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
};

const SKELETON_COUNT = 8;

export default function PortfolioExploreGrid() {
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
  const seenIdsRef = useRef<Set<string>>(new Set());

  const fetchInitial = useCallback(async (q: string) => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    seenIdsRef.current.clear();
    try {
      const r = await api.portfolio.listPublic({ q, limit: 24 });
      const rows = Array.isArray(r?.data?.items)
        ? (r.data.items as Portfolio[])
        : [];
      const unique = rows.filter(
        (p): p is Portfolio =>
          !!p && typeof p.id === 'string' && !seenIdsRef.current.has(p.id)
      );
      unique.forEach(p => seenIdsRef.current.add(p.id));
      setState(s => ({
        ...s,
        items: unique,
        nextCursor:
          typeof r?.data?.nextCursor === 'string' ? r.data.nextCursor : null,
        isLoading: false
      }));
    } catch (e) {
      const err = e as Error;
      setState(s => ({
        ...s,
        isLoading: false,
        error: err.message || 'Failed to load portfolios'
      }));
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!state.nextCursor || state.isLoadingMore) return;
    setState(s => ({ ...s, isLoadingMore: true, error: null }));
    try {
      const r = await api.portfolio.listPublic({
        q: state.q,
        limit: 24,
        cursor: state.nextCursor
      });
      const rows = Array.isArray(r?.data?.items)
        ? (r.data.items as Portfolio[])
        : [];
      const unique = rows
        .filter((p): p is Portfolio => !!p && typeof p.id === 'string')
        .filter(p => {
          if (seenIdsRef.current.has(p.id)) return false;
          seenIdsRef.current.add(p.id);
          return true;
        });

      setState(s => ({
        ...s,
        items: [...s.items, ...unique],
        nextCursor:
          typeof r?.data?.nextCursor === 'string' ? r.data.nextCursor : null,
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

  // first load
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

  // optional client sort
  const displayItems = useMemo(() => {
    const arr = [...state.items];
    if (sort === 'alpha') {
      arr.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    return arr;
  }, [state.items, sort]);

  const hasItems = displayItems.length > 0;

  return (
    <div className='space-y-6'>
      {/* Controls: Search + Sort */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={() => setQuery('')}
          onSubmit={() => fetchInitial(query)}
          isLoading={state.isLoading}
          className='w-full sm:w-[560px]'
          placeholder='Search portfolios by title, role, or tag…'
        />

        <div
          className='
            inline-flex items-center rounded-full p-[2px]
            bg-[linear-gradient(120deg,#9e55f7,#447aee,#13b9a3)]
            bg-[length:300%_300%] animate-[border-pan_12s_ease-in-out_infinite]
          '
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

      {/* List header (optional) */}
      {hasItems && (
        <div className='hidden sm:grid grid-cols-[120px_1fr_auto] gap-4 px-3 sm:px-4 text-xs text-neutral-500'>
          <div>Cover</div>
          <div>Title &amp; Tags</div>
          <div className='text-right'>Actions</div>
        </div>
      )}

      {/* Content */}
      {state.error ? (
        <div className='text-sm text-red-600'>{state.error}</div>
      ) : state.isLoading ? (
        <div className='space-y-3'>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <PortfolioSkeleton key={i} />
          ))}
        </div>
      ) : !hasItems ? (
        <div className='rounded-2xl border bg-white/70 backdrop-blur px-6 py-12 text-center'>
          <div className='mx-auto mb-3 h-10 w-10 rounded-full bg-gradient-to-r from-[#9e55f7] to-[#447aee]' />
          <p className='font-medium'>No portfolios found</p>
          <p className='text-sm text-gray-600 mt-1'>Try a different search.</p>
        </div>
      ) : (
        <>
          <div className='space-y-3' role='list' aria-label='Portfolios'>
            {displayItems.map(p => (
              <PortfolioExploreCard key={p.id} portfolio={p} />
            ))}

            {/* Loading-more skeletons */}
            {state.isLoadingMore &&
              Array.from({ length: Math.min(3, SKELETON_COUNT) }).map(
                (_, i) => <PortfolioSkeleton key={`more-${i}`} />
              )}
          </div>

          {/* Load more */}
          {state.nextCursor ? (
            <div className='pt-2 flex justify-center'>
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
  );
}
