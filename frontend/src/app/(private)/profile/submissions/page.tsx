'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

type Row = {
  id: string;
  challengeId: string;
  platform: string;
  linkUrl: string | null;
  imageKey: string | null;
  notes: string | null;
  submissionOrder: number;
  status: string;
  createdAt: string;
};

export default function MySubmissionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.challenge.listMySubmissions();
        if (!mounted) return;
        setRows(res.data);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className='p-6 text-sm text-gray-600'>Loading…</div>;
  if (err) return <div className='p-6 text-sm text-red-600'>{err}</div>;

  if (!rows.length) {
    return (
      <div className='max-w-3xl mx-auto px-4 py-8'>
        <h1 className='text-2xl font-semibold mb-4'>My Submissions</h1>
        <p className='text-sm text-gray-600'>
          You haven’t submitted to any challenges yet.
        </p>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-semibold mb-4'>My Submissions</h1>
      <ul className='space-y-3'>
        {rows.map(s => (
          <li key={s.id} className='rounded-xl border p-4'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <div className='text-sm'>
                  <span className='font-medium'>Platform:</span> {s.platform}
                </div>
                {s.linkUrl ? (
                  <div className='text-sm'>
                    <span className='font-medium'>Link:</span>{' '}
                    <a
                      href={s.linkUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='text-blue-600 underline break-all'
                    >
                      {s.linkUrl}
                    </a>
                  </div>
                ) : null}
                <div className='text-sm'>
                  <span className='font-medium'>Status:</span> {s.status}
                </div>
                <div className='text-xs text-gray-600'>
                  Submitted at: {s.createdAt.slice(0, 19).replace('T', ' ')} •{' '}
                  Order #{s.submissionOrder}
                </div>
              </div>
              <div className='text-right'>
                {/* NOTE:
                   If your challenge detail page uses slug (recommended), you’ll want
                   this API to also return the slug alongside challengeId.
                   For now, this links by ID which matches your backend route
                   `/api/challenges/:id` for owner pages or can be adapted. */}
                <Link
                  className='text-sm underline text-gray-700 hover:text-black'
                  href={`/challenges/${s.challengeId}`}
                >
                  View challenge
                </Link>
              </div>
            </div>
            {s.notes ? (
              <p className='text-sm mt-2 text-gray-700'>{s.notes}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
