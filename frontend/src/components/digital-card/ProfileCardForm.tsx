// src/components/digital-card/ProfileCardForm.tsx
'use client';

import { useState } from 'react';
import {
  useForm,
  useFieldArray,
  type SubmitHandler,
  type SubmitErrorHandler,
  type Resolver,
  type FieldErrors
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ImageUploader from '@/components/uploader/ImageUploader';
import { api } from '@/lib/api';
import {
  digitalCardSchema,
  type DigitalCardFormValues,
  type SocialAccountForm,
  SOCIAL_PLATFORMS
} from '@/schemas/digitalCard';

type Props = {
  id?: string; // if provided -> update; else create
  initial?: Partial<DigitalCardFormValues>;
};

/** --- Adapter to keep API types happy even if PRIVATE was excluded before --- */
function adaptToUpsert(values: DigitalCardFormValues) {
  const publishStatusForApi =
    values.publishStatus === 'PRIVATE' ? 'PRIVATE' : values.publishStatus;
  return {
    ...values,
    publishStatus: publishStatusForApi
  };
}

/* ---------------- Helpers ---------------- */

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function sanitize(values: DigitalCardFormValues): DigitalCardFormValues {
  const toUndef = (s: string | undefined | null): string | undefined =>
    s != null && typeof s === 'string' && s.trim() === '' ? undefined : s;

  return {
    ...values,
    company: toUndef(values.company),
    university: toUndef(values.university),
    country: toUndef(values.country),
    religion: toUndef(values.religion),
    phone: toUndef(values.phone),
    appName: values.appName?.trim() ?? '',
    role: values.role?.trim() ?? '',
    slug: values.slug?.trim() ?? '',
    shortBio: values.shortBio ?? '',
    avatarKey: toUndef(values.avatarKey),
    bannerKey: toUndef(values.bannerKey),
    socials: (values.socials ?? []).map<SocialAccountForm>(s => ({
      ...s,
      handle: toUndef(s.handle),
      url: toUndef(s.url),
      label:
        typeof s.label === 'string' && s.label.trim() !== ''
          ? s.label.trim()
          : undefined
    }))
  };
}

/** Keep label only for PERSONAL/OTHER; strip otherwise */
function normalizeSocials(
  socials: DigitalCardFormValues['socials']
): SocialAccountForm[] {
  return (socials ?? []).map<SocialAccountForm>(s => {
    const keepLabel = s.platform === 'PERSONAL' || s.platform === 'OTHER';
    const label =
      typeof s.label === 'string' && s.label.trim() !== ''
        ? s.label.trim()
        : undefined;
    return {
      ...s,
      label: keepLabel ? label : undefined
    };
  });
}

/** Safely find the first validation message without using `any` */
function firstErrorMessage(
  errs: FieldErrors<DigitalCardFormValues>
): string | null {
  const scan = (node: unknown): string | null => {
    if (!node) return null;

    if (typeof node === 'object') {
      const rec = node as Record<string, unknown>;

      const msg = rec['message'];
      if (typeof msg === 'string') return msg;

      if (Array.isArray(node)) {
        for (const item of node) {
          const found = scan(item);
          if (found) return found;
        }
      } else {
        for (const v of Object.values(rec)) {
          const found = scan(v);
          if (found) return found;
        }
      }
    }
    return null;
  };

  return scan(errs);
}

export default function ProfileCardForm({ initial, id }: Props) {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors }
  } = useForm<DigitalCardFormValues>({
    resolver: zodResolver(digitalCardSchema) as Resolver<DigitalCardFormValues>,
    defaultValues: {
      // REQUIRED by schema
      slug: '',
      firstName: '',
      lastName: '',
      appName: '',
      role: '',
      status: 'WORKING',
      publishStatus: 'DRAFT',
      shortBio: '',

      // required booleans
      showPhone: false,
      showReligion: false,
      showCompany: true,
      showUniversity: true,
      showCountry: true,

      // optional strings
      company: '',
      university: '',
      country: '',
      religion: '',
      phone: '',

      // optional media
      avatarKey: undefined,
      bannerKey: undefined,

      // socials array (can be empty)
      socials: [],

      // let incoming initial override
      ...initial
    }
  });

  // Socials field array
  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'socials'
  });

  // Optional remote preview (if NEXT_PUBLIC_S3_PUBLIC_BASE is set)
  const avatarKey = watch('avatarKey') || null;
  const bannerKey = watch('bannerKey') || null;
  const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE;

  // Infer the exact body types expected by your API methods
  type CreateBody = Parameters<(typeof api)['card']['create']>[0];
  type UpdateBody = Parameters<(typeof api)['card']['updateById']>[1];

  const onSubmit: SubmitHandler<DigitalCardFormValues> = async raw => {
    setServerMessage(null);
    setLoading(true);
    try {
      // 1) sanitize + normalize socials
      let values = sanitize(raw);
      values = { ...values, socials: normalizeSocials(values.socials) };

      // 2) auto-slug if empty
      if (!values.slug) {
        const candidate = [values.appName, values.firstName, values.lastName]
          .filter(Boolean)
          .join('-');
        values.slug = slugify(candidate || 'card');
      }

      // 3) payload
      const upsert = adaptToUpsert(values);

      // 4) call correct API with correct types
      if (id) {
        const body: UpdateBody = upsert as UpdateBody;
        const res = await api.card.updateById(id, body);
        setServerMessage(
          'message' in res && typeof res.message === 'string'
            ? res.message
            : 'Saved'
        );
      } else {
        const body: CreateBody = upsert as CreateBody;
        const res = await api.card.create(body);
        setServerMessage(
          'message' in res && typeof res.message === 'string'
            ? res.message
            : 'Saved'
        );
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save';
      setServerMessage(msg);

      console.error('Save failed:', e);
    } finally {
      setLoading(false);
    }
  };

  // Show a clear first error
  const onInvalid: SubmitErrorHandler<DigitalCardFormValues> = errs => {
    setServerMessage(
      firstErrorMessage(errs) ?? 'Please fix the highlighted fields.'
    );

    console.error('Form invalid:', errs);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className='grid gap-6'>
      {/* Images */}
      <div className='grid md:grid-cols-2 gap-6'>
        <ImageUploader
          label='Avatar'
          category='digitalcard'
          purpose='avatar'
          existingKey={avatarKey}
          previewUrl={
            avatarKey && PUBLIC_BASE ? `${PUBLIC_BASE}/${avatarKey}` : null
          }
          onUploadedAction={(key: string) =>
            setValue('avatarKey', key, { shouldDirty: true, shouldTouch: true })
          }
        />
        <ImageUploader
          label='Banner'
          category='digitalcard'
          purpose='banner'
          existingKey={bannerKey}
          previewUrl={
            bannerKey && PUBLIC_BASE ? `${PUBLIC_BASE}/${bannerKey}` : null
          }
          onUploadedAction={(key: string) =>
            setValue('bannerKey', key, { shouldDirty: true, shouldTouch: true })
          }
        />
      </div>

      {/* Slug */}
      <div className='grid gap-2'>
        <label htmlFor='slug'>Slug</label>
        <input
          id='slug'
          className='card-surface px-3 py-2'
          {...register('slug')}
        />
        {errors.slug && (
          <p className='text-red-400 text-sm'>{errors.slug.message}</p>
        )}
        <p className='muted text-xs'>
          Lowercase, numbers, hyphens (e.g. <code>my-card</code>). Your public
          URL will look like: <code>/your-username/{`{slug}`}/digitalcard</code>
        </p>
      </div>

      {/* Names */}
      <div className='grid md:grid-cols-2 gap-4'>
        <div className='grid gap-2'>
          <label htmlFor='firstName'>First name</label>
          <input
            id='firstName'
            className='card-surface px-3 py-2'
            {...register('firstName')}
          />
          {errors.firstName && (
            <p className='text-red-400 text-sm'>{errors.firstName.message}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <label htmlFor='lastName'>Last name</label>
          <input
            id='lastName'
            className='card-surface px-3 py-2'
            {...register('lastName')}
          />
          {errors.lastName && (
            <p className='text-red-400 text-sm'>{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Handle + Role */}
      <div className='grid md:grid-cols-2 gap-4'>
        <div className='grid gap-2'>
          <label htmlFor='appName'>App name (handle)</label>
          <input
            id='appName'
            className='card-surface px-3 py-2'
            {...register('appName')}
          />
          {errors.appName && (
            <p className='text-red-400 text-sm'>{errors.appName.message}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <label htmlFor='role'>Role</label>
          <input
            id='role'
            className='card-surface px-3 py-2'
            {...register('role')}
          />
          {errors.role && (
            <p className='text-red-400 text-sm'>{errors.role.message}</p>
          )}
        </div>
      </div>

      {/* Status + Publish */}
      <div className='grid md:grid-cols-2 gap-4'>
        <div className='grid gap-2'>
          <label htmlFor='status'>Status</label>
          <select
            id='status'
            className='card-surface px-3 py-2'
            {...register('status')}
          >
            <option value='STUDENT'>Student</option>
            <option value='GRADUATE'>Graduate</option>
            <option value='WORKING'>Working</option>
          </select>
          {errors.status && (
            <p className='text-red-400 text-sm'>{errors.status.message}</p>
          )}
        </div>
        <div className='grid gap-2'>
          <label htmlFor='publishStatus'>Publish status</label>
          <select
            id='publishStatus'
            className='card-surface px-3 py-2'
            {...register('publishStatus')}
          >
            <option value='DRAFT'>Draft</option>
            <option value='PRIVATE'>Private</option>
            <option value='PUBLISHED'>Published</option>
          </select>
        </div>
      </div>

      {/* Short bio */}
      <div className='grid gap-2'>
        <label htmlFor='shortBio'>Short bio (≤300)</label>
        <textarea
          id='shortBio'
          rows={3}
          className='card-surface px-3 py-2'
          {...register('shortBio')}
        />
        {errors.shortBio && (
          <p className='text-red-400 text-sm'>{errors.shortBio.message}</p>
        )}
      </div>

      {/* Company/University/Country */}
      <div className='grid md:grid-cols-3 gap-4'>
        <div className='grid gap-2'>
          <label htmlFor='company'>Company</label>
          <input
            id='company'
            className='card-surface px-3 py-2'
            {...register('company')}
          />
        </div>
        <div className='grid gap-2'>
          <label htmlFor='university'>University</label>
          <input
            id='university'
            className='card-surface px-3 py-2'
            {...register('university')}
          />
        </div>
        <div className='grid gap-2'>
          <label htmlFor='country'>Country</label>
          <input
            id='country'
            className='card-surface px-3 py-2'
            {...register('country')}
          />
        </div>
      </div>

      {/* Sensitive */}
      <div className='grid md:grid-cols-2 gap-4'>
        <div className='grid gap-2'>
          <label htmlFor='phone'>Phone (sensitive)</label>
          <input
            id='phone'
            className='card-surface px-3 py-2'
            {...register('phone')}
          />
        </div>
        <div className='grid gap-2'>
          <label htmlFor='religion'>Religion (sensitive)</label>
          <input
            id='religion'
            className='card-surface px-3 py-2'
            {...register('religion')}
          />
        </div>
      </div>

      {/* Visibility toggles */}
      <div className='mt-2 rounded-lg border border-white/10 p-4'>
        <div className='font-medium mb-2'>Visibility</div>
        <div className='grid sm:grid-cols-2 gap-2 text-sm'>
          <label className='inline-flex items-center gap-2'>
            <input type='checkbox' {...register('showCompany')} /> Show company
          </label>
          <label className='inline-flex items-center gap-2'>
            <input type='checkbox' {...register('showUniversity')} /> Show
            university
          </label>
          <label className='inline-flex items-center gap-2'>
            <input type='checkbox' {...register('showCountry')} /> Show country
          </label>
          <label className='inline-flex items-center gap-2'>
            <input type='checkbox' {...register('showPhone')} /> Show phone
            (sensitive)
          </label>
          <label className='inline-flex items-center gap-2'>
            <input type='checkbox' {...register('showReligion')} /> Show
            religion (sensitive)
          </label>
        </div>
        <p className='muted text-xs mt-2'>
          You can publish without showing sensitive details. Owners always see
          all values.
        </p>
      </div>

      {/* Social Accounts */}
      <div className='rounded-lg border border-white/10 p-4'>
        <div className='flex items-center justify-between mb-3'>
          <div className='font-medium'>Social accounts</div>
          <button
            type='button'
            className='btn-secondary'
            onClick={() =>
              append({
                platform: 'GITHUB',
                handle: '',
                url: '',
                isPublic: true,
                sortOrder: fields.length
              } satisfies SocialAccountForm)
            }
          >
            + Add social
          </button>
        </div>

        <div className='grid gap-3'>
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className='grid md:grid-cols-12 gap-2 items-end'
            >
              <div className='md:col-span-2 grid gap-1'>
                <label className='text-xs'>Platform</label>
                <select
                  className='card-surface px-2 py-2'
                  {...register(`socials.${idx}.platform` as const)}
                >
                  {SOCIAL_PLATFORMS.map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className='md:col-span-2 grid gap-1'>
                <label className='text-xs'>Handle</label>
                <input
                  className='card-surface px-2 py-2'
                  {...register(`socials.${idx}.handle` as const)}
                />
              </div>
              <div className='md:col-span-5 grid gap-1'>
                <label className='text-xs'>URL</label>
                <input
                  className='card-surface px-2 py-2'
                  {...register(`socials.${idx}.url` as const)}
                />
              </div>
              <div className='md:col-span-1 grid gap-1'>
                <label className='text-xs'>Order</label>
                <input
                  type='number'
                  className='card-surface px-2 py-2'
                  {...register(`socials.${idx}.sortOrder` as const, {
                    valueAsNumber: true
                  })}
                />
              </div>
              <div className='md:col-span-1 flex items-center gap-2'>
                <input
                  type='checkbox'
                  {...register(`socials.${idx}.isPublic` as const)}
                />
                <span className='text-sm'>Public</span>
              </div>
              <div className='md:col-span-1 flex gap-2 justify-end'>
                <button
                  type='button'
                  className='btn-ghost'
                  onClick={() => remove(idx)}
                >
                  Remove
                </button>
                {idx > 0 && (
                  <button
                    type='button'
                    className='btn-ghost'
                    onClick={() => swap(idx, idx - 1)}
                  >
                    ↑
                  </button>
                )}
                {idx < fields.length - 1 && (
                  <button
                    type='button'
                    className='btn-ghost'
                    onClick={() => swap(idx, idx + 1)}
                  >
                    ↓
                  </button>
                )}
              </div>
            </div>
          ))}
          {/* Show the top-most error message */}
          {firstErrorMessage(errors) && (
            <p className='text-red-400 text-sm'>{firstErrorMessage(errors)}</p>
          )}
        </div>
      </div>

      <button type='submit' disabled={loading} className='btn mt-2'>
        {loading ? 'Saving…' : id ? 'Update card' : 'Create card'}
      </button>

      {serverMessage && <p className='mt-2'>{serverMessage}</p>}

      {/* Dev-only error visibility */}
      {process.env.NODE_ENV === 'development' &&
        Object.keys(errors).length > 0 && (
          <pre className='text-xs whitespace-pre-wrap bg-black/30 p-3 rounded mt-2'>
            {JSON.stringify(errors, null, 2)}
          </pre>
        )}
    </form>
  );
}
