'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import AuthGate from '@/components/AuthGate';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import { api, type DigitalCard } from '@/lib/api';
import Link from 'next/link';

export default function MyCardsPage() {
  const synced = useBackendSessionSync();
  const [cards, setCards] = useState<DigitalCard[] | null>(null);

  useEffect(() => {
    if (!synced) return;
    api.card
      .listMine()
      .then(r => setCards(r.data))
      .catch(() => setCards([]));
  }, [synced]);

  return (
    <AuthGate>
      <main className='min-h-dvh bg-brand-mix'>
        <Header />
        <section className='max-w-4xl mx-auto mt-16 p-6 card-surface'>
          <div className='flex items-center justify-between'>
            <h1 className='h1'>My Digital Cards</h1>
            <Link href='/profile/cards/create' className='btn'>
              New Card
            </Link>
          </div>

          {!synced ? (
            <p className='mt-6 muted'>Loading…</p>
          ) : cards?.length ? (
            <ul className='mt-6 grid gap-3'>
              {cards.map(c => (
                <li key={c.id} className='p-4 rounded-md bg-surface/60'>
                  <div className='flex items-center justify-between gap-4'>
                    <div>
                      <div className='font-medium'>
                        {c.firstName} {c.lastName} — @{c.appName}
                      </div>
                      <div className='text-sm opacity-80'>
                        /{c.slug} · {c.publishStatus}
                      </div>
                    </div>
                    <div className='flex gap-2 shrink-0'>
                      <Link
                        className='btn-outline'
                        href={`/profile/cards/${c.id}`}
                      >
                        Edit
                      </Link>
                      {c.publishStatus === 'PUBLISHED' && (
                        <Link
                          className='btn-outline'
                          href={`/profile/digitalcard/${encodeURIComponent(
                            c.slug
                          )}`}
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className='mt-6 muted'>No cards yet.</p>
          )}
        </section>
      </main>
    </AuthGate>
  );
}
