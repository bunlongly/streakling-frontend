// src/components/portfolio/PortfolioExploreCard.tsx
'use client';

import Link from 'next/link';
import type { Portfolio } from '@/types/portfolio';

const PUBLIC_BASE: string | null = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || null;
const buildPublicUrl = (key?: string | null): string | null =>
  key && PUBLIC_BASE ? `${PUBLIC_BASE}/${key}` : null;

// Type guards to avoid `any`
function hasIsOwner(p: unknown): p is { isOwner?: boolean } {
  return typeof p === 'object' && p !== null && 'isOwner' in p;
}
function hasAboutRole(p: unknown): p is { about?: { role?: string } } {
  if (typeof p !== 'object' || p === null) return false;
  const anyP = p as Record<string, unknown>;
  if (!('about' in anyP)) return false;
  const about = anyP.about as unknown;
  return (
    typeof about === 'object' &&
    about !== null &&
    ('role' in (about as Record<string, unknown>) ||
      (about as Record<string, unknown>).role === undefined)
  );
}

export default function PortfolioExploreCard({
  portfolio
}: {
  portfolio: Portfolio | undefined | null;
}) {
  if (!portfolio) return null; // guard against undefined/null

  const mainKey = portfolio.mainImageKey ?? null;

  // pick a fallback cover
  const firstSub =
    Array.isArray(portfolio.subImages) && portfolio.subImages.length > 0
      ? portfolio.subImages[0]
      : undefined;

  const coverUrl =
    (mainKey && buildPublicUrl(mainKey)) ||
    firstSub?.url ||
    (firstSub?.key ? buildPublicUrl(firstSub.key) : null);

  // Some public list endpoints may not send isOwner; default to false
  const isOwner = hasIsOwner(portfolio) && portfolio.isOwner === true;

  const aboutRole = hasAboutRole(portfolio) ? portfolio.about?.role : undefined;

  return (
    <div className='rounded-xl border overflow-hidden bg-white'>
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={portfolio.title || 'Portfolio'}
          className='w-full h-40 object-cover'
        />
      ) : (
        <div className='w-full h-40 bg-neutral-100' />
      )}
      <div className='p-4'>
        <h3 className='font-medium line-clamp-1'>
          {portfolio.title || 'Untitled'}
        </h3>

        {aboutRole && (
          <p className='text-xs text-neutral-600 mt-1 line-clamp-1'>
            {aboutRole}
          </p>
        )}

        {Array.isArray(portfolio.tags) && portfolio.tags.length > 0 && (
          <div className='mt-2 flex flex-wrap gap-1'>
            {portfolio.tags.slice(0, 4).map((tag, i) => (
              <span
                key={`${String(tag)}-${i}`}
                className='text-[11px] px-2 py-0.5 rounded-full bg-neutral-100'
              >
                {String(tag)}
              </span>
            ))}
          </div>
        )}

        <div className='mt-3 flex items-center gap-2'>
          <Link
            href={`/portfolio/${encodeURIComponent(portfolio.slug)}`}
            className='text-sm underline'
          >
            View
          </Link>

          {isOwner && (
            <>
              <span className='text-neutral-300'>|</span>
              <Link
                href={`/profile/portfolios/${portfolio.id}`}
                className='text-sm underline'
              >
                Edit
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
