'use client';

import Link from 'next/link';
import type { DigitalCard } from '@/types/digitalCard';
import FlipCard from '@/components/ui/FlipCard'; 
import MagicBorder from '@/components/ui/MagicBorder';

type Props = {
  card: DigitalCard & { canEdit?: boolean };
  onDeleteAction?: (id: string) => Promise<void> | void;
};

const PUBLIC_BASE: string | null =
  process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || null;
const buildPublicUrl = (key?: string | null) =>
  key && PUBLIC_BASE ? `${PUBLIC_BASE}/${key}` : null;

function Img({
  src,
  alt,
  className
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) return <div className={`bg-gray-200 ${className}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}

export default function PublicCardItem({ card, onDeleteAction }: Props) {
  const bannerUrl = buildPublicUrl(card.bannerKey ?? null);
  const avatarUrl = buildPublicUrl(card.avatarKey ?? null);

  const Front = (
    <MagicBorder className='h-full' radius='rounded-2xl'>
      <div className='h-full'>
        {/* Banner */}
        <div className='h-28 w-full'>
          {bannerUrl ? (
            <Img
              src={bannerUrl}
              alt='banner'
              className='h-full w-full object-cover'
            />
          ) : (
            <div className='h-full w-full bg-gradient-to-r from-[#9e55f7] via-[#447aee] to-[#13b9a3]' />
          )}
        </div>

        {/* Centered body */}
        <div className='p-4'>
          <div className='-mt-12 mb-3 flex justify-center'>
            <div className='h-16 w-16 rounded-full ring-4 ring-white overflow-hidden bg-gray-200 shadow'>
              <Img
                src={avatarUrl}
                alt='avatar'
                className='h-full w-full object-cover'
              />
            </div>
          </div>

          <div className='text-center space-y-1'>
            <div className='text-xs uppercase tracking-wide text-gray-500'>
              {card.appName ?? '—'}
            </div>
            <div className='font-semibold text-lg'>
              {card.firstName} {card.lastName}
            </div>
            <div className='text-sm text-gray-700'>{card.role || '—'}</div>
          </div>

          <div className='mt-4 text-center text-xs text-gray-500'>
            Click to flip
          </div>
        </div>
      </div>
    </MagicBorder>
  );

  const Back = (
    <MagicBorder className='h-full' radius='rounded-2xl'>
      <div className='h-full flex flex-col'>
        <div className='h-28 w-full bg-[radial-gradient(900px_400px_at_-10%_-20%,#9e55f7_0%,transparent_55%),radial-gradient(700px_300px_at_120%_120%,#447aee_0%,transparent_60%)]' />
        <div className='p-4 flex-1 flex flex-col items-center text-center'>
          <div className='font-semibold text-lg'>Quick Actions</div>
          <div className='text-sm text-gray-600'>Open or manage this card.</div>

          <div className='mt-4 w-full max-w-xs grid gap-2'>
            <Link
              href={`/profile/digitalcard/${encodeURIComponent(card.slug)}`}
              className='inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium
                         bg-gradient-to-r from-[#9e55f7] to-[#447aee] text-white hover:opacity-95 active:opacity-90
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500'
            >
              View Digital Name Card
            </Link>

            {card.canEdit ? (
              <div className='flex gap-2'>
                <Link
                  href={`/profile/cards/${card.id}`}
                  className='flex-1 rounded-lg px-4 py-2 text-sm border hover:bg-gray-50 text-center'
                >
                  Edit
                </Link>
                {onDeleteAction ? (
                  <button
                    type='button'
                    onClick={() => onDeleteAction(card.id)}
                    className='flex-1 rounded-lg px-4 py-2 text-sm border text-red-600 hover:bg-red-50'
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <p className='mt-auto pt-4 text-xs text-gray-500'>
            Click anywhere outside the buttons to flip back.
          </p>
        </div>
      </div>
    </MagicBorder>
  );

  return (
    <FlipCard
      className='h-[320px] transition-transform duration-200 will-change-transform hover:scale-[1.01]'
      front={Front}
      back={Back}
      // ✅ no function props passed anymore
    />
  );
}
