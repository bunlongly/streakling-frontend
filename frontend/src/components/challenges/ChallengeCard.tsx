import Link from 'next/link';

type Prize = {
  id: string;
  rank: number;
  label?: string | null;
  amountCents?: number | null;
};
type Img = { id: string; url: string; key: string; sortOrder: number };
type Challenge = {
  id: string;
  slug: string;
  title: string;
  brandName: string | null;
  postedOn: string; // server sends this (publishedAt || createdAt)
  images?: Img[];
  prizes?: Prize[];
};

function formatCents(cents?: number | null) {
  if (typeof cents !== 'number' || isNaN(cents)) return null;
  // simple USD-style formatter; tweak locale/currency if needed
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

function rankSuffix(n: number) {
  const j = n % 10,
    k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

export default function ChallengeCard({ c }: { c: Challenge }) {
  const img = (c.images ?? [])[0];
  const posted = c.postedOn.slice(0, 10);

  const prizes = Array.isArray(c.prizes) ? [...c.prizes] : [];
  prizes.sort((a, b) => a.rank - b.rank);

  // Show up to 3 prize chips inline
  const top = prizes.slice(0, 3);
  const remaining = prizes.length > 3 ? prizes.length - 3 : 0;

  return (
    <Link
      href={`/challenges/${c.slug}`}
      className='block rounded-2xl border overflow-hidden hover:shadow-sm transition'
    >
      {img ? (
        <img
          src={img.url}
          alt={c.title}
          className='w-full h-48 object-cover'
          loading='lazy'
        />
      ) : (
        <div className='w-full h-48 bg-gray-100' />
      )}

      <div className='p-4 space-y-2'>
        <div className='text-sm text-gray-500'>Posted on {posted}</div>
        <h3 className='text-lg font-semibold'>{c.title}</h3>
        {c.brandName ? (
          <div className='text-gray-600'>{c.brandName}</div>
        ) : null}

        {/* --- Prize row (optional) --- */}
        {prizes.length > 0 ? (
          <div className='flex flex-wrap items-center gap-2 pt-1'>
            {top.map(p => {
              const amount = formatCents(p.amountCents);
              const text =
                amount && p.label
                  ? `${rankSuffix(p.rank)} • ${p.label} • ${amount}`
                  : amount
                  ? `${rankSuffix(p.rank)} • ${amount}`
                  : p.label
                  ? `${rankSuffix(p.rank)} • ${p.label}`
                  : rankSuffix(p.rank);
              return (
                <span
                  key={p.id}
                  className='text-xs px-2 py-1 rounded-full border bg-gray-50'
                >
                  {text}
                </span>
              );
            })}
            {remaining > 0 ? (
              <span className='text-xs px-2 py-1 rounded-full border bg-gray-50'>
                +{remaining} more
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
