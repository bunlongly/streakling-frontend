// src/app/(private)/profile/portfolios/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import useBackendSessionSync from '@/lib/useBackendSessionSync';
import { api } from '@/lib/api';
import type { Portfolio } from '@/types/portfolio';
import Link from 'next/link';

export default function MyPortfoliosClientPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const synced = useBackendSessionSync();

  const [items, setItems] = useState<Portfolio[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }
    if (!synced) return;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await api.portfolio.listMine();
        setItems(res.data);
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to load portfolios');
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, isSignedIn, synced, router]);

  if (!isLoaded || !isSignedIn)
    return <div className='p-6'>Please sign in…</div>;
  if (!synced) return <div className='p-6'>Preparing your session…</div>;
  if (loading) return <div className='p-6'>Loading…</div>;
  if (err) return <div className='p-6 text-red-600'>{err}</div>;
  if (!items) return <div className='p-6'>No data</div>;

  return (
    <div className='max-w-3xl mx-auto p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>My Portfolios</h1>
        <Link href='/profile/portfolios/create' className='underline'>
          Create
        </Link>
      </div>

      <div className='mt-6 space-y-3'>
        {items.length === 0 && (
          <p className='text-sm text-neutral-500'>No portfolios yet.</p>
        )}

        {items.map(p => {
          // tags is Prisma Json on your model; normalize for display
          const tags: string[] = Array.isArray(p.tags)
            ? (p.tags as any)
            : p.tags
            ? Object.values(p.tags as any)
            : [];

          return (
            <div key={p.id} className='rounded border p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='font-medium'>{p.title}</div>
                  <div className='text-xs text-neutral-500'>
                    slug: <code>{p.slug}</code>
                  </div>
                  {tags.length ? (
                    <div className='mt-1 text-xs text-neutral-600'>
                      {tags.join(', ')}
                    </div>
                  ) : null}
                  <div className='mt-1 text-xs text-neutral-500'>
                    Updated {new Date(p.updatedAt as any).toLocaleString()}
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
          );
        })}
      </div>
    </div>
  );
}
