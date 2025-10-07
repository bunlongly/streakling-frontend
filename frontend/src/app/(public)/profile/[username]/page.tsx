// src/app/(public)/profile/[username]/page.tsx
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';

type Props = { params: { username: string } };

export default async function PublicProfilePage({ params }: Props) {
  const res = await api.profile
    .publicGetByUsername(params.username, { cache: 'no-store' })
    .catch(() => null);
  if (!res) notFound();

  const p = res.data;

  return (
    <div className='max-w-4xl mx-auto px-4 py-10'>
      <div className='rounded-2xl border overflow-hidden'>
        {p.bannerKey ? (
          // If you have a CDN mapper, replace with your image URL builder
          <div className='h-40 bg-gray-100' />
        ) : (
          <div className='h-20 bg-gray-50' />
        )}

        <div className='p-6'>
          <div className='flex items-center gap-4'>
            <div className='h-20 w-20 rounded-full bg-gray-200 border' />
            <div>
              <h1 className='text-xl font-semibold'>{p.displayName}</h1>
              {p.username ? (
                <p className='text-gray-500'>@{p.username}</p>
              ) : null}
            </div>
          </div>

          <div className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
            {p.showEmail && (p as any).email ? (
              <div>
                <span className='text-gray-500'>Email:</span> {(p as any).email}
              </div>
            ) : null}
            {p.showPhone && (p as any).phone ? (
              <div>
                <span className='text-gray-500'>Phone:</span> {(p as any).phone}
              </div>
            ) : null}
            {p.showCountry && (p as any).country ? (
              <div>
                <span className='text-gray-500'>Country:</span>{' '}
                {(p as any).country}
              </div>
            ) : null}
            {p.showReligion && (p as any).religion ? (
              <div>
                <span className='text-gray-500'>Religion:</span>{' '}
                {(p as any).religion}
              </div>
            ) : null}
            {p.showDateOfBirth && (p as any).dateOfBirth ? (
              <div>
                <span className='text-gray-500'>DOB:</span>{' '}
                {(p as any).dateOfBirth?.slice(0, 10)}
              </div>
            ) : null}
          </div>

          {p.industries?.length ? (
            <div className='mt-6 flex flex-wrap gap-2'>
              {p.industries.map(ind => (
                <span
                  key={ind.slug}
                  className='px-3 py-1 rounded-full bg-gray-100 text-xs'
                >
                  {ind.name} ({ind.slug})
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
