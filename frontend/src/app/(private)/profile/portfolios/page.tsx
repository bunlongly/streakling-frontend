import { headers } from 'next/headers';
import { api } from '@/lib/api';
import Link from 'next/link';

export default async function MyPortfoliosPage() {
  // ✅ forward cookies so /api/portfolios (list mine) is authorized on the server
  const cookieHeader = (await headers()).get('cookie') ?? '';
  const { data: portfolios } = await api.portfolio.listMine({
    headers: { cookie: cookieHeader }
  });

  return (
    <div className='max-w-3xl mx-auto p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>My Portfolios</h1>
        <Link href='/profile/portfolios/create' className='underline'>
          Create
        </Link>
      </div>

      <div className='mt-6 space-y-3'>
        {portfolios.length === 0 && (
          <p className='text-sm text-neutral-500'>No portfolios yet.</p>
        )}
        {portfolios.map(p => (
          <Link
            key={p.id}
            href={`/profile/portfolios/${p.id}`}
            className='block rounded border p-4 hover:bg-neutral-50'
          >
            <div className='font-medium'>{p.title}</div>
            {p.tags && p.tags.length > 0 && (
              <div className='mt-1 text-xs text-neutral-600'>
                {p.tags.join(', ')}
              </div>
            )}
            <div className='mt-1 text-xs text-neutral-500'>
              Updated {new Date(p.updatedAt).toLocaleString()}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
