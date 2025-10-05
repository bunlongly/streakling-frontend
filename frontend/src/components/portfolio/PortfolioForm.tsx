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

/** Remove any DOM nodes / functions / circular refs before JSON.stringify */
function jsonSafe<T>(input: T): T {
  const seen = new WeakSet();
  const walk = (val: any): any => {
    if (val == null) return val;
    const t = typeof val;
    if (t === 'string' || t === 'number' || t === 'boolean') return val;
    if (Array.isArray(val)) return val.map(walk);
    if (t === 'object') {
      if (seen.has(val)) return undefined;
      if (
        'nodeType' in val ||
        'tagName' in val ||
        String(val?.constructor?.name).includes('HTML')
      ) {
        return undefined;
      }
      seen.add(val);
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        const w = walk(v);
        if (w !== undefined) out[k] = w;
      }
      return out;
    }
    return undefined;
  };
  return walk(input);
}

type Props = {
  mode: 'create' | 'edit';
  portfolioId?: string;
  initial?: Partial<Portfolio> | null;
};

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
      title: initial?.title ?? '',
      description: initial?.description ?? undefined,
      mainImageKey: initial?.mainImageKey ?? undefined,
      subImages: initial?.subImages ?? [],
      videoLinks: initial?.videoLinks ?? [],
      tags: (initial?.tags ?? undefined) as string[] | undefined
    }
  });

  useEffect(() => {
    if (initial) {
      reset({
        title: initial.title ?? '',
        description: initial.description ?? undefined,
        mainImageKey: initial.mainImageKey ?? undefined,
        subImages: initial.subImages ?? [],
        videoLinks: initial.videoLinks ?? [],
        tags: (initial.tags ?? undefined) as string[] | undefined
      });
    }
  }, [initial, reset]);

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

  function newVideo(): NonNullable<PortfolioFormValues['videoLinks']>[number] {
    return { platform: 'TIKTOK', url: '', description: '' };
  }

  function onBatchUploaded(keys: string[]) {
    const rows = keys.map((key, idx) => {
      const url = buildPublicUrl(key) || '';
      return { key, url, sortOrder: (subImages.length ?? 0) + idx };
    });
    appendImage(rows);
  }

  async function onSubmit(values: PortfolioFormValues) {
    const cleanedSub = (values.subImages ?? [])
      .map((img, idx) => ({ ...img, sortOrder: idx }))
      .filter(img => img.key && img.url);

    const cleanedVideos = (values.videoLinks ?? []).filter(v => v.url);

    const draft: PortfolioFormValues = {
      ...values,
      subImages: cleanedSub,
      videoLinks: cleanedVideos
    };
    const payload = jsonSafe(draft);

    const saved =
      mode === 'create'
        ? (await api.portfolio.create(payload)).data
        : (await api.portfolio.updateById(String(portfolioId), payload)).data;

    window.location.assign(`/profile/portfolios/${saved.id}`);
  }

  const canAddMoreImages = (subImages?.length ?? 0) < 12;

  return (
    <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className='block text-sm font-medium'>Title</label>
        <input
          className='mt-1 w-full rounded border px-3 py-2'
          placeholder='Project title'
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
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Main/cover image (purpose=cover) */}
      <div>
        <label className='block text-sm font-medium'>Main Image</label>
        <ImageUploader
          label='Main Image'
          category='portfolio'
          purpose='cover' // ✅ signer-accepted purpose
          existingKey={watch('mainImageKey') ?? null}
          previewUrl={
            watch('mainImageKey')
              ? buildPublicUrl(watch('mainImageKey')) ?? undefined
              : undefined
          }
          onUploadedAction={(key: string) =>
            setValue('mainImageKey', key, {
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

      {/* Sub images (purpose=media) + multi uploader */}
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
                  <span className='text-sm font-medium'>Image #{idx + 1}</span>
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
                    purpose='media' // ✅ signer-accepted purpose
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

      {/* Video links (no duration; optional description) */}
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

      <div className='pt-2'>
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
  name: 'tags';
  register: ReturnType<typeof useForm<PortfolioFormValues>>['register'];
}) {
  return (
    <input
      className='mt-1 w-full rounded border px-3 py-2'
      placeholder='e.g. UGC, Beverage, Ramadan'
      {...register(name, {
        setValueAs: (v: unknown) => {
          // guard against events
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
