// src/app/challenges/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { api, HttpError } from '@/lib/api';
import SubmissionSection from '@/components/challenges/SubmissionSection';
import MagicBorder from '@/components/ui/MagicBorder';
import Image from 'next/image';

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
    const platforms = Array.isArray(c.targetPlatforms) ? c.targetPlatforms : [];

    return (
      <main className='max-w-4xl mx-auto px-4 py-8 space-y-8'>
        {/* ===== Header ===== */}
        <header className='flex items-start gap-4'>
          {/* Brand logo in a subtle gradient ring (no shadow) */}
          {brandLogoUrl ? (
            <div className='shrink-0'>
              <MagicBorder radius='rounded-2xl' className='shadow-none'>
                <div className='relative h-16 w-16 overflow-hidden rounded-2xl bg-white'>
                  <Image
                    src={brandLogoUrl}
                    alt='Brand logo'
                    fill
                    sizes='64px'
                    className='object-cover'
                    priority
                  />
                </div>
              </MagicBorder>
            </div>
          ) : null}

          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <p className='text-xs font-medium tracking-wide text-neutral-500'>
                CHALLENGE
              </p>
              <span className='rounded-full px-2 py-0.5 text-[10px] font-semibold text-white bg-[linear-gradient(120deg,#7b39e8_0%,#2d69ea_55%,#10a991_100%)]'>
                Live
              </span>
            </div>

            <h1 className='mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight'>
              {c.title}
            </h1>

            {c.brandName ? (
              <div className='mt-1 text-[15px] text-neutral-700'>
                {c.brandName}
              </div>
            ) : null}

            {/* Meta chips */}
            <div className='mt-3 flex flex-wrap items-center gap-2'>
              {platforms.length ? (
                <span className='inline-flex items-center gap-2 text-[12px] px-3 py-1 rounded-full border bg-white'>
                  <span className='font-semibold'>Platforms</span>
                  <span className='text-neutral-700'>
                    {platforms.join(', ')}
                  </span>
                </span>
              ) : (
                <span className='inline-flex items-center text-[12px] px-3 py-1 rounded-full border bg-white text-neutral-600'>
                  Platforms: —
                </span>
              )}

              {c.deadline ? (
                <span className='inline-flex items-center text-[12px] px-3 py-1 rounded-full border bg-white'>
                  Ends:{' '}
                  <span className='ml-1 font-semibold'>
                    {c.deadline.slice(0, 10)}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
        </header>

        {/* ===== Images gallery (optional) ===== */}
        {images.length ? (
          <section>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
              {images.map(img => (
                <MagicBorder
                  key={img.id}
                  radius='rounded-2xl'
                  className='shadow-none'
                >
                  <div className='relative h-40 w-full overflow-hidden rounded-2xl'>
                    <Image
                      src={img.url}
                      alt='Challenge image'
                      fill
                      sizes='(max-width: 768px) 50vw, 33vw'
                      className='object-cover'
                      loading='lazy'
                    />
                  </div>
                </MagicBorder>
              ))}
            </div>
          </section>
        ) : null}

        {/* ===== Description ===== */}
        {c.description ? (
          <section>
            <MagicBorder radius='rounded-2xl' className='shadow-none'>
              <div className='rounded-2xl bg-white p-5'>
                <h2 className='text-lg font-semibold mb-2'>About</h2>
                <p className='whitespace-pre-wrap text-[15px] leading-6 text-neutral-800'>
                  {c.description}
                </p>
              </div>
            </MagicBorder>
          </section>
        ) : null}

        {/* ===== Prizes ===== */}
        {prizes.length ? (
          <section className='space-y-3'>
            <h2 className='text-lg font-semibold'>Prizes</h2>
            <ul className='space-y-3'>
              {prizes.map(p => {
                const amount = formatCents(p.amountCents);
                return (
                  <li key={p.id}>
                    <MagicBorder radius='rounded-2xl' className='shadow-none'>
                      <div className='rounded-2xl bg-white p-3 text-sm flex items-center justify-between'>
                        <div className='font-semibold'>
                          {rankSuffix(p.rank)}
                        </div>
                        <div className='flex-1 px-3 text-neutral-700'>
                          {p.label ?? '—'}
                        </div>
                        <div className='text-neutral-900 font-semibold'>
                          {amount ?? '—'}
                        </div>
                      </div>
                    </MagicBorder>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {/* ===== Submissions (client) ===== */}
        <section>
          <SubmissionSection challengeId={c.id} />
        </section>
      </main>
    );
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
}
