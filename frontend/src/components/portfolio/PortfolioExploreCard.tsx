'use client';

import Link from 'next/link';
import type { Portfolio } from '@/types/portfolio';
import MagicBorder from '@/components/ui/MagicBorder';

const PUBLIC_BASE: string | null =
  process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || null;
const buildPublicUrl = (key?: string | null): string | null =>
  key && PUBLIC_BASE ? `${PUBLIC_BASE}/${key}` : null;

// Type guards (kept)
function hasIsOwner(p: unknown): p is { isOwner?: boolean } {
  return typeof p === 'object' && p !== null && 'isOwner' in p;
}
function hasAboutRole(p: unknown): p is { about?: { role?: string } } {
  if (typeof p !== 'object' || p === null) return false;
  const anyP = p as Record<string, unknown>;
  const about = anyP.about as unknown;
  return 'about' in anyP && typeof about === 'object' && about !== null;
}

/**
 * Row/list item version of portfolio preview with animated gradient BORDER.
 * Uses MagicBorder so the card surface stays still while the border animates.
 */
export default function PortfolioExploreCard({
  portfolio
}: {
  portfolio: Portfolio | undefined | null;
}) {
  if (!portfolio) return null;

  const mainKey = portfolio.mainImageKey ?? null;
  const firstSub =
    Array.isArray(portfolio.subImages) && portfolio.subImages.length > 0
      ? portfolio.subImages[0]
      : undefined;

  const coverUrl =
    (mainKey && buildPublicUrl(mainKey)) ||
    firstSub?.url ||
    (firstSub?.key ? buildPublicUrl(firstSub.key) : null);

  const isOwner = hasIsOwner(portfolio) && portfolio.isOwner === true;
  const aboutRole =
    hasAboutRole(portfolio) && typeof portfolio.about?.role === 'string'
      ? portfolio.about.role
      : undefined;

  return (
    <MagicBorder radius="rounded-xl" className="transition-transform duration-200 hover:scale-[1.005]">
      <div
        className="
          group w-full
          grid grid-cols-[120px_1fr_auto] gap-4 items-center
          h-28 px-3 sm:px-4
          rounded-xl
          bg-white hover:bg-gray-50 transition-colors
        "
        role="listitem"
      >
        {/* Left: fixed thumbnail */}
        <div className="relative h-20 w-[120px] overflow-hidden rounded-md bg-neutral-100">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={portfolio.title || 'Portfolio cover'}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
        </div>

        {/* Middle: title, role, tags */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">
              {portfolio.title || 'Untitled'}
            </h3>
          </div>

          {aboutRole && (
            <p className="text-xs text-neutral-600 mt-0.5 truncate">
              {aboutRole}
            </p>
          )}

          {Array.isArray(portfolio.tags) && portfolio.tags.length > 0 && (
            <div className="mt-2 hidden sm:flex flex-wrap gap-1">
              {portfolio.tags.slice(0, 6).map((tag, i) => (
                <span
                  key={`${String(tag)}-${i}`}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700"
                >
                  {String(tag)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/profile/portfolio/${encodeURIComponent(portfolio.slug)}`}
            className="
              inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium
              bg-gradient-to-r from-[#9e55f7] to-[#447aee] text-white
              hover:opacity-95 active:opacity-90
              focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500
            "
          >
            View
          </Link>

          {isOwner && (
            <Link
              href={`/profile/portfolios/${portfolio.id}`}
              className="text-sm underline text-neutral-700 hover:text-neutral-900"
            >
              Edit
            </Link>
          )}
        </div>
      </div>
    </MagicBorder>
  );
}
