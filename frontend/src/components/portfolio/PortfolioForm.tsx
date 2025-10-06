// src/components/portfolio/PortfolioForm.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  useForm,
  useFieldArray,
  type UseFormRegister,
  type UseFormWatch,
  type UseFormSetValue,
  type Control
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createPortfolioSchema,
  type PortfolioFormValues,
  VIDEO_PLATFORMS
} from '@/schemas/portfolio';
import type { Portfolio } from '@/types/portfolio';
import { api } from '@/lib/api';
import ImageUploader from '@/components/uploader/ImageUploader';
import MultiImageUploader from './MultiImageUploader';

type Props = {
  mode: 'create' | 'edit';
  portfolioId?: string;
  initial?: Partial<Portfolio> | null;
};

/* ========== Small utils ========== */

// JSON-safe utility (keeps your original)
function jsonSafe<T>(input: T): T {
  const seen = new WeakSet<object>();
  const walk = (val: unknown): unknown => {
    if (val == null) return val;
    const t = typeof val;
    if (t === 'string' || t === 'number' || t === 'boolean') return val;
    if (Array.isArray(val)) return val.map(walk);
    if (t === 'object') {
      const obj = val as Record<string, unknown>;
      if (seen.has(obj)) return undefined;
      if (
        'nodeType' in obj ||
        'tagName' in obj ||
        String((obj as any)?.constructor?.name).includes('HTML')
      ) {
        return undefined;
      }
      seen.add(obj);
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        const w = walk(v);
        if (w !== undefined) out[k] = w;
      }
      return out;
    }
    return undefined;
  };
  return walk(input) as T;
}

// Safe stringify for react-hook-form errors (prevents circular JSON)
function safeStringifyErrors(err: unknown) {
  const seen = new WeakSet<object>();
  return JSON.stringify(
    err,
    (_k, v) => {
      if (v == null || typeof v !== 'object') return v;

      const ctor = (v as any)?.constructor?.name || '';
      if (
        ctor.includes('HTML') ||
        'nodeType' in (v as any) ||
        'tagName' in (v as any)
      ) {
        return undefined;
      }

      // Trim RHF error objects to the essentials
      if (
        'message' in (v as any) ||
        'type' in (v as any) ||
        'types' in (v as any)
      ) {
        const out: Record<string, unknown> = {};
        if ((v as any).message) out.message = (v as any).message;
        if ((v as any).type) out.type = (v as any).type;
        if ((v as any).types) out.types = (v as any).types;
        return out;
      }

      if (seen.has(v as object)) return undefined;
      seen.add(v as object);
      return v;
    },
    2
  );
}

/* ========== Normalizers & helpers ========== */

type SubImageForm = { key: string; url: string; sortOrder?: number };

// coerce null -> undefined for sortOrder every time we ingest server data
function mapSubImages(
  arr:
    | Array<{ key: string; url: string; sortOrder?: number | null }>
    | undefined
): SubImageForm[] {
  return (arr ?? []).map(({ key, url, sortOrder }) => ({
    key,
    url,
    sortOrder: sortOrder ?? undefined
  }));
}

// normalize null -> undefined for video descriptions
function normTopVideos(
  vs:
    | Array<{
        platform: (typeof VIDEO_PLATFORMS)[number];
        url: string;
        description?: string | null;
      }>
    | undefined
) {
  return (vs ?? []).map(v => ({
    ...v,
    description: v?.description ?? undefined
  }));
}

// normalize project arrays & nested subImages/videos
type ProjectForm = NonNullable<PortfolioFormValues['projects']>[number];
function normProjects(ps: ProjectForm[] | undefined): ProjectForm[] {
  return (ps ?? []).map(p => ({
    ...p,
    description: p?.description ?? undefined,
    subImages: mapSubImages(p?.subImages as any),
    videoLinks: normTopVideos(p?.videoLinks as any)
  }));
}

export default function PortfolioForm({ mode, portfolioId, initial }: Props) {
  const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || null;
  const buildPublicUrl = (key?: string | null) =>
    key && PUBLIC_BASE ? `${PUBLIC_BASE}/${key}` : null;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<PortfolioFormValues>({
    resolver: zodResolver(createPortfolioSchema),
    defaultValues: {
      slug: (initial as any)?.slug ?? '',
      publishStatus: (initial as any)?.publishStatus ?? 'DRAFT',

      title: initial?.title ?? '',
      description: initial?.description ?? undefined,
      mainImageKey: initial?.mainImageKey ?? undefined,
      subImages: mapSubImages(initial?.subImages as any),
      videoLinks: normTopVideos(initial?.videoLinks as any),
      tags: (initial?.tags ?? undefined) as string[] | undefined,
      projects: normProjects(initial?.projects as any),

      // NEW
      about: (initial as any)?.about ?? undefined,
      experiences: (initial as any)?.experiences ?? [],
      educations: (initial as any)?.educations ?? [],

      // for provenance when importing from a card
      prefillFromCardId: undefined
    }
  });

  useEffect(() => {
    if (initial) {
      reset({
        slug: (initial as any)?.slug ?? '',
        publishStatus: (initial as any)?.publishStatus ?? 'DRAFT',
        title: initial.title ?? '',
        description: initial.description ?? undefined,
        mainImageKey: initial.mainImageKey ?? undefined,
        subImages: mapSubImages(initial.subImages as any),
        videoLinks: normTopVideos(initial.videoLinks as any),
        tags: (initial.tags ?? undefined) as string[] | undefined,
        projects: normProjects(initial.projects as any),

        about: (initial as any)?.about ?? undefined,
        experiences: (initial as any)?.experiences ?? [],
        educations: (initial as any)?.educations ?? [],

        prefillFromCardId: undefined
      });
    }
  }, [initial, reset]);

  /* ===== Field Arrays ===== */

  const {
    fields: subImages,
    append: appendImage,
    remove: removeImage,
    swap: swapImage
  } = useFieldArray({ control, name: 'subImages' });

  const {
    fields: videos,
    append: appendVideo,
    remove: removeVideo
  } = useFieldArray({ control, name: 'videoLinks' });

  const {
    fields: projects,
    append: appendProject,
    remove: removeProject,
    swap: swapProject
  } = useFieldArray({ control, name: 'projects' });

  const {
    fields: experiences,
    append: appendExp,
    remove: removeExp
  } = useFieldArray({ control, name: 'experiences' });

  const {
    fields: educations,
    append: appendEdu,
    remove: removeEdu
  } = useFieldArray({ control, name: 'educations' });

  /* ===== New row factories ===== */
  function newVideo() {
    return { platform: 'TIKTOK' as const, url: '', description: '' };
  }
  function newProject(): ProjectForm {
    return {
      title: '',
      description: '',
      mainImageKey: undefined,
      tags: [],
      subImages: [],
      videoLinks: []
    };
  }
  function newExp() {
    return {
      company: '',
      role: '',
      location: '',
      startDate: undefined as string | undefined,
      endDate: undefined as string | undefined,
      current: false,
      summary: ''
    };
  }
  function newEdu() {
    return {
      school: '',
      degree: '',
      field: '',
      startDate: undefined as string | undefined,
      endDate: undefined as string | undefined,
      summary: ''
    };
  }

  /* ===== Upload handlers ===== */

  function onBatchUploaded(keys: string[]) {
    const rows = keys.map((key, idx) => {
      const url = buildPublicUrl(key) || '';
      return { key, url, sortOrder: (subImages.length ?? 0) + idx };
    });
    appendImage(rows);
  }

  function onBatchUploadedForProject(pIdx: number, keys: string[]) {
    const rows = keys.map((key, idx) => {
      const url = buildPublicUrl(key) || '';
      return { key, url, sortOrder: idx };
    });
    const current = (watch(`projects.${pIdx}.subImages`) ??
      []) as SubImageForm[];
    setValue(`projects.${pIdx}.subImages`, [...current, ...rows], {
      shouldDirty: true,
      shouldTouch: true
    });
  }

  // When "current" is checked, clear endDate for that exp row
  useEffect(() => {
    (experiences || []).forEach((_f, i) => {
      const curr = watch(`experiences.${i}.current` as const);
      if (curr) {
        const end = watch(`experiences.${i}.endDate` as const);
        if (end) {
          setValue(`experiences.${i}.endDate`, '', {
            shouldDirty: true,
            shouldTouch: true
          });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch('experiences')]);

  /* ===== Submit ===== */
  async function onSubmit(values: PortfolioFormValues) {
    const cleanedSub = (values.subImages ?? [])
      .map((img, idx) => ({ ...img, sortOrder: idx }))
      .filter(img => img.key && img.url);
    const cleanedVideos = (values.videoLinks ?? []).filter(v => v.url);

    const cleanedProjects =
      (values.projects ?? []).map(p => {
        const sub = (p.subImages ?? [])
          .map((img, idx) => ({ ...img, sortOrder: idx }))
          .filter(img => img.key && img.url);
        const vids = (p.videoLinks ?? []).filter(v => v.url);
        return {
          ...p,
          subImages: sub,
          videoLinks: vids,
          tags: (p.tags ?? []).filter(Boolean).slice(0, 20)
        };
      }) ?? [];

    const cleanedExps =
      (values.experiences ?? []).map(e => ({
        ...e,
        location: e.location || undefined,
        startDate: e.startDate || undefined,
        endDate: e.current ? undefined : e.endDate || undefined,
        summary: e.summary || undefined
      })) ?? [];

    const cleanedEdus =
      (values.educations ?? []).map(ed => ({
        ...ed,
        degree: ed.degree || undefined,
        field: ed.field || undefined,
        startDate: ed.startDate || undefined,
        endDate: ed.endDate || undefined,
        summary: ed.summary || undefined
      })) ?? [];

    const payload = jsonSafe<PortfolioFormValues>({
      ...values,
      subImages: cleanedSub,
      videoLinks: cleanedVideos,
      projects: cleanedProjects,
      experiences: cleanedExps,
      educations: cleanedEdus
    });

    const saved =
      mode === 'create'
        ? (await api.portfolio.create(payload as any)).data
        : (await api.portfolio.updateById(String(portfolioId), payload as any))
            .data;

    window.location.assign(`/profile/portfolios/${saved.id}`);
  }

  const setProjectMainImageKey = (idx: number, key: string) => {
    setValue(`projects.${idx}.mainImageKey`, key, {
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const currentSlug = watch('slug') || (initial as any)?.slug || '';

  /* ===== Prefill from card ===== */
  const [cards, setCards] = useState<
    Array<{ id: string; appName: string; firstName: string; lastName: string }>
  >([]);
  const [prefillCardId, setPrefillCardId] = useState<string>('');

  useEffect(() => {
    api.card
      .listMine()
      .then(r => {
        const cs = (r.data ?? []).map(c => ({
          id: (c as any).id,
          appName: (c as any).appName,
          firstName: (c as any).firstName,
          lastName: (c as any).lastName
        }));
        setCards(cs);
        if (cs[0]) setPrefillCardId(cs[0].id);
      })
      .catch(() => {});
  }, []);

  async function handlePrefill() {
    if (!prefillCardId) return;
    const { data } = await api.portfolio.prefillFromCard(prefillCardId);

    // set hidden field so backend can snapshot provenance
    setValue('prefillFromCardId', prefillCardId, {
      shouldDirty: true,
      shouldTouch: true
    });

    // merge into form (don’t touch images/projects etc.)
    reset(
      {
        ...watch(), // keep current fields
        title: data.title ?? watch('title'),
        description: data.description ?? watch('description'),
        about: {
          ...watch('about'),
          ...data.about
        },
        prefillFromCardId: prefillCardId
      },
      { keepDirty: true, keepTouched: true }
    );
  }

  /* ===== Render ===== */
  return (
    <form className='space-y-8' onSubmit={handleSubmit(onSubmit)}>
      {/* hidden field to persist the prefill source */}
      <input type='hidden' {...register('prefillFromCardId')} />

      {/* ===== Top-level portfolio fields ===== */}
      <section className='space-y-6'>
        {/* Slug + Publish + Prefill */}
        <div className='grid md:grid-cols-3 gap-4'>
          <div className='md:col-span-1'>
            <label className='block text-sm font-medium'>Slug</label>
            <input
              className='mt-1 w-full rounded border px-3 py-2'
              placeholder='my-portfolio'
              {...register('slug')}
            />
            <p className='text-xs text-neutral-600 mt-1'>
              Lowercase, numbers, hyphens only.{' '}
              {!!currentSlug && (
                <>
                  Public:{' '}
                  <a
                    className='underline'
                    href={`/portfolio/${encodeURIComponent(currentSlug)}`}
                    target='_blank'
                  >
                    /portfolio/{currentSlug}
                  </a>
                </>
              )}
            </p>
            {errors.slug && (
              <p className='text-sm text-red-600 mt-1'>
                {String(errors.slug.message)}
              </p>
            )}
          </div>

          <div className='md:col-span-1'>
            <label className='block text-sm font-medium'>Publish status</label>
            <select
              className='mt-1 w-full rounded border px-3 py-2'
              {...register('publishStatus')}
            >
              <option value='DRAFT'>Draft</option>
              <option value='PRIVATE'>Private</option>
              <option value='PUBLISHED'>Published</option>
            </select>
          </div>

          <div className='md:col-span-1'>
            <label className='block text-sm font-medium'>
              Prefill from card
            </label>
            <div className='flex gap-2 mt-1'>
              <select
                className='w-full rounded border px-3 py-2'
                value={prefillCardId}
                onChange={e => setPrefillCardId(e.target.value)}
              >
                {cards.length === 0 && <option value=''>No cards</option>}
                {cards.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.appName || `${c.firstName} ${c.lastName}`}
                  </option>
                ))}
              </select>
              <button
                type='button'
                className='rounded border px-3 py-2 text-sm'
                onClick={handlePrefill}
                disabled={!prefillCardId}
                title='Import title/description/about from this card'
              >
                Import
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium'>Title</label>
          <input
            className='mt-1 w-full rounded border px-3 py-2'
            placeholder='Portfolio title'
            {...register('title')}
          />
          {errors.title && (
            <p className='text-sm text-red-600 mt-1'>
              {errors.title.message as any}
            </p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium'>Description</label>
          <textarea
            className='mt-1 w-full rounded border px-3 py-2'
            rows={4}
            placeholder='Short overview'
            {...register('description')}
          />
          {errors.description && (
            <p className='text-sm text-red-600 mt-1'>
              {String(errors.description.message)}
            </p>
          )}
        </div>

        {/* === About (from card or manual) === */}
        <div className='rounded-lg border p-4 space-y-4'>
          <h3 className='font-semibold'>About</h3>

          {/* Avatar & Banner uploaders */}
          <div className='grid md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium'>Avatar</label>
              <ImageUploader
                label='Avatar'
                category='portfolio'
                purpose='avatar'
                existingKey={watch('about.avatarKey') ?? null}
                previewUrl={
                  watch('about.avatarKey')
                    ? buildPublicUrl(watch('about.avatarKey')) ?? undefined
                    : undefined
                }
                onUploadedAction={k =>
                  setValue('about.avatarKey', k, {
                    shouldDirty: true,
                    shouldTouch: true
                  })
                }
              />
              <input type='hidden' {...register('about.avatarKey')} />
            </div>

            <div>
              <label className='block text-sm font-medium'>Banner</label>
              <ImageUploader
                label='Banner'
                category='portfolio'
                purpose='banner'
                existingKey={watch('about.bannerKey') ?? null}
                previewUrl={
                  watch('about.bannerKey')
                    ? buildPublicUrl(watch('about.bannerKey')) ?? undefined
                    : undefined
                }
                onUploadedAction={k =>
                  setValue('about.bannerKey', k, {
                    shouldDirty: true,
                    shouldTouch: true
                  })
                }
              />
              <input type='hidden' {...register('about.bannerKey')} />
            </div>
          </div>

          <div className='grid md:grid-cols-2 gap-3'>
            <div>
              <label className='block text-sm'>First name</label>
              <input
                className='w-full rounded border px-3 py-2 mt-1'
                {...register('about.firstName')}
              />
            </div>
            <div>
              <label className='block text-sm'>Last name</label>
              <input
                className='w-full rounded border px-3 py-2 mt-1'
                {...register('about.lastName')}
              />
            </div>
            <div>
              <label className='block text-sm'>Role</label>
              <input
                className='w-full rounded border px-3 py-2 mt-1'
                {...register('about.role')}
              />
            </div>
            <div>
              <label className='block text-sm'>Country</label>
              <input
                className='w-full rounded border px-3 py-2 mt-1'
                {...register('about.country')}
              />
            </div>
            <div className='md:col-span-2'>
              <label className='block text-sm'>Short bio</label>
              <textarea
                className='w-full rounded border px-3 py-2 mt-1'
                rows={3}
                {...register('about.shortBio')}
              />
            </div>
            <div>
              <label className='block text-sm'>Company</label>
              <input
                className='w-full rounded border px-3 py-2 mt-1'
                {...register('about.company')}
              />
            </div>
            <div>
              <label className='block text-sm'>University</label>
              <input
                className='w-full rounded border px-3 py-2 mt-1'
                {...register('about.university')}
              />
            </div>
          </div>
        </div>

        {/* Main image */}
        <div>
          <label className='block text-sm font-medium'>Main Image</label>
          <ImageUploader
            label='Main Image'
            category='portfolio'
            purpose='cover'
            existingKey={watch('mainImageKey') ?? null}
            previewUrl={
              watch('mainImageKey')
                ? buildPublicUrl(watch('mainImageKey')) ?? undefined
                : undefined
            }
            onUploadedAction={k =>
              setValue('mainImageKey', k, {
                shouldDirty: true,
                shouldTouch: true
              })
            }
          />
          {errors.mainImageKey && (
            <p className='text-sm text-red-600 mt-1'>
              {String(errors.mainImageKey.message)}
            </p>
          )}
        </div>

        {/* Sub images */}
        <div>
          <div className='flex items-center justify-between'>
            <label className='block text-sm font-medium'>
              Sub Images (max 12)
            </label>
            {(subImages?.length ?? 0) < 12 && (
              <button
                type='button'
                className='text-sm underline'
                onClick={() => appendImage({ key: '', url: '' })}
              >
                Add one
              </button>
            )}
          </div>

          <div className='mt-2'>
            <MultiImageUploader
              label='Upload multiple sub images'
              category='portfolio'
              onUploadedKeys={onBatchUploaded}
              accept='image/*'
              maxFiles={12 - subImages.length}
            />
          </div>

          <div className='mt-3 grid grid-cols-1 gap-3 md:grid-cols-2'>
            {subImages.map((f, idx) => {
              const currentKey = watch(`subImages.${idx}.key`);
              const currentUrl = watch(`subImages.${idx}.url`);
              const previewUrl = currentKey
                ? buildPublicUrl(currentKey) ?? undefined
                : currentUrl || undefined;

              return (
                <div key={f.id ?? idx} className='rounded border p-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>
                      Image #{idx + 1}
                    </span>
                    <div className='space-x-2'>
                      <button
                        type='button'
                        className='text-xs underline'
                        onClick={() => removeImage(idx)}
                      >
                        Remove
                      </button>
                      {idx > 0 && (
                        <button
                          type='button'
                          className='text-xs underline'
                          onClick={() => swapImage(idx, idx - 1)}
                        >
                          Up
                        </button>
                      )}
                      {idx < subImages.length - 1 && (
                        <button
                          type='button'
                          className='text-xs underline'
                          onClick={() => swapImage(idx, idx + 1)}
                        >
                          Down
                        </button>
                      )}
                    </div>
                  </div>

                  <div className='mt-2'>
                    <ImageUploader
                      label={`Replace sub image #${idx + 1}`}
                      category='portfolio'
                      purpose='media'
                      existingKey={currentKey || null}
                      previewUrl={previewUrl}
                      onUploadedAction={(key: string) => {
                        setValue(`subImages.${idx}.key`, key, {
                          shouldDirty: true,
                          shouldTouch: true
                        });
                        const url = buildPublicUrl(key);
                        if (url) {
                          setValue(`subImages.${idx}.url`, url, {
                            shouldDirty: true,
                            shouldTouch: true
                          });
                        }
                      }}
                    />
                    <input
                      type='hidden'
                      {...register(`subImages.${idx}.key` as const)}
                    />
                    <input
                      type='hidden'
                      {...register(`subImages.${idx}.url` as const)}
                    />
                  </div>

                  {errors.subImages?.[idx] && (
                    <p className='text-xs text-red-600 mt-2'>
                      Invalid image:{' '}
                      {safeStringifyErrors(errors.subImages[idx])}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Video links */}
        <div>
          <label className='block text-sm font-medium'>Video Links</label>
          <div className='space-y-3 mt-2'>
            {videos.map((f, idx) => (
              <div key={f.id ?? idx} className='rounded border p-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Video #{idx + 1}</span>
                  <button
                    type='button'
                    className='text-xs underline'
                    onClick={() => removeVideo(idx)}
                  >
                    Remove
                  </button>
                </div>
                <div className='mt-2 grid grid-cols-1 md:grid-cols-5 gap-2'>
                  <div>
                    <label className='block text-xs'>Platform</label>
                    <select
                      className='w-full rounded border px-2 py-1'
                      {...register(`videoLinks.${idx}.platform` as const)}
                    >
                      {VIDEO_PLATFORMS.map(p => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='md:col-span-2'>
                    <label className='block text-xs'>URL</label>
                    <input
                      className='w-full rounded border px-2 py-1'
                      placeholder='https://...'
                      {...register(`videoLinks.${idx}.url` as const)}
                    />
                  </div>
                  <div className='md:col-span-2'>
                    <label className='block text-xs'>Caption</label>
                    <input
                      className='w-full rounded border px-2 py-1'
                      placeholder='Short description'
                      {...register(`videoLinks.${idx}.description` as const)}
                    />
                  </div>
                </div>
                {errors.videoLinks?.[idx] && (
                  <p className='text-xs text-red-600 mt-1'>
                    {safeStringifyErrors(errors.videoLinks[idx])}
                  </p>
                )}
              </div>
            ))}
          </div>
          <button
            type='button'
            className='mt-2 text-sm underline'
            onClick={() => appendVideo(newVideo())}
          >
            Add Video
          </button>
        </div>

        {/* Tags */}
        <div>
          <label className='block text-sm font-medium'>Tags</label>
          <TagsInput name='tags' register={register} />
          {errors.tags && (
            <p className='text-sm text-red-600 mt-1'>
              {String(errors.tags.message)}
            </p>
          )}
        </div>
      </section>

      {/* ===== Experiences ===== */}
      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Experience</h2>
          <button
            type='button'
            className='text-sm underline'
            onClick={() => appendExp(newExp())}
          >
            Add Experience
          </button>
        </div>

        {experiences.length === 0 && (
          <p className='text-sm text-gray-600'>No experience yet.</p>
        )}

        <div className='space-y-4'>
          {experiences.map((f, i) => (
            <div key={f.id ?? i} className='rounded border p-4'>
              <div className='flex justify-between items-center'>
                <h3 className='font-medium'>Experience #{i + 1}</h3>
                <button
                  type='button'
                  className='text-xs underline text-red-600'
                  onClick={() => removeExp(i)}
                >
                  Remove
                </button>
              </div>

              <div className='grid md:grid-cols-2 gap-3 mt-2'>
                <div>
                  <label className='block text-sm'>Company</label>
                  <input
                    className='w-full rounded border px-3 py-2 mt-1'
                    {...register(`experiences.${i}.company` as const)}
                  />
                </div>
                <div>
                  <label className='block text-sm'>Role</label>
                  <input
                    className='w-full rounded border px-3 py-2 mt-1'
                    {...register(`experiences.${i}.role` as const)}
                  />
                </div>
                <div>
                  <label className='block text-sm'>Location</label>
                  <input
                    className='w-full rounded border px-3 py-2 mt-1'
                    {...register(`experiences.${i}.location` as const)}
                  />
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <label className='block text-sm'>Start</label>
                    <input
                      type='date'
                      className='w-full rounded border px-3 py-2 mt-1'
                      {...register(`experiences.${i}.startDate` as const)}
                    />
                  </div>
                  <div>
                    <label className='block text-sm'>End</label>
                    <input
                      type='date'
                      className='w-full rounded border px-3 py-2 mt-1'
                      {...register(`experiences.${i}.endDate` as const)}
                    />
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    {...register(`experiences.${i}.current` as const)}
                  />
                  <span className='text-sm'>Current role</span>
                </div>
                <div className='md:col-span-2'>
                  <label className='block text-sm'>Summary</label>
                  <textarea
                    rows={3}
                    className='w-full rounded border px-3 py-2 mt-1'
                    {...register(`experiences.${i}.summary` as const)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Education ===== */}
      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Education</h2>
          <button
            type='button'
            className='text-sm underline'
            onClick={() => appendEdu(newEdu())}
          >
            Add Education
          </button>
        </div>

        {educations.length === 0 && (
          <p className='text-sm text-gray-600'>No education yet.</p>
        )}

        <div className='space-y-4'>
          {educations.map((f, i) => (
            <div key={f.id ?? i} className='rounded border p-4'>
              <div className='flex justify-between items-center'>
                <h3 className='font-medium'>Education #{i + 1}</h3>
                <button
                  type='button'
                  className='text-xs underline text-red-600'
                  onClick={() => removeEdu(i)}
                >
                  Remove
                </button>
              </div>

              <div className='grid md:grid-cols-2 gap-3 mt-2'>
                <div>
                  <label className='block text-sm'>School</label>
                  <input
                    className='w-full rounded border px-3 py-2 mt-1'
                    {...register(`educations.${i}.school` as const)}
                  />
                </div>
                <div>
                  <label className='block text-sm'>Degree</label>
                  <input
                    className='w-full rounded border px-3 py-2 mt-1'
                    {...register(`educations.${i}.degree` as const)}
                  />
                </div>
                <div>
                  <label className='block text-sm'>Field of study</label>
                  <input
                    className='w-full rounded border px-3 py-2 mt-1'
                    {...register(`educations.${i}.field` as const)}
                  />
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <label className='block text-sm'>Start</label>
                    <input
                      type='date'
                      className='w-full rounded border px-3 py-2 mt-1'
                      {...register(`educations.${i}.startDate` as const)}
                    />
                  </div>
                  <div>
                    <label className='block text-sm'>End</label>
                    <input
                      type='date'
                      className='w-full rounded border px-3 py-2 mt-1'
                      {...register(`educations.${i}.endDate` as const)}
                    />
                  </div>
                </div>
                <div className='md:col-span-2'>
                  <label className='block text-sm'>Summary</label>
                  <textarea
                    rows={3}
                    className='w-full rounded border px-3 py-2 mt-1'
                    {...register(`educations.${i}.summary` as const)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Projects ===== */}
      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Projects</h2>
          <button
            type='button'
            className='text-sm underline'
            onClick={() => appendProject(newProject())}
          >
            Add Project
          </button>
        </div>

        {projects.length === 0 && (
          <p className='text-sm text-gray-600'>
            No projects yet. Click “Add Project” to start listing your work.
          </p>
        )}

        <div className='space-y-4'>
          {projects.map((p, pIdx) => {
            const mainKey = watch(`projects.${pIdx}.mainImageKey`);
            return (
              <div key={p.id ?? pIdx} className='rounded-lg border p-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='font-medium'>Project #{pIdx + 1}</h3>
                  <div className='space-x-2'>
                    {pIdx > 0 && (
                      <button
                        type='button'
                        className='text-xs underline'
                        onClick={() => swapProject(pIdx, pIdx - 1)}
                      >
                        Up
                      </button>
                    )}
                    {pIdx < projects.length - 1 && (
                      <button
                        type='button'
                        className='text-xs underline'
                        onClick={() => swapProject(pIdx, pIdx + 1)}
                      >
                        Down
                      </button>
                    )}
                    <button
                      type='button'
                      className='text-xs underline text-red-600'
                      onClick={() => removeProject(pIdx)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className='mt-3 grid grid-cols-1 gap-3 md:grid-cols-2'>
                  <div>
                    <label className='block text-sm font-medium'>Title</label>
                    <input
                      className='mt-1 w-full rounded border px-3 py-2'
                      placeholder='Project title'
                      {...register(`projects.${pIdx}.title` as const)}
                    />
                    {errors.projects?.[pIdx]?.title && (
                      <p className='text-xs text-red-600 mt-1'>
                        {String(errors.projects[pIdx]?.title?.message)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium'>
                      Main Image
                    </label>
                    <ImageUploader
                      label='Project main image'
                      category='portfolio'
                      purpose='media'
                      existingKey={mainKey ?? null}
                      previewUrl={
                        mainKey
                          ? buildPublicUrl(mainKey) ?? undefined
                          : undefined
                      }
                      onUploadedAction={(key: string) =>
                        setProjectMainImageKey(pIdx, key)
                      }
                    />
                    <input
                      type='hidden'
                      {...register(`projects.${pIdx}.mainImageKey` as const)}
                    />
                  </div>
                </div>

                <div className='mt-3'>
                  <label className='block text-sm font-medium'>
                    Description
                  </label>
                  <textarea
                    className='mt-1 w-full rounded border px-3 py-2'
                    rows={3}
                    placeholder='What did you build? What was your role?'
                    {...register(`projects.${pIdx}.description` as const)}
                  />
                </div>

                <div className='mt-3'>
                  <label className='block text-sm font-medium'>
                    Project Tags
                  </label>
                  <TagsInput
                    name={`projects.${pIdx}.tags`}
                    register={register}
                  />
                </div>

                <ProjectImages
                  pIdx={pIdx}
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  onBatchUploadedForProject={onBatchUploadedForProject}
                />

                <ProjectVideos
                  pIdx={pIdx}
                  register={register}
                  control={control}
                />
              </div>
            );
          })}
        </div>
      </section>

      <div className='pt-4'>
        <button
          type='submit'
          disabled={isSubmitting}
          className='rounded bg-black px-4 py-2 text-white disabled:opacity-60'
        >
          {mode === 'create' ? 'Create Portfolio' : 'Save Changes'}
        </button>
      </div>

      {Object.keys(errors).length > 0 && (
        <pre className='mt-4 text-xs text-red-700 bg-red-50 p-2 rounded'>
          {safeStringifyErrors(errors)}
        </pre>
      )}
    </form>
  );
}

/* ========== Child components ========== */

function TagsInput({
  name,
  register
}: {
  name: string;
  register: UseFormRegister<PortfolioFormValues>;
}) {
  return (
    <input
      className='mt-1 w-full rounded border px-3 py-2'
      placeholder='e.g. UGC, Beverage, Ramadan'
      {...register(name as any, {
        setValueAs: (v: unknown) => {
          if (v && typeof v === 'object' && 'target' in (v as any)) {
            v = (v as any).target?.value;
          }
          if (Array.isArray(v)) return v as string[];
          if (typeof v === 'string') {
            return v
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
              .slice(0, 20);
          }
          return undefined;
        }
      })}
    />
  );
}

type ProjectImagesProps = {
  pIdx: number;
  register: UseFormRegister<PortfolioFormValues>;
  watch: UseFormWatch<PortfolioFormValues>;
  setValue: UseFormSetValue<PortfolioFormValues>;
  onBatchUploadedForProject: (pIdx: number, keys: string[]) => void;
};

function ProjectImages({
  pIdx,
  register,
  watch,
  setValue,
  onBatchUploadedForProject
}: ProjectImagesProps) {
  const fields = (watch(`projects.${pIdx}.subImages`) ?? []) as SubImageForm[];
  const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || null;
  const buildPublicUrl = (key?: string | null) =>
    key && PUBLIC_BASE ? `${PUBLIC_BASE}/${key}` : null;

  const canAddMore = (fields?.length ?? 0) < 12;

  return (
    <div className='mt-4'>
      <div className='flex items-center justify-between'>
        <label className='block text-sm font-medium'>
          Project Images (max 12)
        </label>
        {canAddMore && (
          <button
            type='button'
            className='text-sm underline'
            onClick={() => {
              const next = [...fields, { key: '', url: '' } as SubImageForm];
              setValue(`projects.${pIdx}.subImages`, next, {
                shouldDirty: true,
                shouldTouch: true
              });
            }}
          >
            Add one
          </button>
        )}
      </div>

      <div className='mt-2'>
        <MultiImageUploader
          label='Upload multiple project images'
          category='portfolio'
          onUploadedKeys={(keys: string[]) =>
            onBatchUploadedForProject(pIdx, keys)
          }
          accept='image/*'
          maxFiles={12 - (fields?.length ?? 0)}
        />
      </div>

      <div className='mt-3 grid grid-cols-1 gap-3 md:grid-cols-2'>
        {(fields ?? []).map((_item, idx: number) => {
          const key = watch(`projects.${pIdx}.subImages.${idx}.key`);
          const url = watch(`projects.${pIdx}.subImages.${idx}.url`);
          const previewUrl = key
            ? buildPublicUrl(key) ?? undefined
            : url || undefined;

          return (
            <div key={idx} className='rounded border p-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Image #{idx + 1}</span>
                <button
                  type='button'
                  className='text-xs underline'
                  onClick={() => {
                    const cur = (watch(`projects.${pIdx}.subImages`) ??
                      []) as SubImageForm[];
                    const next = [...cur.slice(0, idx), ...cur.slice(idx + 1)];
                    setValue(`projects.${pIdx}.subImages`, next, {
                      shouldDirty: true,
                      shouldTouch: true
                    });
                  }}
                >
                  Remove
                </button>
              </div>

              <div className='mt-2'>
                <ImageUploader
                  label={`Replace project image #${idx + 1}`}
                  category='portfolio'
                  purpose='media'
                  existingKey={key || null}
                  previewUrl={previewUrl}
                  onUploadedAction={(newKey: string) => {
                    setValue(`projects.${pIdx}.subImages.${idx}.key`, newKey, {
                      shouldDirty: true,
                      shouldTouch: true
                    });
                    const newUrl = buildPublicUrl(newKey);
                    if (newUrl) {
                      setValue(
                        `projects.${pIdx}.subImages.${idx}.url`,
                        newUrl,
                        { shouldDirty: true, shouldTouch: true }
                      );
                    }
                  }}
                />
                <input
                  type='hidden'
                  {...register(
                    `projects.${pIdx}.subImages.${idx}.key` as const
                  )}
                />
                <input
                  type='hidden'
                  {...register(
                    `projects.${pIdx}.subImages.${idx}.url` as const
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ProjectVideosProps = {
  pIdx: number;
  register: UseFormRegister<PortfolioFormValues>;
  control: Control<PortfolioFormValues>;
};

function ProjectVideos({ pIdx, register, control }: ProjectVideosProps) {
  const nameBase = `projects.${pIdx}.videoLinks` as const;
  const { fields, append, remove } = useFieldArray({ control, name: nameBase });

  return (
    <div className='mt-4'>
      <label className='block text-sm font-medium'>Project Video Links</label>
      <div className='space-y-3 mt-2'>
        {fields.map((f, idx) => (
          <div key={f.id ?? idx} className='rounded border p-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Video #{idx + 1}</span>
              <button
                type='button'
                className='text-xs underline'
                onClick={() => remove(idx)}
              >
                Remove
              </button>
            </div>
            <div className='mt-2 grid grid-cols-1 md:grid-cols-5 gap-2'>
              <div>
                <label className='block text-xs'>Platform</label>
                <select
                  className='w-full rounded border px-2 py-1'
                  {...register(`${nameBase}.${idx}.platform` as const)}
                >
                  {VIDEO_PLATFORMS.map((p: string) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className='md:col-span-2'>
                <label className='block text-xs'>URL</label>
                <input
                  className='w-full rounded border px-2 py-1'
                  placeholder='https://...'
                  {...register(`${nameBase}.${idx}.url` as const)}
                />
              </div>
              <div className='md:col-span-2'>
                <label className='block text-xs'>Caption</label>
                <input
                  className='w-full rounded border px-2 py-1'
                  placeholder='Short description'
                  {...register(`${nameBase}.${idx}.description` as const)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type='button'
        className='mt-2 text-sm underline'
        onClick={() => append({ platform: 'TIKTOK', url: '', description: '' })}
      >
        Add Video
      </button>
    </div>
  );
}
