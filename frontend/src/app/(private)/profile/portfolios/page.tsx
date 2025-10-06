import { headers } from 'next/headers';
import { api } from '@/lib/api';
import Link from 'next/link';

export default async function MyPortfoliosPage() {
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
          <div key={p.id} className='rounded border p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>{p.title}</div>
                <div className='text-xs text-neutral-500'>
                  slug: <code>{p.slug}</code>
                </div>
                {p.tags?.length ? (
                  <div className='mt-1 text-xs text-neutral-600'>
                    {p.tags.join(', ')}
                  </div>
                ) : null}
                <div className='mt-1 text-xs text-neutral-500'>
                  Updated {new Date(p.updatedAt).toLocaleString()}
                </div>
              </div>

              <div className='flex gap-3'>
                <Link
                  href={`/profile/portfolios/${p.id}`}
                  className='text-sm underline'
                >
                  Edit
                </Link>
                <Link
                  href={`/profile/portfolio/${p.slug}`}
                  className='text-sm underline'
                >
                  Public page
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
