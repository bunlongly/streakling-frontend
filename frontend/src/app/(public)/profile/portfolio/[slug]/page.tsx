import { notFound } from 'next/navigation';
import { api, HttpError } from '@/lib/api';

type PageProps = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

export default async function PublicPortfolioPage({ params }: PageProps) {
  const { slug } = await params; // Next 15: await params

  try {
    const { data: p } = await api.portfolio.publicGetBySlug(slug);

    const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || null;
    const urlFor = (key?: string | null) =>
      key && PUBLIC_BASE ? `${PUBLIC_BASE}/${key}` : null;

    const subImages = p.subImages ?? [];
    const projects = p.projects ?? [];

    return (
      <div className='max-w-5xl mx-auto p-6'>
        <h1 className='text-3xl font-bold'>{p.title}</h1>

        {p.description && (
          <p className='mt-2 text-neutral-700 whitespace-pre-wrap'>
            {p.description}
          </p>
        )}

        {/* Cover */}
        {p.mainImageKey && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urlFor(p.mainImageKey) ?? ''}
            alt='cover'
            className='w-full rounded-lg object-cover mt-6'
          />
        )}

        {/* Gallery */}
        {subImages.length > 0 && (
          <section className='mt-8'>
            <h2 className='text-xl font-semibold mb-3'>Gallery</h2>
            <div className='grid sm:grid-cols-2 md:grid-cols-3 gap-3'>
              {subImages.map((img, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={(img as any).id ?? idx}
                  src={(img as any).url}
                  alt=''
                  className='w-full h-48 object-cover rounded'
                />
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className='mt-10'>
            <h2 className='text-2xl font-semibold mb-4'>Projects</h2>
            <div className='space-y-6'>
              {projects.map((proj: any, i: number) => {
                const pSub = (proj.subImages ?? []) as any[];
                return (
                  <article key={proj.id ?? i} className='rounded border p-4'>
                    <h3 className='text-lg font-semibold'>{proj.title}</h3>

                    {proj.description && (
                      <p className='mt-1 text-neutral-700 whitespace-pre-wrap'>
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
    // If the backend says "Portfolio not found" (e.g. slug doesn’t exist or not published),
    // show the route-level Not Found UI.
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
}
