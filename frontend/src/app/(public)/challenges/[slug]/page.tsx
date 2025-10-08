// src/app/challenges/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { api, HttpError } from '@/lib/api';
import SubmissionSection from '@/components/challenges/SubmissionSection';

type Props = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

// Build a public URL from an S3 key, or pass through if it's already a URL
const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || null;
function toPublicUrl(keyOrUrl?: string | null) {
  if (!keyOrUrl) return null;
  if (/^https?:\/\//i.test(keyOrUrl)) return keyOrUrl; // already a URL
  return PUBLIC_BASE ? `${PUBLIC_BASE}/${keyOrUrl}` : null;
}

function formatCents(cents?: number | null) {
  if (typeof cents !== 'number' || isNaN(cents)) return null;
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

export default async function ChallengeDetailPage({ params }: Props) {
  const { slug } = await params;

  try {
    const { data: c } = await api.challenge.publicGetBySlug(slug);

    const prizes = Array.isArray(c.prizes)
      ? [...c.prizes].sort((a, b) => a.rank - b.rank)
      : [];
    const images = Array.isArray(c.images) ? c.images : [];
    const brandLogoUrl = toPublicUrl(c.brandLogoKey);

    return (
      <div className='max-w-4xl mx-auto px-4 py-8 space-y-8'>
        {/* Header */}
        <div className='space-y-2'>
          <h1 className='text-2xl font-semibold'>{c.title}</h1>
          {c.brandName ? (
            <div className='text-gray-600'>{c.brandName}</div>
          ) : null}
          <div className='text-sm text-gray-600'>
            {Array.isArray(c.targetPlatforms) && c.targetPlatforms.length
              ? `Platforms: ${c.targetPlatforms.join(', ')}`
              : 'Platforms: —'}
            {c.deadline ? ` • Ends: ${c.deadline.slice(0, 10)}` : ''}
          </div>
        </div>

        {/* Brand logo */}
        {brandLogoUrl ? (
          <div>
            <img
              src={brandLogoUrl}
              alt='Brand logo'
              className='h-16 w-16 object-cover rounded-lg border'
            />
          </div>
        ) : null}

        {/* Images gallery (optional) */}
        {images.length ? (
          <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
            {images.map(img => (
              <img
                key={img.id}
                src={img.url}
                alt='Challenge image'
                className='w-full h-40 object-cover rounded-xl border'
                loading='lazy'
              />
            ))}
          </div>
        ) : null}

        {/* Description */}
        {c.description ? (
          <p className='whitespace-pre-wrap'>{c.description}</p>
        ) : null}

        {/* Prizes */}
        {prizes.length ? (
          <section className='space-y-3'>
            <h2 className='text-lg font-semibold'>Prizes</h2>
            <ul className='space-y-2'>
              {prizes.map(p => {
                const amount = formatCents(p.amountCents);
                return (
                  <li
                    key={p.id}
                    className='rounded-xl border p-3 text-sm flex items-center justify-between'
                  >
                    <div className='font-medium'>{rankSuffix(p.rank)}</div>
                    <div className='flex-1 px-3 text-gray-700'>
                      {p.label ?? '—'}
                    </div>
                    <div className='text-gray-900 font-semibold'>
                      {amount ?? '—'}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {/* Submissions (client) */}
        <SubmissionSection challengeId={c.id} />
      </div>
    );
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
}
