// src/app/(public)/profile/portfolio/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { api, HttpError } from '@/lib/api';
import type { Portfolio } from '@/types/portfolio';
import MagicBorder from '@/components/ui/MagicBorder';

/* MUI icons */
import BusinessIcon from '@mui/icons-material/Business';
import SchoolIcon from '@mui/icons-material/School';
import PublicIcon from '@mui/icons-material/Public';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import SendIcon from '@mui/icons-material/Send';
import PlayArrowIcon from '@mui/icons-material/PlayArrow'; // for video links

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

type SubImage = NonNullable<Portfolio['subImages']>[number];
type Project = NonNullable<Portfolio['projects']>[number];
type Experience = NonNullable<Portfolio['experiences']>[number];
type Education = NonNullable<Portfolio['educations']>[number];

type TopVideo = NonNullable<Portfolio['videoLinks']>[number];

/* ---------------- helpers ---------------- */
const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || null;
const urlFor = (key?: string | null) =>
  key && PUBLIC_BASE ? `${PUBLIC_BASE}/${key}` : null;

function fmtDate(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return (iso || '').slice(0, 10);
  return d.toLocaleDateString();
}
function dateRange(
  start?: string | null,
  end?: string | null,
  current?: boolean
) {
  const a = fmtDate(start);
  const b = current ? 'Present' : fmtDate(end) || '—';
  return [a, b].filter(Boolean).join(' – ');
}

function getAbout(p: Portfolio) {
  const a = (p as unknown as { about?: unknown }).about;
  return (a && typeof a === 'object' ? (a as Record<string, unknown>) : {}) as {
    firstName?: string;
    lastName?: string;
    role?: string;
    shortBio?: string;
    company?: string;
    university?: string;
    country?: string;
    email?: string;
    website?: string;
    phone?: string;
    telegramHandle?: string;
    avatarKey?: string;
    avatarUrl?: string;
    bannerKey?: string;
    bannerUrl?: string;
  };
}
const getAvatar = (p: Portfolio, about = getAbout(p)) =>
  urlFor(about.avatarKey ?? null) ?? about.avatarUrl ?? null;

const getBanner = (p: Portfolio, about = getAbout(p)) =>
  urlFor(about.bannerKey ?? null) ?? about.bannerUrl ?? urlFor(p.mainImageKey); // ✅ removed `?? null ??`

/** Try common locations your API might place a public digital card slug */
type WithCardSlug = {
  digitalCardSlug?: string | null;
  publicCardSlug?: string | null;
  cardSlug?: string | null;
  owner?: { digitalCardSlug?: string | null } | null;
  user?: { digitalCardSlug?: string | null } | null;
};
function getPublicCardSlug(p: Portfolio & WithCardSlug): string | null {
  const candidates: Array<string | null | undefined> = [
    p.digitalCardSlug,
    p.publicCardSlug,
    p.cardSlug,
    p.owner?.digitalCardSlug,
    p.user?.digitalCardSlug
  ];
  const found = candidates.find(
    (c): c is string => typeof c === 'string' && c.trim().length > 0
  );
  return found ? found.trim() : null;
}

/* tiny UI bits */
function InfoRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className='inline-flex items-center gap-2 text-sm text-neutral-700'>
      <span aria-hidden className='leading-none'>
        {icon}
      </span>
      <span className='truncate'>{label}</span>
    </div>
  );
}
function InfoLink({
  icon,
  label,
  href
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  const isHttp = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      target={isHttp ? '_blank' : undefined}
      rel={isHttp ? 'noopener noreferrer' : undefined}
      className='inline-flex items-center gap-2 text-sm text-neutral-700 hover:underline decoration-neutral-400'
    >
      <span aria-hidden className='leading-none'>
        {icon}
      </span>
      <span className='truncate'>{label}</span>
    </a>
  );
}

/* ---------------- page ---------------- */
export default async function PublicPortfolioPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const { data: p } = await api.portfolio.publicGetBySlug(slug);

    const subImages: SubImage[] = p.subImages ?? [];
    const projects: Project[] = p.projects ?? [];
    const exps: Experience[] = p.experiences ?? [];
    const edus: Education[] = p.educations ?? [];
    const topVideos: TopVideo[] = p.videoLinks ?? [];
    const about = getAbout(p);
    const avatar = getAvatar(p, about);
    const banner = getBanner(p, about);
    const cardSlug = getPublicCardSlug(p as Portfolio & WithCardSlug);

    const fullName =
      (
        (about.firstName || '') + (about.lastName ? ` ${about.lastName}` : '')
      ).trim() ||
      p.title ||
      'Portfolio';

    return (
      <main className='min-h-[80vh] text-foreground'>
        {/* ================= HERO ================= */}
        <section className='relative'>
          {/* gradient base */}
          <div
            className='
              h-56 sm:h-64 w-full
              bg-[linear-gradient(120deg,#7b39e8_0%,#2d69ea_55%,#10a991_100%)]
              bg-[length:220%_220%] animate-[border-pan_14s_ease-in-out_infinite]
              opacity-90
            '
          />
          {banner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner}
              alt='banner'
              className='absolute inset-0 h-56 sm:h-64 w-full object-cover mix-blend-overlay opacity-60'
            />
          )}

          {/* avatar + name */}
          <div className='absolute inset-x-0 -bottom-12'>
            <div className='max-w-6xl mx-auto px-4 sm:px-6 flex items-end gap-4'>
              {/* avatar (no black: gradient ring + light inner plate) */}
              <div className='shrink-0'>
                <div className='p-[3px] rounded-full bg-[linear-gradient(120deg,#7b39e8_0%,#2d69ea_55%,#10a991_100%)] shadow'>
                  <div className='h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden bg-white'>
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt='avatar'
                        className='h-full w-full object-cover'
                      />
                    ) : (
                      <div className='h-full w-full grid place-items-center text-xs text-neutral-400'>
                        No avatar
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* name + role */}
              <div className='pb-2'>
                <h1 className='text-2xl sm:text-3xl font-extrabold tracking-wide'>
                  {fullName}
                </h1>
                {about.role && (
                  <p className='mt-0.5 text-[15px] font-medium text-neutral-700'>
                    {about.role}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ================= BODY ================= */}
        <section className='pt-16 pb-20'>
          <div className='max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-12 gap-8'>
            {/* ---------- Sidebar (sticky) ---------- */}
            <aside className='col-span-12 lg:col-span-4'>
              <div className='lg:sticky lg:top-24 space-y-6'>
                {/* Contacts */}
                <MagicBorder radius='rounded-2xl' className='shadow-sm'>
                  <div className='rounded-2xl bg-white/70 backdrop-blur p-6'>
                    <div className='space-y-2'>
                      {about.company && (
                        <InfoRow
                          icon={<BusinessIcon fontSize='small' />}
                          label={about.company}
                        />
                      )}
                      {about.university && (
                        <InfoRow
                          icon={<SchoolIcon fontSize='small' />}
                          label={about.university}
                        />
                      )}
                      {about.country && (
                        <InfoRow
                          icon={<PublicIcon fontSize='small' />}
                          label={about.country}
                        />
                      )}
                      {about.phone && (
                        <InfoRow
                          icon={<PhoneIcon fontSize='small' />}
                          label={about.phone}
                        />
                      )}
                      {about.email && (
                        <InfoLink
                          icon={<EmailIcon fontSize='small' />}
                          href={`mailto:${about.email}`}
                          label={about.email}
                        />
                      )}
                      {about.website && (
                        <InfoLink
                          icon={<LanguageIcon fontSize='small' />}
                          href={about.website}
                          label={about.website}
                        />
                      )}
                      {about.telegramHandle && (
                        <InfoLink
                          icon={<SendIcon fontSize='small' />}
                          href={`https://t.me/${encodeURIComponent(
                            about.telegramHandle.replace(/^@/, '')
                          )}`}
                          label={`@${about.telegramHandle.replace(/^@/, '')}`}
                        />
                      )}
                    </div>

                    {/* Tags */}
                    {Array.isArray(p.tags) && p.tags.length > 0 && (
                      <>
                        <div className='h-px my-5 bg-neutral-200/80' />
                        <div className='flex flex-wrap gap-2'>
                          {p.tags.slice(0, 24).map((t, i) => (
                            <span
                              key={`${String(t)}-${i}`}
                              className='text-[11px] px-3 py-1 rounded-full bg-neutral-100 text-neutral-700'
                            >
                              {String(t)}
                            </span>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Digital card */}
                    {cardSlug && (
                      <>
                        <div className='h-px my-5 bg-neutral-200/80' />
                        <a
                          href={`/profile/digitalcard/${cardSlug}`}
                          className='inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#7b39e8] to-[#2d69ea] hover:opacity-95 active:opacity-90 shadow-sm'
                        >
                          View Digital Name Card
                        </a>
                      </>
                    )}
                  </div>
                </MagicBorder>

                {/* Short Bio */}
                {(about.shortBio || p.description) && (
                  <MagicBorder radius='rounded-2xl' className='shadow-sm'>
                    <div className='rounded-2xl bg-white/70 backdrop-blur p-6'>
                      <h2 className='text-sm font-semibold tracking-wide text-neutral-600 mb-2'>
                        About
                      </h2>
                      <p className='text-[15px] leading-6 text-neutral-800 whitespace-pre-wrap'>
                        {about.shortBio || p.description}
                      </p>
                    </div>
                  </MagicBorder>
                )}
              </div>
            </aside>

            {/* ---------- Main content ---------- */}
            <div className='col-span-12 lg:col-span-8 space-y-12'>
              {/* Experience */}
              {exps.length > 0 && (
                <section>
                  <h2 className='text-sm font-semibold tracking-wide text-neutral-600 mb-4'>
                    Experience
                  </h2>
                  <ol className='relative border-l-2 border-neutral-200 pl-4 space-y-6'>
                    {exps.map(e => (
                      <li key={e.id} className='ml-2'>
                        <div className='absolute -left-[9px] mt-1 h-4 w-4 rounded-full bg-gradient-to-r from-[#7b39e8] to-[#2d69ea]' />
                        <div className='text-[15px]'>
                          <div className='font-semibold'>
                            {e.role} {!!e.company && <>@ {e.company}</>}
                          </div>
                          <div className='text-neutral-600'>
                            {e.location && <>{e.location} · </>}
                            {dateRange(e.startDate, e.endDate, e.current)}
                          </div>
                          {e.summary && (
                            <p className='mt-1 whitespace-pre-wrap text-neutral-800'>
                              {e.summary}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* ===== Top-level Video Links ===== */}
              {topVideos.length > 0 && (
                <section>
                  <h2 className='text-sm font-semibold tracking-wide text-neutral-600 mb-4'>
                    Featured Videos
                  </h2>
                  <ul className='space-y-3'>
                    {topVideos.map(v => (
                      <li key={v.id} className='flex items-start gap-2'>
                        <PlayArrowIcon fontSize='small' className='mt-[2px]' />
                        <div className='min-w-0'>
                          <a
                            href={v.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-[15px] font-medium hover:underline'
                          >
                            {v.platform}: {v.url}
                          </a>
                          {v.description && (
                            <p className='text-sm text-neutral-700'>
                              {v.description}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Projects */}
              {projects.length > 0 && (
                <section>
                  <h2 className='text-sm font-semibold tracking-wide text-neutral-600 mb-4'>
                    Projects
                  </h2>

                  {/* Responsive grid */}
                  <div className='grid sm:grid-cols-2 gap-6'>
                    {projects.map((proj, i) => {
                      const pSub: Project['subImages'] = proj.subImages ?? [];
                      const pVids: Project['videoLinks'] =
                        proj.videoLinks ?? [];
                      const pTags: string[] = Array.isArray(proj.tags)
                        ? proj.tags.map(String)
                        : [];

                      return (
                        <article key={proj.id ?? i} className='group'>
                          {proj.mainImageKey && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={urlFor(proj.mainImageKey) ?? ''}
                              alt=''
                              className='w-full aspect-[16/10] object-cover rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-[1.02]'
                            />
                          )}

                          <h3 className='mt-3 text-base font-semibold'>
                            {proj.title}
                          </h3>

                          {pTags.length > 0 && (
                            <div className='mt-1 flex flex-wrap gap-2'>
                              {pTags.slice(0, 12).map((t, idx) => (
                                <span
                                  key={`${t}-${idx}`}
                                  className='text-[11px] px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700'
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}

                          {proj.description && (
                            <p className='mt-1 text-[15px] text-neutral-800'>
                              {proj.description}
                            </p>
                          )}

                          {pSub.length > 0 && (
                            <div className='mt-3 grid grid-cols-3 gap-2'>
                              {pSub.slice(0, 3).map((img, idx2) => (
                                <div
                                  key={img.id ?? idx2}
                                  className='overflow-hidden rounded-xl'
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={img.url}
                                    alt=''
                                    className='w-full h-24 object-cover transition-transform duration-300 group-hover:scale-[1.03]'
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {pVids.length > 0 && (
                            <ul className='mt-3 space-y-2'>
                              {pVids.map(v => (
                                <li
                                  key={v.id}
                                  className='flex items-start gap-2'
                                >
                                  <PlayArrowIcon
                                    fontSize='small'
                                    className='mt-[2px]'
                                  />
                                  <a
                                    href={v.url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-sm hover:underline'
                                  >
                                    {v.platform}: {v.url}
                                  </a>
                                  {v.description && (
                                    <span className='text-sm text-neutral-700'>
                                      &nbsp;— {v.description}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Gallery */}
              {subImages.length > 0 && (
                <section>
                  <h2 className='text-sm font-semibold tracking-wide text-neutral-600 mb-4'>
                    Gallery
                  </h2>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                    {subImages.map((img, idx) => (
                      <div
                        key={img.id ?? idx}
                        className='overflow-hidden rounded-2xl'
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt=''
                          className='w-full aspect-[4/3] object-cover transition-transform duration-300 hover:scale-[1.03]'
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Education */}
              {edus.length > 0 && (
                <section>
                  <h2 className='text-sm font-semibold tracking-wide text-neutral-600 mb-4'>
                    Education
                  </h2>
                  <ul className='space-y-4'>
                    {edus.map(ed => (
                      <li key={ed.id} className='text-[15px]'>
                        <div className='font-semibold'>{ed.school}</div>
                        <div className='text-neutral-700'>
                          {[ed.degree, ed.field].filter(Boolean).join(' • ')}
                          {(ed.startDate || ed.endDate) && (
                            <> · {dateRange(ed.startDate, ed.endDate, false)}</>
                          )}
                        </div>
                        {ed.summary && (
                          <p className='mt-1 whitespace-pre-wrap text-neutral-800'>
                            {ed.summary}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
}
