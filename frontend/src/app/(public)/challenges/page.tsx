import { api } from '@/lib/api';
import ChallengeCard from '@/components/challenges/ChallengeCard';

export const dynamic = 'force-dynamic';

export default async function PublicChallengesPage() {
  const { data } = await api.challenge.listPublic({ limit: 24 });
  const items = data.items ?? [];
  return (
    <div className='max-w-6xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-semibold mb-4'>Challenges</h1>
      {items.length === 0 ? (
        <p className='text-gray-600'>No challenges yet.</p>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
          {items.map((c: any) => (
            <ChallengeCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
