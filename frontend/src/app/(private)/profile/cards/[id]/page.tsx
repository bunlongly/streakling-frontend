'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import AuthGate from '@/components/AuthGate';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import ProfileCardForm from '@/components/forms/ProfileCardForm';
import { api, type DigitalCard } from '@/lib/api';

export default function EditCardPage({ params }: { params: { id: string } }) {
  const synced = useBackendSessionSync();
  const [initial, setInitial] = useState<Partial<DigitalCard> | null>(null);

  useEffect(() => {
    if (!synced) return;
    api.card.listMine()
      .then(r => {
        const found = r.data.find(c => c.id === params.id);
        setInitial(found ?? null);
      })
      .catch(() => setInitial(null));
  }, [synced, params.id]);

  return (
    <AuthGate>
      <main className="min-h-dvh bg-brand-mix">
        <Header />
        <section className="max-w-3xl mx-auto mt-16 p-6 card-surface">
          <h1 className="h1 mb-4">Edit Digital Card</h1>
          {!synced ? (
            <p className="muted">Preparing your session…</p>
          ) : initial === null ? (
            <p className="muted">Card not found.</p>
          ) : (
            <ProfileCardForm initial={initial} id={params.id} />
          )}
        </section>
      </main>
    </AuthGate>
  );
}
