// src/components/portfolio/PortfolioForm.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  useForm,
  useFieldArray,
  type UseFormRegister,
  type UseFormWatch,
  type UseFormSetValue,
  type Control,
  type FieldErrors,
  type Resolver,
  FieldPath
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
import { useFlash } from '@/components/ui/useFlash';

/* ---------- Props ---------- */
type Props = {
  mode: 'create' | 'edit';
  portfolioId?: string;
  initial?: Partial<Portfolio> | null;
};

/* ---------- Strong subtypes to avoid any ---------- */
type SubImageForm = { key: string; url: string; sortOrder?: number };
type ProjectForm = NonNullable<PortfolioFormValues['projects']>[number];
type VideoLinkForm = NonNullable<PortfolioFormValues['videoLinks']>[number];
type ExperienceForm = NonNullable<PortfolioFormValues['experiences']>[number];
type EducationForm = NonNullable<PortfolioFormValues['educations']>[number];
type AboutForm = PortfolioFormValues['about'];

/* ---------- UI tokens ---------- */
const inputBase =
  'w-full card-surface rounded-xl border px-3 py-2 text-[15px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent';
const inputOk = inputBase + ' border-token';
const inputErr =
  inputBase +
  ' border-red-500 ring-1 ring-red-300 focus:ring-red-400 focus:border-red-500';

const textareaOk = inputOk + ' align-top';
const textareaErr = inputErr + ' align-top';
const selectOk = inputOk;
const selectErr = inputErr;

const labelCls = 'text-sm font-medium';
const sublabelCls = 'muted text-xs';
const sectionCardCls =
  'rounded-2xl border border-token bg-white/70 p-4 md:p-5 shadow-[0_1px_2px_rgba(10,10,15,0.06),_0_12px_24px_rgba(10,10,15,0.06)]';

const btnBase =
  'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition';
const btnPrimary =
  btnBase +
  ' text-white bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] hover:brightness-110 active:brightness-95 shadow-[0_8px_24px_rgba(77,56,209,0.35)] disabled:opacity-60';
const btnOutline =
  btnBase +
  ' border border-token bg-white/70 hover:bg-white text-[var(--color-dark)]';
const btnLink = 'text-sm underline';

/* ===== helpers ===== */
function firstErrorMessage(
  errs: FieldErrors<PortfolioFormValues>
): string | null {
  const scan = (node: unknown): string | null => {
    if (!node) return null;
    if (typeof node === 'object') {
      const rec = node as Record<string, unknown>;
      if (typeof rec.message === 'string') return rec.message;
      if (Array.isArray(node)) {
        for (const n of node) {
          const r = scan(n);
          if (r) return r;
        }
      } else {
        for (const v of Object.values(rec)) {
          const r = scan(v);
          if (r) return r;
        }
      }
    }
    return null;
  };
  return scan(errs);
}

/** Find first invalid field path to focus */
function firstErrorPath(
  errs: FieldErrors<PortfolioFormValues>,
  prefix: string[] = []
): FieldPath<PortfolioFormValues> | null {
  for (const [k, v] of Object.entries(errs)) {
    if (!v) continue;
    const path = [...prefix, k];
    if (typeof v === 'object' && v && 'message' in v) {
      return path.join('.') as FieldPath<PortfolioFormValues>;
    }
    if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) {
        const inner = v[i] as FieldErrors<PortfolioFormValues>;
        const found = firstErrorPath(inner, [...path, String(i)]);
        if (found) return found;
      }
    } else if (typeof v === 'object' && v) {
      const found = firstErrorPath(v as FieldErrors<PortfolioFormValues>, path);
      if (found) return found;
    }
  }
  return null;
}

// Safe stringify for RHF errors (for debug blocks)
function safeStringifyErrors(err: unknown) {
  const seen = new WeakSet<object>();
  return JSON.stringify(
    err,
    (_k, v: unknown) => {
      if (v == null || typeof v !== 'object') return v;
      const maybeObj = v as Record<string, unknown>;

      if ('message' in maybeObj || 'type' in maybeObj || 'types' in maybeObj) {
        const out: Record<string, unknown> = {};
        if (typeof maybeObj.message === 'string')
          out.message = maybeObj.message;
        if (typeof maybeObj.type === 'string') out.type = maybeObj.type;
        if (typeof maybeObj.types === 'object') out.types = maybeObj.types;
        return out;
      }

      if (seen.has(maybeObj)) return undefined;
      seen.add(maybeObj);
      return v;
    },
    2
  );
}

/* ========== Normalizers ========== */
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

function normTopVideos(vs: Array<VideoLinkForm> | undefined): VideoLinkForm[] {
  return (vs ?? []).map(v => ({
    ...v,
    description: v?.description ?? undefined
  }));
}

function normProjects(ps: ProjectForm[] | undefined): ProjectForm[] {
  return (ps ?? []).map(p => ({
    ...p,
    description: p?.description ?? undefined,
    subImages: mapSubImages(
      p?.subImages as unknown as SubImageForm[] | undefined
    ),
    videoLinks: normTopVideos(
      p?.videoLinks as unknown as Array<VideoLinkForm> | undefined
    )
  }));
}

/* ========== Component ========== */
export default function PortfolioForm({ mode, portfolioId, initial }: Props) {
  const { show, node: flash } = useFlash();

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
    setValue,
    setFocus
  } = useForm<PortfolioFormValues>({
    resolver: zodResolver(
      createPortfolioSchema
    ) as Resolver<PortfolioFormValues>,
    defaultValues: {
      slug: initial?.slug ?? '',
      publishStatus: initial?.publishStatus ?? 'DRAFT',
      title: initial?.title ?? '',
      description: initial?.description ?? undefined,
      mainImageKey: initial?.mainImageKey ?? undefined,
      subImages: mapSubImages(
        initial?.subImages as
          | Array<{ key: string; url: string; sortOrder?: number | null }>
          | undefined
      ),
      videoLinks: normTopVideos(
        initial?.videoLinks as unknown as Array<VideoLinkForm> | undefined
      ),
      tags: (initial?.tags ?? undefined) as string[] | undefined,
      projects: normProjects(
        initial?.projects as unknown as ProjectForm[] | undefined
      ),
      about:
        (initial?.about as AboutForm) ?? (undefined as unknown as AboutForm),
      experiences:
        (initial?.experiences as unknown as ExperienceForm[] | undefined) ?? [],
      educations:
        (initial?.educations as unknown as EducationForm[] | undefined) ?? [],
      prefillFromCardId: undefined
    }
  });

  useEffect(() => {
    if (initial) {
      reset({
        slug: initial.slug ?? '',
        publishStatus: initial.publishStatus ?? 'DRAFT',
        title: initial.title ?? '',
        description: initial.description ?? undefined,
        mainImageKey: initial.mainImageKey ?? undefined,
        subImages: mapSubImages(
          initial.subImages as
            | Array<{ key: string; url: string; sortOrder?: number | null }>
            | undefined
        ),
        videoLinks: normTopVideos(
          initial.videoLinks as unknown as Array<VideoLinkForm> | undefined
        ),
        tags: (initial.tags ?? undefined) as string[] | undefined,
        projects: normProjects(
          initial.projects as unknown as ProjectForm[] | undefined
        ),
        about:
          (initial.about as AboutForm) ?? (undefined as unknown as AboutForm),
        experiences:
          (initial.experiences as unknown as ExperienceForm[] | undefined) ??
          [],
        educations:
          (initial.educations as unknown as EducationForm[] | undefined) ?? [],
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
  function newVideo(): VideoLinkForm {
    return { platform: 'TIKTOK', url: '', description: '' };
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
  function newExp(): ExperienceForm {
    return {
      company: '',
      role: '',
      location: '',
      startDate: undefined,
      endDate: undefined,
      current: false,
      summary: ''
    };
  }
  function newEdu(): EducationForm {
    return {
      school: '',
      degree: '',
      field: '',
      startDate: undefined,
      endDate: undefined,
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
  type CreateBody = Parameters<(typeof api)['portfolio']['create']>[0];
  type UpdateBody = Parameters<(typeof api)['portfolio']['updateById']>[1];

  async function onSubmit(values: PortfolioFormValues) {
    try {
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

      const payload: PortfolioFormValues = {
        ...values,
        subImages: cleanedSub,
        videoLinks: cleanedVideos,
        projects: cleanedProjects,
        experiences: cleanedExps,
        educations: cleanedEdus
      };

      if (mode === 'create') {
        const body = payload as CreateBody;
        const saved = (await api.portfolio.create(body)).data;
        show({ kind: 'success', title: 'Saved', message: 'Portfolio created' });
        window.location.assign(`/profile/portfolios/${saved.id}`);
      } else {
        const body = payload as UpdateBody;
        const saved = (
          await api.portfolio.updateById(String(portfolioId), body)
        ).data;
        show({ kind: 'success', title: 'Saved', message: 'Changes saved' });
        window.location.assign(`/profile/portfolios/${saved.id}`);
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : firstErrorMessage(errors) || 'Failed to save';
      show({ kind: 'error', title: 'Save failed', message: msg });
    }
  }

  /** onInvalid: flash + focus + scroll + safe log */
  function onInvalid(errs: FieldErrors<PortfolioFormValues>) {
    const msg = firstErrorMessage(errs) ?? 'Please fix the highlighted fields.';
    show({ kind: 'error', title: 'Form error', message: msg });

    const path = firstErrorPath(errs);
    if (path) {
      setFocus(path, { shouldSelect: true });
      const el = document.querySelector(
        `[name="${path}"]`
      ) as HTMLElement | null;
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    console.error('Form invalid:', safeStringifyErrors(errs));
  }

  const setProjectMainImageKey = (idx: number, key: string) => {
    setValue(`projects.${idx}.mainImageKey`, key, {
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const currentSlug = watch('slug') || initial?.slug || '';

  /* ===== Prefill from card ===== */
  const [cards, setCards] = useState<
    Array<{ id: string; appName: string; firstName: string; lastName: string }>
  >([]);
  const [prefillCardId, setPrefillCardId] = useState<string>('');

  useEffect(() => {
    api.card
      .listMine()
      .then(r => {
        const raw = (r.data ?? []) as Array<{
          id: string;
          appName: string;
          firstName: string;
          lastName: string;
        }>;
        setCards(
          raw.map(c => ({
            id: c.id,
            appName: c.appName,
            firstName: c.firstName,
            lastName: c.lastName
          }))
        );
        if (raw[0]) setPrefillCardId(raw[0].id);
      })
      .catch(() => {});
  }, []);

  async function handlePrefill() {
    if (!prefillCardId) return;
    const { data } = await api.portfolio.prefillFromCard(prefillCardId);

    setValue('prefillFromCardId', prefillCardId, {
      shouldDirty: true,
      shouldTouch: true
    });

    reset(
      {
        ...watch(),
        title: data.title ?? watch('title'),
        description: data.description ?? watch('description'),
        about: { ...watch('about'), ...data.about },
        prefillFromCardId: prefillCardId
      },
      { keepDirty: true, keepTouched: true }
    );

    show({
      kind: 'info',
      title: 'Imported',
      message: 'Prefilled from your card.'
    });
  }

  /* ===== small helper for props (no TS red lines) ===== */
  const withErrInput = (hasErr: boolean) => ({
    className: hasErr ? inputErr : inputOk,
    'aria-invalid': hasErr ? true : undefined
  });
  const withErrTextarea = (hasErr: boolean) => ({
    className: hasErr ? textareaErr : textareaOk,
    'aria-invalid': hasErr ? true : undefined
  });
  const withErrSelect = (hasErr: boolean) => ({
    className: hasErr ? selectErr : selectOk,
    'aria-invalid': hasErr ? true : undefined
  });

  /* ===== Render ===== */
  return (
    <>
      {flash}
      <form className='grid gap-6' onSubmit={handleSubmit(onSubmit, onInvalid)}>
        {/* Hidden provenance field */}
        <input type='hidden' {...register('prefillFromCardId')} />

        {/* ===== Top-level portfolio fields ===== */}
        <section className={sectionCardCls}>
          <h2 className='text-lg font-semibold mb-3'>Basics</h2>

          {/* SLUG — stand-alone single row */}
          <div className='grid gap-2 mb-4'>
            <label className={labelCls}>Slug</label>
            <input
              placeholder='my-portfolio'
              {...register('slug')}
              {...withErrInput(!!errors.slug)}
            />
            <p className={sublabelCls}>
              Lowercase, numbers, hyphens only.&nbsp;
              {!!currentSlug && (
                <>
                  Public:&nbsp;
                  <a
                    className='underline'
                    href={`/profile/portfolio/${encodeURIComponent(
                      currentSlug
                    )}`}
                    target='_blank'
                  >
                    /profile/portfolio/{currentSlug}
                  </a>
                </>
              )}
            </p>
            {errors.slug && (
              <p className='text-sm text-red-600'>
                {String(errors.slug.message)}
              </p>
            )}
          </div>

          {/* Publish + Prefill in a separate grid */}
          <div className='grid md:grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <label className={labelCls}>Publish status</label>
              <select
                {...register('publishStatus')}
                {...withErrSelect(!!errors.publishStatus)}
              >
                <option value='DRAFT'>Draft</option>
                <option value='PRIVATE'>Private</option>
                <option value='PUBLISHED'>Published</option>
              </select>
              {errors.publishStatus && (
                <p className='text-sm text-red-600'>
                  {String(errors.publishStatus.message)}
                </p>
              )}
            </div>

            <div className='grid gap-2'>
              <label className={labelCls}>Prefill from card</label>
              <div className='flex gap-2'>
                <select
                  className={selectOk}
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
                  className={btnOutline}
                  onClick={handlePrefill}
                  disabled={!prefillCardId}
                  title='Import title/description/about from this card'
                >
                  Import
                </button>
              </div>
            </div>
          </div>

          <div className='grid gap-2 mt-4'>
            <label className={labelCls}>Title</label>
            <input
              placeholder='Portfolio title'
              {...register('title')}
              {...withErrInput(!!errors.title)}
            />
            {errors.title && (
              <p className='text-sm text-red-600'>
                {String(errors.title.message)}
              </p>
            )}
          </div>

          <div className='grid gap-2 mt-4'>
            <label className={labelCls}>Description</label>
            <textarea
              rows={4}
              placeholder='Short overview'
              {...register('description')}
              {...withErrTextarea(!!errors.description)}
            />
            {errors.description && (
              <p className='text-sm text-red-600'>
                {String(errors.description.message)}
              </p>
            )}
          </div>
        </section>

        {/* === About === */}
        <section className={sectionCardCls}>
          <h2 className='text-lg font-semibold mb-3'>About</h2>

          <div className='grid md:grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <label className={labelCls}>Avatar</label>
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
              {errors.about?.avatarKey && (
                <p className='text-sm text-red-600'>
                  {String(errors.about.avatarKey.message)}
                </p>
              )}
            </div>

            <div className='grid gap-2'>
              <label className={labelCls}>Banner</label>
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
              {errors.about?.bannerKey && (
                <p className='text-sm text-red-600'>
                  {String(errors.about.bannerKey.message)}
                </p>
              )}
            </div>
          </div>

          <div className='grid md:grid-cols-2 gap-3 mt-4'>
            <div className='grid gap-1'>
              <label className={labelCls}>First name</label>
              <input
                {...register('about.firstName')}
                {...withErrInput(!!errors.about?.firstName)}
              />
              {errors.about?.firstName && (
                <p className='text-sm text-red-600'>
                  {String(errors.about.firstName.message)}
                </p>
              )}
            </div>
            <div className='grid gap-1'>
              <label className={labelCls}>Last name</label>
              <input
                {...register('about.lastName')}
                {...withErrInput(!!errors.about?.lastName)}
              />
              {errors.about?.lastName && (
                <p className='text-sm text-red-600'>
                  {String(errors.about.lastName.message)}
                </p>
              )}
            </div>
            <div className='grid gap-1'>
              <label className={labelCls}>Role</label>
              <input
                {...register('about.role')}
                {...withErrInput(!!errors.about?.role)}
              />
              {errors.about?.role && (
                <p className='text-sm text-red-600'>
                  {String(errors.about.role.message)}
                </p>
              )}
            </div>
            <div className='grid gap-1'>
              <label className={labelCls}>Country</label>
              <input
                {...register('about.country')}
                {...withErrInput(!!errors.about?.country)}
              />
              {errors.about?.country && (
                <p className='text-sm text-red-600'>
                  {String(errors.about.country.message)}
                </p>
              )}
            </div>
            <div className='md:col-span-2 grid gap-1'>
              <label className={labelCls}>Short bio</label>
              <textarea
                rows={3}
                {...register('about.shortBio')}
                {...withErrTextarea(!!errors.about?.shortBio)}
              />
              {errors.about?.shortBio && (
                <p className='text-sm text-red-600'>
                  {String(errors.about.shortBio.message)}
                </p>
              )}
            </div>
            <div className='grid gap-1'>
              <label className={labelCls}>Company</label>
              <input
                {...register('about.company')}
                {...withErrInput(!!errors.about?.company)}
              />
              {errors.about?.company && (
                <p className='text-sm text-red-600'>
                  {String(errors.about.company.message)}
                </p>
              )}
            </div>
            <div className='grid gap-1'>
              <label className={labelCls}>University</label>
              <input
                {...register('about.university')}
                {...withErrInput(!!errors.about?.university)}
              />
              {errors.about?.university && (
                <p className='text-sm text-red-600'>
                  {String(errors.about.university.message)}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Main image + Sub images */}
        <section className={sectionCardCls}>
          <h2 className='text-lg font-semibold mb-3'>Media</h2>
          <div className='grid gap-2'>
            <label className={labelCls}>Main Image</label>
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
              <p className='text-sm text-red-600'>
                {String(errors.mainImageKey.message)}
              </p>
            )}
          </div>

          {/* Sub images */}
          <div className='mt-4'>
            <div className='flex items-center justify-between'>
              <label className={labelCls}>Sub Images (max 12)</label>
              {(subImages?.length ?? 0) < 12 && (
                <button
                  type='button'
                  className={btnLink}
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
                  <div
                    key={f.id ?? idx}
                    className='rounded-2xl border border-token p-3 bg-white/70'
                  >
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium'>
                        Image #{idx + 1}
                      </span>
                      <div className='space-x-2'>
                        <button
                          type='button'
                          className={btnLink}
                          onClick={() => removeImage(idx)}
                        >
                          Remove
                        </button>
                        {idx > 0 && (
                          <button
                            type='button'
                            className={btnLink}
                            onClick={() => swapImage(idx, idx - 1)}
                          >
                            Up
                          </button>
                        )}
                        {idx < subImages.length - 1 && (
                          <button
                            type='button'
                            className={btnLink}
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
        </section>

        {/* Video links */}
        <section className={sectionCardCls}>
          <h2 className='text-lg font-semibold mb-3'>Video Links</h2>
          <div className='space-y-3'>
            {videos.map((f, idx) => (
              <div
                key={f.id ?? idx}
                className='rounded-2xl border border-token p-3 bg-white/70'
              >
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Video #{idx + 1}</span>
                  <button
                    type='button'
                    className={btnLink}
                    onClick={() => removeVideo(idx)}
                  >
                    Remove
                  </button>
                </div>
                <div className='mt-2 grid grid-cols-1 md:grid-cols-5 gap-2'>
                  <div className='grid gap-1'>
                    <label className='text-xs font-medium'>Platform</label>
                    <select
                      {...register(`videoLinks.${idx}.platform` as const)}
                      {...withErrSelect(!!errors.videoLinks?.[idx]?.platform)}
                    >
                      {VIDEO_PLATFORMS.map(p => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {errors.videoLinks?.[idx]?.platform && (
                      <p className='text-xs text-red-600 mt-1'>
                        {String(errors.videoLinks[idx]?.platform?.message)}
                      </p>
                    )}
                  </div>
                  <div className='md:col-span-2 grid gap-1'>
                    <label className='text-xs font-medium'>URL</label>
                    <input
                      placeholder='https://...'
                      {...register(`videoLinks.${idx}.url` as const)}
                      {...withErrInput(!!errors.videoLinks?.[idx]?.url)}
                    />
                    {errors.videoLinks?.[idx]?.url && (
                      <p className='text-xs text-red-600 mt-1'>
                        {String(errors.videoLinks[idx]?.url?.message)}
                      </p>
                    )}
                  </div>
                  <div className='md:col-span-2 grid gap-1'>
                    <label className='text-xs font-medium'>Caption</label>
                    <input
                      placeholder='Short description'
                      {...register(`videoLinks.${idx}.description` as const)}
                      {...withErrInput(!!errors.videoLinks?.[idx]?.description)}
                    />
                    {errors.videoLinks?.[idx]?.description && (
                      <p className='text-xs text-red-600 mt-1'>
                        {String(errors.videoLinks[idx]?.description?.message)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type='button'
            className={`${btnOutline} mt-3`}
            onClick={() => appendVideo(newVideo())}
          >
            + Add Video
          </button>
        </section>

        {/* Tags */}
        <section className={sectionCardCls}>
          <h2 className='text-lg font-semibold mb-3'>Tags</h2>
          <TagsInput
            name={'tags' as FieldPath<PortfolioFormValues>}
            register={register}
          />
          {errors.tags && (
            <p className='text-sm text-red-600 mt-1'>
              {String(errors.tags.message)}
            </p>
          )}
        </section>

        {/* ===== Experiences ===== */}
        <section className={sectionCardCls}>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold'>Experience</h2>
            <button
              type='button'
              className={btnOutline}
              onClick={() => appendExp(newExp())}
            >
              + Add Experience
            </button>
          </div>

          {experiences.length === 0 && (
            <p className='muted text-sm mt-3'>No experience yet.</p>
          )}

          <div className='space-y-4 mt-4'>
            {experiences.map((f, i) => (
              <div
                key={f.id ?? i}
                className='rounded-2xl border border-token p-4 bg-white/70'
              >
                <div className='flex justify-between items-center'>
                  <h3 className='font-medium'>Experience #{i + 1}</h3>
                  <button
                    type='button'
                    className={`${btnLink} text-red-600`}
                    onClick={() => removeExp(i)}
                  >
                    Remove
                  </button>
                </div>

                <div className='grid md:grid-cols-2 gap-3 mt-2'>
                  <div className='grid gap-1'>
                    <label className={labelCls}>Company</label>
                    <input
                      {...register(`experiences.${i}.company` as const)}
                      {...withErrInput(!!errors.experiences?.[i]?.company)}
                    />
                    {errors.experiences?.[i]?.company && (
                      <p className='text-xs text-red-600 mt-1'>
                        {String(errors.experiences[i]?.company?.message)}
                      </p>
                    )}
                  </div>
                  <div className='grid gap-1'>
                    <label className={labelCls}>Role</label>
                    <input
                      {...register(`experiences.${i}.role` as const)}
                      {...withErrInput(!!errors.experiences?.[i]?.role)}
                    />
                    {errors.experiences?.[i]?.role && (
                      <p className='text-xs text-red-600 mt-1'>
                        {String(errors.experiences[i]?.role?.message)}
                      </p>
                    )}
                  </div>
                  <div className='grid gap-1'>
                    <label className={labelCls}>Location</label>
                    <input
                      {...register(`experiences.${i}.location` as const)}
                      {...withErrInput(!!errors.experiences?.[i]?.location)}
                    />
                    {errors.experiences?.[i]?.location && (
                      <p className='text-xs text-red-600 mt-1'>
                        {String(errors.experiences[i]?.location?.message)}
                      </p>
                    )}
                  </div>
                  <div className='grid grid-cols-2 gap-2'>
                    <div className='grid gap-1'>
                      <label className={labelCls}>Start</label>
                      <input
                        type='date'
                        {...register(`experiences.${i}.startDate` as const)}
                        {...withErrInput(!!errors.experiences?.[i]?.startDate)}
                      />
                      {errors.experiences?.[i]?.startDate && (
                        <p className='text-xs text-red-600 mt-1'>
                          {String(errors.experiences[i]?.startDate?.message)}
                        </p>
                      )}
                    </div>
                    <div className='grid gap-1'>
                      <label className={labelCls}>End</label>
                      <input
                        type='date'
                        {...register(`experiences.${i}.endDate` as const)}
                        {...withErrInput(!!errors.experiences?.[i]?.endDate)}
                      />
                      {errors.experiences?.[i]?.endDate && (
                        <p className='text-xs text-red-600 mt-1'>
                          {String(errors.experiences[i]?.endDate?.message)}
                        </p>
                      )}
                    </div>
                  </div>
                  <label className='inline-flex items-center gap-2'>
                    <input
                      type='checkbox'
                      {...register(`experiences.${i}.current` as const)}
                    />
                    <span className='text-sm'>Current role</span>
                  </label>
                  <div className='md:col-span-2 grid gap-1'>
                    <label className={labelCls}>Summary</label>
                    <textarea
                      rows={3}
                      {...register(`experiences.${i}.summary` as const)}
                      {...withErrTextarea(!!errors.experiences?.[i]?.summary)}
                    />
                    {errors.experiences?.[i]?.summary && (
                      <p className='text-xs text-red-600 mt-1'>
                        {String(errors.experiences[i]?.summary?.message)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Education ===== */}
        <section className={sectionCardCls}>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold'>Education</h2>
            <button
              type='button'
              className={btnOutline}
              onClick={() => appendEdu(newEdu())}
            >
              + Add Education
            </button>
          </div>

          {educations.length === 0 && (
            <p className='muted text-sm mt-3'>No education yet.</p>
          )}

          <div className='space-y-4 mt-4'>
            {educations.map((f, i) => (
              <div
                key={f.id ?? i}
                className='rounded-2xl border border-token p-4 bg-white/70'
              >
                <div className='flex justify-between items-center'>
                  <h3 className='font-medium'>Education #{i + 1}</h3>
                  <button
                    type='button'
                    className={`${btnLink} text-red-600`}
                    onClick={() => removeEdu(i)}
                  >
                    Remove
                  </button>
                </div>

                <div className='grid md:grid-cols-2 gap-3 mt-2'>
                  <div className='grid gap-1'>
                    <label className={labelCls}>School</label>
                    <input
                      {...register(`educations.${i}.school` as const)}
                      {...withErrInput(!!errors.educations?.[i]?.school)}
                    />
                    {errors.educations?.[i]?.school && (
                      <p className='text-xs text-red-600 mt-1'>
                        {String(errors.educations[i]?.school?.message)}
                      </p>
                    )}
                  </div>
                  <div className='grid gap-1'>
                    <label className={labelCls}>Degree</label>
                    <input
                      {...register(`educations.${i}.degree` as const)}
                      {...withErrInput(!!errors.educations?.[i]?.degree)}
                    />
                    {errors.educations?.[i]?.degree && (
                      <p className='text-xs text-red-600 mt-1'>
                        {String(errors.educations[i]?.degree?.message)}
                      </p>
                    )}
                  </div>
                  <div className='grid gap-1'>
                    <label className={labelCls}>Field of study</label>
                    <input
                      {...register(`educations.${i}.field` as const)}
                      {...withErrInput(!!errors.educations?.[i]?.field)}
                    />
                    {errors.educations?.[i]?.field && (
                      <p className='text-xs text-red-600 mt-1'>
                        {String(errors.educations[i]?.field?.message)}
                      </p>
                    )}
                  </div>
                  <div className='grid grid-cols-2 gap-2'>
                    <div className='grid gap-1'>
                      <label className={labelCls}>Start</label>
                      <input
                        type='date'
                        {...register(`educations.${i}.startDate` as const)}
                        {...withErrInput(!!errors.educations?.[i]?.startDate)}
                      />
                      {errors.educations?.[i]?.startDate && (
                        <p className='text-xs text-red-600 mt-1'>
                          {String(errors.educations[i]?.startDate?.message)}
                        </p>
                      )}
                    </div>
                    <div className='grid gap-1'>
                      <label className={labelCls}>End</label>
                      <input
                        type='date'
                        {...register(`educations.${i}.endDate` as const)}
                        {...withErrInput(!!errors.educations?.[i]?.endDate)}
                      />
                      {errors.educations?.[i]?.endDate && (
                        <p className='text-xs text-red-600 mt-1'>
                          {String(errors.educations[i]?.endDate?.message)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className='md:col-span-2 grid gap-1'>
                    <label className={labelCls}>Summary</label>
                    <textarea
                      rows={3}
                      {...register(`educations.${i}.summary` as const)}
                      {...withErrTextarea(!!errors.educations?.[i]?.summary)}
                    />
                    {errors.educations?.[i]?.summary && (
                      <p className='text-xs text-red-600 mt-1'>
                        {String(errors.educations[i]?.summary?.message)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Projects ===== */}
        <section className={sectionCardCls}>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold'>Projects</h2>
            <button
              type='button'
              className={btnOutline}
              onClick={() => appendProject(newProject())}
            >
              + Add Project
            </button>
          </div>

          {projects.length === 0 && (
            <p className='muted text-sm mt-3'>
              No projects yet. Click “Add Project” to start listing your work.
            </p>
          )}

          <div className='space-y-4 mt-4'>
            {projects.map((p, pIdx) => {
              const mainKey = watch(`projects.${pIdx}.mainImageKey`);
              return (
                <div
                  key={p.id ?? pIdx}
                  className='rounded-2xl border border-token p-4 bg-white/70'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='font-medium'>Project #{pIdx + 1}</h3>
                    <div className='flex items-center gap-2'>
                      {pIdx > 0 && (
                        <button
                          type='button'
                          className={btnLink}
                          onClick={() => swapProject(pIdx, pIdx - 1)}
                        >
                          Up
                        </button>
                      )}
                      {pIdx < projects.length - 1 && (
                        <button
                          type='button'
                          className={btnLink}
                          onClick={() => swapProject(pIdx, pIdx + 1)}
                        >
                          Down
                        </button>
                      )}
                      <button
                        type='button'
                        className={`${btnLink} text-red-600`}
                        onClick={() => removeProject(pIdx)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className='mt-3 grid grid-cols-1 gap-3 md:grid-cols-2'>
                    <div className='grid gap-1'>
                      <label className={labelCls}>Title</label>
                      <input
                        placeholder='Project title'
                        {...register(`projects.${pIdx}.title` as const)}
                        {...withErrInput(!!errors.projects?.[pIdx]?.title)}
                      />
                      {errors.projects?.[pIdx]?.title && (
                        <p className='text-xs text-red-600 mt-1'>
                          {String(errors.projects[pIdx]?.title?.message)}
                        </p>
                      )}
                    </div>

                    <div className='grid gap-1'>
                      <label className={labelCls}>Main Image</label>
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
                      {errors.projects?.[pIdx]?.mainImageKey && (
                        <p className='text-xs text-red-600 mt-1'>
                          {String(errors.projects[pIdx]?.mainImageKey?.message)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className='mt-3 grid gap-1'>
                    <label className={labelCls}>Description</label>
                    <textarea
                      rows={3}
                      placeholder='What did you build? What was your role?'
                      {...register(`projects.${pIdx}.description` as const)}
                      {...withErrTextarea(
                        !!errors.projects?.[pIdx]?.description
                      )}
                    />
                    {errors.projects?.[pIdx]?.description && (
                      <p className='text-xs text-red-600 mt-1'>
                        {String(errors.projects[pIdx]?.description?.message)}
                      </p>
                    )}
                  </div>

                  <div className='mt-3 grid gap-1'>
                    <label className={labelCls}>Project Tags</label>
                    <TagsInput
                      name={
                        `projects.${pIdx}.tags` as FieldPath<PortfolioFormValues>
                      }
                      register={register}
                    />
                    {errors.projects?.[pIdx]?.tags && (
                      <p className='text-xs text-red-600 mt-1'>
                        {String(errors.projects[pIdx]?.tags?.message)}
                      </p>
                    )}
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

        {/* Footer Actions */}
        <div className='flex justify-end'>
          <button type='submit' disabled={isSubmitting} className={btnPrimary}>
            {isSubmitting
              ? 'Saving…'
              : mode === 'create'
              ? 'Create Portfolio'
              : 'Save Changes'}
          </button>
        </div>

        {/* Dev-only errors */}
        {process.env.NODE_ENV === 'development' &&
          Object.keys(errors).length > 0 && (
            <pre className='mt-2 text-xs text-red-700 bg-red-50 p-2 rounded'>
              {safeStringifyErrors(errors)}
            </pre>
          )}
      </form>
    </>
  );
}

/* ---------- Child components ---------- */

function TagsInput({
  name,
  register
}: {
  name: FieldPath<PortfolioFormValues>;
  register: UseFormRegister<PortfolioFormValues>;
}) {
  return (
    <input
      className={inputOk}
      placeholder='e.g. UGC, Beverage, Ramadan'
      {...register(name, {
        setValueAs: (v: unknown): string[] | undefined => {
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
        <label className={labelCls}>Project Images (max 12)</label>
        {canAddMore && (
          <button
            type='button'
            className={btnLink}
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
            <div
              key={idx}
              className='rounded-2xl border border-token p-3 bg-white/70'
            >
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Image #{idx + 1}</span>
                <button
                  type='button'
                  className={btnLink}
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
                        {
                          shouldDirty: true,
                          shouldTouch: true
                        }
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
      <label className={labelCls}>Project Video Links</label>
      <div className='space-y-3 mt-2'>
        {fields.map((f, idx) => (
          <div
            key={f.id ?? idx}
            className='rounded-2xl border border-token p-3 bg-white/70'
          >
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Video #{idx + 1}</span>
              <button
                type='button'
                className={btnLink}
                onClick={() => remove(idx)}
              >
                Remove
              </button>
            </div>
            <div className='mt-2 grid grid-cols-1 md:grid-cols-5 gap-2'>
              <div className='grid gap-1'>
                <label className='text-xs font-medium'>Platform</label>
                <select
                  {...register(`${nameBase}.${idx}.platform` as const)}
                  className={selectOk}
                >
                  {VIDEO_PLATFORMS.map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className='md:col-span-2 grid gap-1'>
                <label className='text-xs font-medium'>URL</label>
                <input
                  placeholder='https://...'
                  {...register(`${nameBase}.${idx}.url` as const)}
                  className={inputOk}
                />
              </div>
              <div className='md:col-span-2 grid gap-1'>
                <label className='text-xs font-medium'>Caption</label>
                <input
                  placeholder='Short description'
                  {...register(`${nameBase}.${idx}.description` as const)}
                  className={inputOk}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type='button'
        className={`${btnOutline} mt-3`}
        onClick={() => append({ platform: 'TIKTOK', url: '', description: '' })}
      >
        + Add Video
      </button>
    </div>
  );
}
