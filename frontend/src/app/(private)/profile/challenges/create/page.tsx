'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import ChallengeForm from '@/components/challenges/ChallengeForm';
import type { Challenge } from '@/types/challenge';

export default function CreateChallengePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const synced = useBackendSessionSync();

  if (!isLoaded || !synced) {
    return (
      <main className="min-h-dvh bg-brand-mix">
        <section className="max-w-4xl mx-auto px-4 md:px-6 py-10">
          <div className="rounded-2xl border border-token bg-white/70 p-6 shadow-[0_1px_2px_rgba(10,10,15,0.06),_0_12px_24px_rgba(10,10,15,0.06)]">
            Loading…
          </div>
        </section>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-dvh bg-brand-mix">
        <section className="max-w-4xl mx-auto px-4 md:px-6 py-10">
          <div className="rounded-2xl border border-token bg-white/70 p-6 shadow-[0_1px_2px_rgba(10,10,15,0.06),_0_12px_24px_rgba(10,10,15,0.06)]">
            Please sign in.
          </div>
        </section>
      </main>
    );
  }

  function onSaved(c: Challenge) {
    router.replace(`/profile/challenges/${c.id}`);
  }

  return (
    <main className="min-h-dvh bg-brand-mix">
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="h1">Create Challenge</h1>
            <p className="muted text-sm">Set the rules, goals, and prizes.</p>
          </div>
        </div>

        <div className="mt-6">
          <ChallengeForm mode="create" onSaved={onSaved} />
        </div>
      </section>
    </main>
  );
}
