// src/components/challenges/ChallengePosterCard.tsx
import Link from 'next/link';
import MagicBorder from '@/components/ui/MagicBorder';

type Prize = {
  id: string;
  rank: number;
  label?: string | null;
  amountCents?: number | null;
};

type Img = { id: string; url: string | null | undefined };

type Challenge = {
  id: string;
  slug: string;
  title: string;
  brandName: string | null;
  postedOn: string; // ISO date
  images?: Img[];
  prizes?: Prize[];
};

function prettyDate(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}

function rankSuffix(n: number) {
  const j = n % 10,
    k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

function rankEmoji(rank: number) {
  if (rank === 1) return '🏆';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '🎖️';
}

function formatCents(cents?: number | null) {
  if (typeof cents !== 'number' || Number.isNaN(cents)) return null;
  const val = cents / 100;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
}

export default function ChallengePosterCard({ c }: { c: Challenge }) {
  const img = (c.images ?? []).find(i => i?.url)?.url ?? null;
  const posted = prettyDate(c.postedOn);

  const prizes = Array.isArray(c.prizes) ? [...c.prizes] : [];
  prizes.sort((a, b) => a.rank - b.rank);
  const top = prizes.slice(0, 3);

  return (
    <MagicBorder radius='rounded-2xl' className='h-full'>
      <Link
        href={`/challenges/${c.slug}`}
        className='
          group block h-full overflow-hidden rounded-2xl
          bg-white
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7b39e8]
        '
      >
        {/* Poster image with zoom-on-hover */}
        <div className='relative overflow-hidden'>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={c.title}
              className='w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-[1.03]'
              loading='lazy'
            />
          ) : (
            <div className='w-full aspect-[4/3] bg-neutral-100' />
          )}

          {/* Top-left status pill */}
          <div
            className='
              absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px]
              font-semibold tracking-wide text-white
              bg-[linear-gradient(120deg,#7b39e8_0%,#2d69ea_55%,#10a991_100%)]
              shadow
            '
          >
            Open
          </div>

          {/* Bottom overlay info strip */}
          <div
            className='
              absolute inset-x-0 bottom-0 p-4
              bg-gradient-to-t from-black/55 via-black/25 to-transparent
              text-white
            '
          >
            <h3 className='text-base sm:text-[17px] font-semibold leading-snug line-clamp-2'>
              {c.title}
            </h3>
            <div className='mt-1 flex items-center gap-2 text-[12px] opacity-90'>
              <time dateTime={c.postedOn}>{posted}</time>
              {c.brandName && (
                <>
                  <span>•</span>
                  <span className='truncate'>{c.brandName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Prize chips row */}
        <div className='p-4'>
          {top.length > 0 ? (
            <div className='flex flex-wrap items-center gap-2'>
              {top.map(p => {
                const money = formatCents(p.amountCents);
                const text = [rankEmoji(p.rank) + ' ' + rankSuffix(p.rank)]
                  .concat(p.label ? [p.label] : [])
                  .concat(money ? [money] : [])
                  .join(' • ');
                return (
                  <span
                    key={p.id}
                    className='
                      text-[11px] leading-5 px-2.5 py-1 rounded-full
                      border border-neutral-200 bg-white shadow-sm
                    '
                  >
                    {text}
                  </span>
                );
              })}
              {prizes.length > 3 && (
                <span className='text-[11px] leading-5 px-2.5 py-1 rounded-full border border-neutral-200 bg-white shadow-sm'>
                  +{prizes.length - 3} more
                </span>
              )}
            </div>
          ) : (
            <div className='text-[13px] text-neutral-600'>No prize info</div>
          )}
        </div>
      </Link>
    </MagicBorder>
  );
}
