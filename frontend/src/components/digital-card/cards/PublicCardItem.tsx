// src/components/cards/PublicCardItem.tsx
'use client';

import Link from 'next/link';
import type { DigitalCard } from '@/types/digitalCard';

type Props = {
  card: DigitalCard & { canEdit?: boolean };
  /** Must be named ...Action (Next.js rule) */
  onDeleteAction?: (id: string) => Promise<void> | void;
};

const PUBLIC_BASE: string | null =
  process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || null;

function buildPublicUrl(key?: string | null): string | null {
  return key && PUBLIC_BASE ? `${PUBLIC_BASE}/${key}` : null;
}

export default function PublicCardItem({ card, onDeleteAction }: Props) {
  const bannerUrl = buildPublicUrl(card.bannerKey ?? null);
  const avatarUrl = buildPublicUrl(card.avatarKey ?? null);

  return (
    <div className='rounded-xl border overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow'>
      {/* Banner */}
      <div className='h-28 w-full bg-gray-100'>
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt='banner'
            className='h-full w-full object-cover'
          />
        ) : null}
      </div>

      {/* Body */}
      <div className='p-4 relative'>
        {/* Avatar */}
        <div className='-mt-12 mb-2'>
          <div className='h-16 w-16 rounded-full ring-4 ring-white overflow-hidden bg-gray-200'>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt='avatar'
                className='h-full w-full object-cover'
              />
            ) : null}
          </div>
        </div>

        <div className='space-y-1'>
          <div className='text-sm text-gray-500'>{card.appName ?? '—'}</div>
          <div className='font-semibold text-lg'>
            {card.firstName} {card.lastName}
          </div>
          <div className='text-sm text-gray-700'>{card.role || '—'}</div>
        </div>

        {/* Actions */}
        <div className='mt-4 flex gap-2'>
          <Link
            href={`/profile/digitalcard/${encodeURIComponent(card.slug)}`}
            className='text-sm rounded px-3 py-1.5 border hover:bg-gray-50'
          >
            View
          </Link>

          {card.canEdit ? (
            <>
              <Link
                href={`/profile/cards/${card.id}`}
                className='text-sm rounded px-3 py-1.5 border hover:bg-gray-50'
              >
                Edit
              </Link>
              {onDeleteAction ? (
                <button
                  type='button'
                  onClick={() => onDeleteAction(card.id)}
                  className='text-sm rounded px-3 py-1.5 border text-red-600 hover:bg-red-50'
                >
                  Delete
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
