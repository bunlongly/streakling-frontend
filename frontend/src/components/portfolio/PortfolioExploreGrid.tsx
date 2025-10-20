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

type ListPublicParams = {
  limit: number;
  cursor?: string;
  q?: string;
};

type ApiListResponse = {
  data?: {
    items?: Portfolio[];
    nextCursor?: string | null;
  };
};

const SKELETON_COUNT = 8;

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return 'Unexpected error';
  }
}

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
  const reqIdRef = useRef(0); // ignore stale responses

  const callListPublic = useCallback(
    async (params: ListPublicParams): Promise<ApiListResponse> => {
      // api.portfolio.listPublic should accept { limit, cursor?, q? }
      return api.portfolio.listPublic(params) as unknown as ApiListResponse;
    },
    []
  );

  const fetchInitial = useCallback(
    async (q: string) => {
      const reqId = ++reqIdRef.current;
      setState(s => ({ ...s, isLoading: true, error: null }));
      seenIdsRef.current.clear();

      try {
        const params: ListPublicParams = { limit: 24, ...(q ? { q } : {}) };
        const r = await callListPublic(params);

        // ignore stale
        if (reqId !== reqIdRef.current) return;

        const rows = Array.isArray(r?.data?.items) ? r!.data!.items! : [];
        const unique = rows.filter(
          (p): p is Portfolio =>
            !!p && typeof p.id === 'string' && !seenIdsRef.current.has(p.id)
        );
        unique.forEach(p => seenIdsRef.current.add(p.id));

        setState(s => ({
          ...s,
          items: unique,
          nextCursor:
            typeof r?.data?.nextCursor === 'string'
              ? r!.data!.nextCursor!
              : null,
          isLoading: false,
          q
        }));
      } catch (e: unknown) {
        if (reqId !== reqIdRef.current) return; // ignore stale
        setState(s => ({
          ...s,
          isLoading: false,
          error: getErrorMessage(e)
        }));
      }
    },
    [callListPublic]
  );

  const loadMore = useCallback(async () => {
    if (!state.nextCursor || state.isLoadingMore) return;
    setState(s => ({ ...s, isLoadingMore: true, error: null }));
    const currentQ = state.q;

    try {
      const params: ListPublicParams = {
        limit: 24,
        cursor: state.nextCursor,
        ...(currentQ ? { q: currentQ } : {})
      };
      const r = await callListPublic(params);
      const rows = Array.isArray(r?.data?.items) ? r!.data!.items! : [];
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
          typeof r?.data?.nextCursor === 'string' ? r!.data!.nextCursor! : null,
        isLoadingMore: false
      }));
    } catch (e: unknown) {
      setState(s => ({
        ...s,
        isLoadingMore: false,
        error: getErrorMessage(e)
      }));
    }
  }, [state.nextCursor, state.isLoadingMore, state.q, callListPublic]);

  // first load
  useEffect(() => {
    fetchInitial('');
  }, [fetchInitial]);

  // debounced search while typing (smooth, no “refresh” feeling)
  useEffect(() => {
    const t = setTimeout(() => {
      // only refetch if the query actually changed vs. current state.q
      if (query !== state.q) {
        fetchInitial(query);
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]); // we purposely don't depend on state.q/fetchInitial to keep debounce stable

  // client-side sort
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
        {/* Search with explicit button (desktop) and stacked on mobile */}
        <div className='w-full sm:w-[560px] flex gap-2'>
          <SearchBar
            value={query}
            onChange={setQuery}
            onClear={() => setQuery('')}
            onSubmit={() => fetchInitial(query)}
            isLoading={state.isLoading}
            className='flex-1'
            placeholder='Search portfolios by title, role, or tag…'
          />
          <button
            type='button'
            onClick={() => fetchInitial(query)}
            className='
              hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium
              bg-gradient-to-r from-[#9e55f7] to-[#447aee] text-white
              shadow-sm hover:opacity-95 active:opacity-90
              focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500
            '
            aria-label='Search'
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              aria-hidden
            >
              <path
                d='M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
              />
            </svg>
            Search
          </button>
        </div>

        {/* Sort: select on mobile, segmented pills on ≥sm */}
        <div className='w-full sm:w-auto'>
          {/* mobile: select */}
          <div className='sm:hidden'>
            <label className='sr-only' htmlFor='sort-select'>
              Sort
            </label>
            <select
              id='sort-select'
              className='w-full rounded-full border px-4 py-2 text-sm bg-white'
              value={sort}
              onChange={e => setSort(e.target.value as 'recent' | 'alpha')}
            >
              <option value='recent'>Recent</option>
              <option value='alpha'>A–Z</option>
            </select>
          </div>

          {/* desktop: gradient segmented control */}
          <div
            className='
              hidden sm:inline-flex items-center rounded-full p-[2px]
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
                const key = k as 'recent' | 'alpha';
                const active = sort === key;
                return (
                  <button
                    key={k}
                    type='button'
                    role='tab'
                    aria-selected={active}
                    onClick={() => setSort(key)}
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
