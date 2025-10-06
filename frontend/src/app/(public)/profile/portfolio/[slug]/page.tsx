// app/portfolio/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { api, HttpError } from '@/lib/api';

type PageProps = { params: Promise<{ slug: string }> };
export const dynamic = 'force-dynamic';

export default async function PublicPortfolioPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const { data: p } = await api.portfolio.publicGetBySlug(slug);

    const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || null;
    const urlFor = (key?: string | null) =>
      key && PUBLIC_BASE ? `${PUBLIC_BASE}/${key}` : null;

    const subImages = p.subImages ?? [];
    const projects = p.projects ?? [];
    const exps = p.experiences ?? [];
    const edus = p.educations ?? [];

    return (
      <div className='max-w-5xl mx-auto p-6 text-neutral-900 dark:text-neutral-100'>
        <h1 className='text-3xl font-bold'>{p.title}</h1>

        {p.description && (
          <p className='mt-2 text-neutral-700 dark:text-neutral-200 whitespace-pre-wrap'>
            {p.description}
          </p>
        )}

        {p.about && (
          <section className='mt-6 rounded border p-4 border-neutral-200 dark:border-neutral-700'>
            <h2 className='text-xl font-semibold'>About</h2>
            <div className='mt-2 text-sm leading-6'>
              <div>
                <span className='font-medium'>Name:</span> {p.about.firstName}{' '}
                {p.about.lastName}
              </div>
              {p.about.role && (
                <div>
                  <span className='font-medium'>Role:</span> {p.about.role}
                </div>
              )}
              {p.about.company && (
                <div>
                  <span className='font-medium'>Company:</span>{' '}
                  {p.about.company}
                </div>
              )}
              {p.about.university && (
                <div>
                  <span className='font-medium'>University:</span>{' '}
                  {p.about.university}
                </div>
              )}
              {p.about.country && (
                <div>
                  <span className='font-medium'>Country:</span>{' '}
                  {p.about.country}
                </div>
              )}
              {p.about.shortBio && (
                <div className='mt-2 whitespace-pre-wrap'>
                  {p.about.shortBio}
                </div>
              )}
            </div>
          </section>
        )}

        {p.mainImageKey && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urlFor(p.mainImageKey) ?? ''}
            alt='cover'
            className='w-full rounded-lg object-cover mt-6'
          />
        )}

        {subImages.length > 0 && (
          <section className='mt-8'>
            <h2 className='text-xl font-semibold mb-3'>Gallery</h2>
            <div className='grid sm:grid-cols-2 md:grid-cols-3 gap-3'>
              {subImages.map((img: any, idx: number) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id ?? idx}
                  src={img.url}
                  alt=''
                  className='w-full h-48 object-cover rounded'
                />
              ))}
            </div>
          </section>
        )}

        {exps.length > 0 && (
          <section className='mt-10'>
            <h2 className='text-2xl font-semibold mb-3'>Experience</h2>
            <div className='space-y-3'>
              {exps.map((e: any) => (
                <div
                  key={e.id}
                  className='rounded border p-4 border-neutral-200 dark:border-neutral-700'
                >
                  <div className='font-medium'>
                    {e.role} @ {e.company}
                  </div>
                  <div className='text-sm text-neutral-600 dark:text-neutral-300'>
                    {e.location && <>{e.location} · </>}
                    {e.startDate?.slice(0, 10)} –{' '}
                    {e.current ? 'Present' : e.endDate?.slice(0, 10) || '—'}
                  </div>
                  {e.summary && (
                    <p className='mt-1 whitespace-pre-wrap'>{e.summary}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {edus.length > 0 && (
          <section className='mt-10'>
            <h2 className='text-2xl font-semibold mb-3'>Education</h2>
            <div className='space-y-3'>
              {edus.map((ed: any) => (
                <div
                  key={ed.id}
                  className='rounded border p-4 border-neutral-200 dark:border-neutral-700'
                >
                  <div className='font-medium'>{ed.school}</div>
                  <div className='text-sm text-neutral-600 dark:text-neutral-300'>
                    {ed.degree || ed.field ? (
                      <>
                        {ed.degree} {ed.field && `• ${ed.field}`}
                      </>
                    ) : null}
                    {(ed.startDate || ed.endDate) && (
                      <>
                        {' '}
                        · {ed.startDate?.slice(0, 10)} –{' '}
                        {ed.endDate?.slice(0, 10) || '—'}
                      </>
                    )}
                  </div>
                  {ed.summary && (
                    <p className='mt-1 whitespace-pre-wrap'>{ed.summary}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {projects.length > 0 && (
          <section className='mt-10'>
            <h2 className='text-2xl font-semibold mb-4'>Projects</h2>
            <div className='space-y-6'>
              {projects.map((proj: any, i: number) => {
                const pSub = (proj.subImages ?? []) as any[];
                return (
                  <article
                    key={proj.id ?? i}
                    className='rounded border p-4 border-neutral-200 dark:border-neutral-700'
                  >
                    <h3 className='text-lg font-semibold'>{proj.title}</h3>

                    {proj.description && (
                      <p className='mt-1 text-neutral-700 dark:text-neutral-200 whitespace-pre-wrap'>
                        {proj.description}
                      </p>
                    )}

                    {proj.mainImageKey && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={urlFor(proj.mainImageKey) ?? ''}
                        alt=''
                        className='w-full rounded mt-3 object-cover'
                      />
                    )}

                    {pSub.length > 0 && (
                      <div className='mt-3 grid sm:grid-cols-2 md:grid-cols-3 gap-3'>
                        {pSub.map((img, idx2) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={img.id ?? idx2}
                            src={img.url}
                            alt=''
                            className='w-full h-40 object-cover rounded'
                          />
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
}
