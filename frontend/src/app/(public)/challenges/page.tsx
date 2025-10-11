// src/app/challenges/page.tsx
import { api } from '@/lib/api';
import ChallengesExplore from '@/components/challenges/ChallengesExplore';
import type { Challenge } from '@/types/challenge';

export const dynamic = 'force-dynamic';

export default async function PublicChallengesPage() {
  const { data } = await api.challenge.listPublic({ limit: 24 });
  const items: Challenge[] = (data.items ?? []) as Challenge[];

  return (
    <main className='max-w-6xl mx-auto px-4 py-10'>
      <header className='mb-6'>
        <p className='text-xs font-medium tracking-wide text-neutral-500'>
          DISCOVER
        </p>
        <h1 className='mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight'>
          Challenges
        </h1>
      </header>

      <ChallengesExplore initialItems={items} />
    </main>
  );
}
