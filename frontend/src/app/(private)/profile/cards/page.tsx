// src/app/(private)/profile/cards/page.tsx
'use client';

import { useEffect, useState } from 'react';
import AuthGate from '@/components/AuthGate';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import { api, type DigitalCard } from '@/lib/api';
import Link from 'next/link';

type UiCard = DigitalCard;

const S3_PUBLIC = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE ?? '';

function statusChip(s: UiCard['publishStatus']) {
  const base =
    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold';
  switch (s) {
    case 'PUBLISHED':
      return base + ' text-white bg-green-600/90';
    case 'PRIVATE':
      return base + ' text-white bg-gray-600/90';
    case 'DRAFT':
    default:
      return base + ' text-white bg-amber-600/90';
  }
}

function SkeletonRow() {
  return (
    <li className='p-4 rounded-xl border border-token bg-white/50 animate-pulse'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='size-12 rounded-xl bg-black/10' />
          <div className='space-y-2'>
            <div className='h-3 w-40 rounded bg-black/10' />
            <div className='h-3 w-24 rounded bg-black/10' />
          </div>
        </div>
        <div className='h-8 w-44 rounded bg-black/10' />
      </div>
    </li>
  );
}

export default function MyCardsPage() {
  const synced = useBackendSessionSync();
  const [cards, setCards] = useState<UiCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!synced) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await api.card.listMine();
        if (!cancelled) setCards(r.data ?? []);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? 'Failed to load your cards');
          setCards([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [synced]);

  return (
    <AuthGate>
      <main className='min-h-dvh bg-brand-mix'>
        <section className='max-w-5xl mx-auto mt-16 px-4 md:px-6 py-6'>
          {/* Header */}
          <div className='flex items-center justify-between gap-3'>
            <div>
              <h1 className='h1'>My Digital Cards</h1>
              <p className='muted text-sm'>
                {cards
                  ? `${cards.length} card${cards.length === 1 ? '' : 's'}`
                  : '—'}
              </p>
            </div>
            <Link
              href='/profile/cards/create'
              className='btn bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-[0_12px_30px_rgba(77,56,209,0.35)] hover:brightness-110 active:brightness-95'
            >
              + New Card
            </Link>
          </div>

          {/* Body */}
          {!synced ? (
            <ul className='mt-6 grid gap-3'>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </ul>
          ) : error ? (
            <div className='mt-8 rounded-2xl border border-token bg-white/70 p-6'>
              <p className='text-red-600 font-medium'>{error}</p>
              <p className='muted text-sm mt-1'>
                Please refresh, or try again later.
              </p>
            </div>
          ) : cards && cards.length > 0 ? (
            <ul className='mt-6 grid gap-4'>
              {cards.map(c => {
                const avatarUrl =
                  c.avatarKey && S3_PUBLIC
                    ? `${S3_PUBLIC}/${c.avatarKey}`
                    : null;
                const isPublished = c.publishStatus === 'PUBLISHED';
                return (
                  <li
                    key={c.id}
                    className='rounded-2xl border border-token bg-surface/60 backdrop-blur-sm p-4 md:p-5 shadow-[0_1px_2px_rgba(10,10,15,0.06),_0_12px_24px_rgba(10,10,15,0.06)]'
                  >
                    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                      {/* Left: avatar + title */}
                      <div className='flex items-center gap-4 min-w-0'>
                        <div className='size-12 rounded-xl overflow-hidden bg-white/60 border border-token shrink-0'>
                          {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={avatarUrl}
                              alt={`${c.firstName} ${c.lastName}`}
                              className='h-full w-full object-cover'
                            />
                          ) : (
                            <div className='h-full w-full grid place-items-center text-xs opacity-60'>
                              No img
                            </div>
                          )}
                        </div>
                        <div className='min-w-0'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <div className='font-semibold truncate'>
                              {c.firstName} {c.lastName}
                              <span className='opacity-60'>
                                {' '}
                                — @{c.appName}
                              </span>
                            </div>
                            <span className={statusChip(c.publishStatus)}>
                              {c.publishStatus}
                            </span>
                          </div>
                          <div className='text-sm opacity-80 truncate'>
                            /{c.slug}
                          </div>
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className='flex items-center gap-2 md:shrink-0'>
                        <Link
                          className='btn-outline'
                          href={`/profile/cards/${c.id}`}
                        >
                          Edit
                        </Link>
                        <Link
                          className={
                            'btn-outline ' +
                            (isPublished
                              ? 'hover:brightness-110'
                              : 'opacity-50 cursor-not-allowed')
                          }
                          href={
                            isPublished
                              ? `/profile/digitalcard/${encodeURIComponent(
                                  c.slug
                                )}`
                              : '#'
                          }
                          aria-disabled={!isPublished}
                          onClick={e => {
                            if (!isPublished) e.preventDefault();
                          }}
                          title={
                            isPublished
                              ? 'Open public page'
                              : 'Publish first to enable View'
                          }
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            /* Empty state */
            <div className='mt-10 rounded-3xl border border-token bg-white/70 p-10 text-center shadow-[0_1px_2px_rgba(10,10,15,0.06),_0_12px_24px_rgba(10,10,15,0.06)]'>
              <div className='mx-auto mb-4 size-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)]/70' />
              <h2 className='text-xl font-semibold'>No cards yet</h2>
              <p className='muted mt-1'>
                Create your first digital card to share with the world.
              </p>
              <div className='mt-5'>
                <Link
                  href='/profile/cards/create'
                  className='btn bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white'
                >
                  Create card
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </AuthGate>
  );
}
