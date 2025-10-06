// src/components/portfolio/PortfolioForm.tsx
'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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

// JSON-safe utility
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

// normalize null -> undefined for descriptions
function normTopVideos(vs: Array<{ description?: string | null }> | undefined) {
  return (vs ?? []).map(v => ({
    ...v,
    description: v?.description ?? undefined
  }));
}
function normProjects(ps: any[] | undefined) {
  return (ps ?? []).map(p => ({
    ...p,
    description: p?.description ?? undefined,
    videoLinks: normTopVideos(p?.videoLinks)
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
      // NEW: slug / publishStatus are now supported by the server
      slug: (initial as any)?.slug ?? '',
      publishStatus: (initial as any)?.publishStatus ?? 'DRAFT',

      title: initial?.title ?? '',
      description: initial?.description ?? undefined,
      mainImageKey: initial?.mainImageKey ?? undefined,
      subImages: initial?.subImages ?? [],
      videoLinks: normTopVideos(initial?.videoLinks),
      tags: (initial?.tags ?? undefined) as string[] | undefined,
      projects: normProjects(initial?.projects)
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
        subImages: initial.subImages ?? [],
        videoLinks: normTopVideos(initial.videoLinks),
        tags: (initial.tags ?? undefined) as string[] | undefined,
        projects: normProjects(initial.projects)
      });
    }
  }, [initial, reset]);

  // top-level sub images
  const {
    fields: subImages,
    append: appendImage,
    remove: removeImage,
    swap: swapImage
  } = useFieldArray({ control, name: 'subImages' });

  // top-level videos
  const {
    fields: videos,
    append: appendVideo,
    remove: removeVideo
  } = useFieldArray({ control, name: 'videoLinks' });

  // projects
  const {
    fields: projects,
    append: appendProject,
    remove: removeProject,
    swap: swapProject
  } = useFieldArray({ control, name: 'projects' });

  function newVideo() {
    return { platform: 'TIKTOK' as const, url: '', description: '' };
  }
  function newProject() {
    return {
      title: '',
      description: '',
      mainImageKey: undefined as string | undefined,
      tags: [] as string[],
      subImages: [] as { key: string; url: string; sortOrder?: number }[],
      videoLinks: [] as {
        platform: (typeof VIDEO_PLATFORMS)[number];
        url: string;
        description?: string;
      }[]
    };
  }

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
    const current = (watch(`projects.${pIdx}.subImages`) ?? []) as {
      key: string;
      url: string;
      sortOrder?: number;
    }[];
    setValue(`projects.${pIdx}.subImages`, [...current, ...rows], {
      shouldDirty: true,
      shouldTouch: true
    });
  }

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

    const payload = jsonSafe<PortfolioFormValues>({
      ...values,
      subImages: cleanedSub,
      videoLinks: cleanedVideos,
      projects: cleanedProjects
    });

    const saved =
      mode === 'create'
        ? (await api.portfolio.create(payload)).data
        : (await api.portfolio.updateById(String(portfolioId), payload)).data;

    // Go to private detail page (you can change to list if preferred)
    window.location.assign(`/profile/portfolios/${saved.id}`);
  }

  const canAddMoreImages = (subImages?.length ?? 0) < 12;
  const canAddMoreProjects = (projects?.length ?? 0) < 20;

  const setMainImageKey = (key: string) => {
    setValue('mainImageKey', key, { shouldDirty: true, shouldTouch: true });
  };
  const setProjectMainImageKey = (idx: number, key: string) => {
    setValue(`projects.${idx}.mainImageKey`, key, {
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const currentSlug = watch('slug') || (initial as any)?.slug || '';

  return (
    <form className='space-y-8' onSubmit={handleSubmit(onSubmit)}>
      {/* ===== Top-level portfolio fields ===== */}
      <section className='space-y-6'>
        {/* Slug + Publish */}
        <div className='grid md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium'>Slug</label>
            <input
              className='mt-1 w-full rounded border px-3 py-2'
              placeholder='my-portfolio'
              {...register('slug')}
            />
            <p className='text-xs text-neutral-600 mt-1'>
              Lowercase, numbers, hyphens only.
              {!!currentSlug && (
                <>
                  {' '}
                  Public URL:{' '}
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
          <div>
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
        </div>

        <div>
          <label className='block text-sm font-medium'>Title</label>
          <input
            className='mt-1 w-full rounded border px-3 py-2'
            placeholder='Portfolio title'
            {...register('title')}
          />
          {errors.title && (
            <p className='text-sm text-red-600 mt-1'>{errors.title.message}</p>
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
            onUploadedAction={setMainImageKey}
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
            {canAddMoreImages && (
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
                      Invalid image: {JSON.stringify(errors.subImages[idx])}
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
                    {JSON.stringify(errors.videoLinks[idx])}
                  </p>
                )}
              </div>
            ))}
          </div>
          <button
            type='button'
            className='mt-2 text-sm underline'
            onClick={() =>
              appendVideo({ platform: 'TIKTOK', url: '', description: '' })
            }
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

      {/* ===== Projects ===== */}
      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Projects</h2>
          {canAddMoreProjects && (
            <button
              type='button'
              className='text-sm underline'
              onClick={() => appendProject(newProject())}
            >
              Add Project
            </button>
          )}
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
                    // @ts-expect-error reuse component signature
                    name={`projects.${pIdx}.tags`}
                    register={register as any}
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
          {JSON.stringify(errors, null, 2)}
        </pre>
      )}
    </form>
  );
}

function TagsInput({
  name,
  register
}: {
  name: any; // 'tags' or `projects.${idx}.tags`
  register: ReturnType<typeof useForm<PortfolioFormValues>>['register'];
}) {
  return (
    <input
      className='mt-1 w-full rounded border px-3 py-2'
      placeholder='e.g. UGC, Beverage, Ramadan'
      {...register(name, {
        setValueAs: (v: unknown) => {
          if (v && typeof v === 'object' && 'target' in (v as any)) {
            v = (v as any).target?.value;
          }
          if (Array.isArray(v)) return v;
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
  register: ReturnType<typeof useForm<PortfolioFormValues>>['register'];
  watch: ReturnType<typeof useForm<PortfolioFormValues>>['watch'];
  setValue: ReturnType<typeof useForm<PortfolioFormValues>>['setValue'];
  onBatchUploadedForProject: (pIdx: number, keys: string[]) => void;
};

function ProjectImages({
  pIdx,
  register,
  watch,
  setValue,
  onBatchUploadedForProject
}: ProjectImagesProps) {
  const fields = (watch(`projects.${pIdx}.subImages`) ?? []) as {
    key: string;
    url: string;
    sortOrder?: number;
  }[];
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
              const next = [...fields, { key: '', url: '' }];
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
        {(fields ?? []).map((_, idx: number) => {
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
                    const cur = (watch(`projects.${pIdx}.subImages`) ?? []) as {
                      key: string;
                      url: string;
                      sortOrder?: number;
                    }[];
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
  register: ReturnType<typeof useForm<PortfolioFormValues>>['register'];
  control: ReturnType<typeof useForm<PortfolioFormValues>>['control'];
};

function ProjectVideos({ pIdx, register, control }: ProjectVideosProps) {
  const nameBase = `projects.${pIdx}.videoLinks` as const;
  return (
    <div className='mt-4'>
      <label className='block text-sm font-medium'>Project Video Links</label>
      <ProjectVideoList
        pIdx={pIdx}
        nameBase={nameBase}
        register={register}
        control={control}
      />
    </div>
  );
}

type ProjectVideoListProps = {
  pIdx: number;
  nameBase: `projects.${number}.videoLinks`;
  register: ReturnType<typeof useForm<PortfolioFormValues>>['register'];
  control: ReturnType<typeof useForm<PortfolioFormValues>>['control'];
};

function ProjectVideoList({
  pIdx,
  nameBase,
  register,
  control
}: ProjectVideoListProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: nameBase
  });

  return (
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
