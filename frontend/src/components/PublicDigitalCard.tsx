'use client';

import type { DigitalCard } from '@/types/digitalCard';

const S3_PUBLIC = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE;

type Props = { card: DigitalCard };

export default function PublicDigitalCard({ card }: Props) {
  const avatarUrl =
    card.avatarKey && S3_PUBLIC ? `${S3_PUBLIC}/${card.avatarKey}` : undefined;
  const bannerUrl =
    card.bannerKey && S3_PUBLIC ? `${S3_PUBLIC}/${card.bannerKey}` : undefined;

  return (
    <div className='rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm'>
      {bannerUrl && (
        <div className='relative h-40 w-full'>
          <img
            src={bannerUrl}
            alt='banner'
            className='h-full w-full object-cover'
          />
        </div>
      )}

      <div className='p-5 md:p-6'>
        <div className='flex items-start gap-4'>
          <div className='h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-200'>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${card.firstName} ${card.lastName}`}
                className='h-full w-full object-cover'
              />
            ) : (
              <div className='flex h-full w-full items-center justify-center text-xl font-semibold text-gray-700'>
                {card.firstName?.[0] ?? 'U'}
              </div>
            )}
          </div>

          <div className='min-w-0'>
            <div className='text-xl font-semibold text-gray-900 truncate'>
              {card.firstName} {card.lastName}
            </div>
            <div className='text-sm text-gray-600'>{card.role}</div>
            <div className='mt-1 text-sm text-gray-700'>
              <span className='px-2 py-0.5 rounded bg-gray-100 text-gray-700'>
                {card.status}
              </span>
              {card.company && card.showCompany && (
                <span className='ml-2'>{card.company}</span>
              )}
              {card.university && card.showUniversity && (
                <span className='ml-2'>{card.university}</span>
              )}
              {card.country && card.showCountry && (
                <span className='ml-2'>{card.country}</span>
              )}
            </div>
          </div>
        </div>

        {card.shortBio ? (
          <p className='mt-4 text-sm leading-relaxed text-gray-800'>
            {card.shortBio}
          </p>
        ) : null}

        <div className='mt-4 grid gap-2 text-sm'>
          {card.phone && card.showPhone && (
            <div className='text-gray-700'>
              <span className='text-gray-500 mr-2'>Phone:</span> {card.phone}
            </div>
          )}
          {card.religion && card.showReligion && (
            <div className='text-gray-700'>
              <span className='text-gray-500 mr-2'>Religion:</span>{' '}
              {card.religion}
            </div>
          )}
        </div>

        {card.socials?.length ? (
          <div className='mt-5 flex flex-wrap gap-2'>
            {card.socials.map(s => (
              <a
                key={s.id}
                href={s.url ?? '#'}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-800 hover:bg-gray-50'
                title={s.handle ?? s.platform}
              >
                <span className='uppercase text-xs text-gray-500'>
                  {s.platform}
                </span>
                {s.handle ? <span>{s.handle}</span> : null}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
