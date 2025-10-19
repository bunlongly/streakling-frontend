// src/components/digital-card/ProfileCardForm.tsx
'use client';

import { useState } from 'react';
import {
  useForm,
  useFieldArray,
  type SubmitHandler,
  type SubmitErrorHandler,
  type Resolver,
  type FieldErrors,
  FieldPath
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
import { useFlash } from '@/components/ui/useFlash';

/* ---------- Adapters & Helpers ---------- */

type Props = {
  id?: string; // if provided -> update; else create
  initial?: Partial<DigitalCardFormValues>;
};

function adaptToUpsert(values: DigitalCardFormValues) {
  const publishStatusForApi =
    values.publishStatus === 'PRIVATE' ? 'PRIVATE' : values.publishStatus;
  return { ...values, publishStatus: publishStatusForApi };
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function sanitize(values: DigitalCardFormValues): DigitalCardFormValues {
  const toUndef = (s: string | undefined | null): string | undefined => {
    if (s == null) return undefined;
    const t = s.trim();
    return t === '' ? undefined : t;
  };

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
    return { ...s, label: keepLabel ? label : undefined };
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

/** Find first invalid field path to focus */
function firstErrorPath(
  errs: FieldErrors<DigitalCardFormValues>,
  prefix: string[] = []
): FieldPath<DigitalCardFormValues> | null {
  for (const [k, v] of Object.entries(errs)) {
    if (!v) continue;
    const path = [...prefix, k];
    if (
      typeof v === 'object' &&
      'message' in v &&
      typeof (v as any).message === 'string'
    ) {
      return path.join('.') as FieldPath<DigitalCardFormValues>;
    }
    if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) {
        const inner = v[i] as FieldErrors<DigitalCardFormValues>;
        const found = firstErrorPath(inner, [...path, String(i)]);
        if (found) return found;
      }
    } else if (typeof v === 'object') {
      const found = firstErrorPath(
        v as FieldErrors<DigitalCardFormValues>,
        path
      );
      if (found) return found;
    }
  }
  return null;
}

/** Dev-only: flatten errors to messages (drops DOM refs to avoid circular JSON) */
function flattenErrorMessages(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(flattenErrorMessages);
  const rec = obj as Record<string, unknown>;
  if (typeof rec.message === 'string') return rec.message;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rec)) {
    if (k === 'ref') continue; // DOM node -> circular
    out[k] = flattenErrorMessages(v);
  }
  return out;
}

/** Inputs styling */
const inputBase =
  'w-full card-surface rounded-xl border px-3 py-2 text-[15px] shadow-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent';
const inputOk = inputBase + ' border-token';
const inputErr =
  inputBase +
  ' border-red-500 ring-1 ring-red-300 focus:ring-red-400 focus:border-red-500';

const labelCls = 'text-sm font-medium';
const helpErr = 'text-red-500 text-sm mt-1';
const helpMuted = 'muted text-xs';

const sectionCardCls =
  'rounded-2xl border border-token bg-surface p-4 md:p-5 ' +
  'shadow-[0_1px_2px_rgba(10,10,15,0.06),_0_12px_24px_rgba(10,10,15,0.06)]';

const btnBase =
  'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition';
const btnPrimary =
  btnBase +
  ' text-white bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] ' +
  'hover:brightness-110 active:brightness-95 shadow-[0_8px_24px_rgba(77,56,209,0.35)] disabled:opacity-60';
const btnSecondary =
  btnBase +
  ' border border-token bg-white/70 hover:bg-white text-[var(--color-dark)]';
const btnGhost =
  'inline-flex items-center gap-1 px-2 py-1 text-sm font-medium rounded-lg hover:bg-black/5';

export default function ProfileCardForm({ initial, id }: Props) {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const flash = useFlash();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    setFocus,
    formState: { errors, isSubmitting }
  } = useForm<DigitalCardFormValues>({
    resolver: zodResolver(digitalCardSchema) as Resolver<DigitalCardFormValues>,
    defaultValues: {
      slug: '',
      firstName: '',
      lastName: '',
      appName: '',
      role: '',
      status: 'WORKING',
      publishStatus: 'DRAFT',
      shortBio: '',
      showPhone: false,
      showReligion: false,
      showCompany: true,
      showUniversity: true,
      showCountry: true,
      company: '',
      university: '',
      country: '',
      religion: '',
      phone: '',
      avatarKey: undefined,
      bannerKey: undefined,
      socials: [],
      ...initial
    }
  });

  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'socials'
  });

  const avatarKey = watch('avatarKey') || null;
  const bannerKey = watch('bannerKey') || null;
  const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE;

  type CreateBody = Parameters<(typeof api)['card']['create']>[0];
  type UpdateBody = Parameters<(typeof api)['card']['updateById']>[1];

  const onSubmit: SubmitHandler<DigitalCardFormValues> = async raw => {
    setServerMessage(null);
    setLoading(true);
    try {
      let values = sanitize(raw);
      values = { ...values, socials: normalizeSocials(values.socials) };

      if (!values.slug) {
        const candidate = [values.appName, values.firstName, values.lastName]
          .filter(Boolean)
          .join('-');
        values.slug = slugify(candidate || 'card');
      }

      const upsert = adaptToUpsert(values);

      if (id) {
        const body: UpdateBody = upsert as UpdateBody;
        const res = await api.card.updateById(id, body);
        const msg =
          'message' in res && typeof res.message === 'string'
            ? res.message
            : 'Saved';
        setServerMessage(msg);
        flash.show({ kind: 'success', title: 'Saved', message: msg });
      } else {
        const body: CreateBody = upsert as CreateBody;
        const res = await api.card.create(body);
        const msg =
          'message' in res && typeof res.message === 'string'
            ? res.message
            : 'Saved';
        setServerMessage(msg);
        flash.show({ kind: 'success', title: 'Created', message: msg });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save';
      setServerMessage(msg);
      flash.show({ kind: 'error', title: 'Failed', message: msg });
      console.error('Save failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const onInvalid: SubmitErrorHandler<DigitalCardFormValues> = errs => {
    const msg = firstErrorMessage(errs) ?? 'Please fix the highlighted fields.';
    setServerMessage(msg);
    flash.show({ kind: 'error', title: 'Form error', message: msg });

    // Focus & scroll to the first invalid field
    const path = firstErrorPath(errs);
    if (path) {
      setFocus(path as any, { shouldSelect: true });
      const el = document.querySelector(`[name="${path}"]`);
      if (el)
        (el as HTMLElement).scrollIntoView({
          block: 'center',
          behavior: 'smooth'
        });
    }

    // Keep console log but without circular refs
    console.error('Form invalid:', flattenErrorMessages(errs));
  };

  // Helper to pick the right class & aria-invalid (boolean to satisfy TS)
  const withErr = (hasErr: boolean) => ({
    className: hasErr ? inputErr : inputOk,
    'aria-invalid': hasErr as boolean
  });

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className='grid gap-6'>
      {/* Media */}
      <section className={sectionCardCls}>
        <h3 className='text-lg font-semibold mb-3'>Media</h3>
        <div className='grid gap-4 md:grid-cols-2'>
          <ImageUploader
            label='Avatar'
            category='digitalcard'
            purpose='avatar'
            existingKey={avatarKey}
            previewUrl={
              avatarKey && PUBLIC_BASE ? `${PUBLIC_BASE}/${avatarKey}` : null
            }
            onUploadedAction={(key: string) =>
              setValue('avatarKey', key, {
                shouldDirty: true,
                shouldTouch: true
              })
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
              setValue('bannerKey', key, {
                shouldDirty: true,
                shouldTouch: true
              })
            }
          />
        </div>
      </section>

      {/* Identity & URL */}
      <section className={sectionCardCls}>
        <h3 className='text-lg font-semibold mb-3'>Identity & URL</h3>

        <div className='grid md:grid-cols-3 gap-4'>
          <div className='grid gap-2 min-w-0'>
            <label htmlFor='firstName' className={labelCls}>
              First name
            </label>
            <input
              id='firstName'
              {...register('firstName')}
              {...withErr(!!errors.firstName)}
            />
            {errors.firstName && (
              <p className={helpErr}>{errors.firstName.message}</p>
            )}
          </div>

          <div className='grid gap-2 min-w-0'>
            <label htmlFor='lastName' className={labelCls}>
              Last name
            </label>
            <input
              id='lastName'
              {...register('lastName')}
              {...withErr(!!errors.lastName)}
            />
            {errors.lastName && (
              <p className={helpErr}>{errors.lastName.message}</p>
            )}
          </div>

          <div className='grid gap-2 min-w-0'>
            <label htmlFor='appName' className={labelCls}>
              App name (handle)
            </label>
            <input
              id='appName'
              {...register('appName')}
              {...withErr(!!errors.appName)}
            />
            {errors.appName && (
              <p className={helpErr}>{errors.appName.message}</p>
            )}
          </div>
        </div>

        <div className='grid md:grid-cols-3 gap-4 mt-4'>
          <div className='grid gap-2 md:col-span-2 min-w-0'>
            <label htmlFor='slug' className={labelCls}>
              Slug
            </label>
            <input
              id='slug'
              {...register('slug')}
              {...withErr(!!errors.slug)}
            />
            {errors.slug && <p className={helpErr}>{errors.slug.message}</p>}
            <p className={helpMuted}>
              Lowercase, numbers, hyphens. Public URL:{' '}
              <code>/your-username/{`{slug}`}/digitalcard</code>
            </p>
          </div>

          <div className='grid gap-2 min-w-0'>
            <label htmlFor='role' className={labelCls}>
              Role
            </label>
            <input
              id='role'
              {...register('role')}
              {...withErr(!!errors.role)}
            />
            {errors.role && <p className={helpErr}>{errors.role.message}</p>}
          </div>
        </div>
      </section>

      {/* Status & Publish */}
      <section className={sectionCardCls}>
        <h3 className='text-lg font-semibold mb-3'>Status & Publishing</h3>

        <div className='grid md:grid-cols-2 gap-4'>
          <div className='grid gap-2 min-w-0'>
            <label htmlFor='status' className={labelCls}>
              Status
            </label>
            <select
              id='status'
              {...register('status')}
              {...withErr(!!errors.status)}
            >
              <option value='STUDENT'>Student</option>
              <option value='GRADUATE'>Graduate</option>
              <option value='WORKING'>Working</option>
            </select>
            {errors.status && (
              <p className={helpErr}>{errors.status.message}</p>
            )}
          </div>

          <div className='grid gap-2 min-w-0'>
            <label htmlFor='publishStatus' className={labelCls}>
              Publish status
            </label>
            <select
              id='publishStatus'
              {...register('publishStatus')}
              {...withErr(!!errors.publishStatus)}
            >
              <option value='DRAFT'>Draft</option>
              <option value='PRIVATE'>Private</option>
              <option value='PUBLISHED'>Published</option>
            </select>
            {errors.publishStatus && (
              <p className={helpErr}>{errors.publishStatus.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* About */}
      <section className={sectionCardCls}>
        <h3 className='text-lg font-semibold mb-3'>About</h3>
        <div className='grid gap-2 min-w-0'>
          <label htmlFor='shortBio' className={labelCls}>
            Short bio (≤300)
          </label>
          <textarea
            id='shortBio'
            rows={3}
            {...register('shortBio')}
            {...withErr(!!errors.shortBio)}
          />
          {errors.shortBio && (
            <p className={helpErr}>{errors.shortBio.message}</p>
          )}
        </div>
      </section>

      {/* Organization & Location */}
      <section className={sectionCardCls}>
        <h3 className='text-lg font-semibold mb-3'>Organization & Location</h3>
        <div className='grid md:grid-cols-3 gap-4'>
          <div className='grid gap-2 min-w-0'>
            <label htmlFor='company' className={labelCls}>
              Company
            </label>
            <input
              id='company'
              {...register('company')}
              {...withErr(!!errors.company)}
            />
            {errors.company && (
              <p className={helpErr}>{errors.company.message}</p>
            )}
          </div>

          <div className='grid gap-2 min-w-0'>
            <label htmlFor='university' className={labelCls}>
              University
            </label>
            <input
              id='university'
              {...register('university')}
              {...withErr(!!errors.university)}
            />
            {errors.university && (
              <p className={helpErr}>{errors.university.message}</p>
            )}
          </div>

          <div className='grid gap-2 min-w-0'>
            <label htmlFor='country' className={labelCls}>
              Country
            </label>
            <input
              id='country'
              {...register('country')}
              {...withErr(!!errors.country)}
            />
            {errors.country && (
              <p className={helpErr}>{errors.country.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Sensitive & Visibility */}
      <section className={sectionCardCls}>
        <h3 className='text-lg font-semibold mb-3'>Sensitive & Visibility</h3>

        <div className='grid md:grid-cols-2 gap-4 mb-3'>
          <div className='grid gap-2 min-w-0'>
            <label htmlFor='phone' className={labelCls}>
              Phone (sensitive)
            </label>
            <input
              id='phone'
              {...register('phone')}
              {...withErr(!!errors.phone)}
            />
            {errors.phone && <p className={helpErr}>{errors.phone.message}</p>}
          </div>
          <div className='grid gap-2 min-w-0'>
            <label htmlFor='religion' className={labelCls}>
              Religion (sensitive)
            </label>
            <input
              id='religion'
              {...register('religion')}
              {...withErr(!!errors.religion)}
            />
            {errors.religion && (
              <p className={helpErr}>{errors.religion.message}</p>
            )}
          </div>
        </div>

        <div className='rounded-xl border border-token p-3 bg:white/60 bg-white/60'>
          <div className='font-medium mb-2'>Visibility toggles</div>
          <div className='grid sm:grid-cols-2 gap-2 text-sm'>
            <label className='inline-flex items-center gap-2'>
              <input type='checkbox' {...register('showCompany')} /> Show
              company
            </label>
            <label className='inline-flex items-center gap-2'>
              <input type='checkbox' {...register('showUniversity')} /> Show
              university
            </label>
            <label className='inline-flex items-center gap-2'>
              <input type='checkbox' {...register('showCountry')} /> Show
              country
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
      </section>

      {/* Social Accounts */}
      <section className={sectionCardCls}>
        <div className='flex items-center justify-between mb-3'>
          <h3 className='text-lg font-semibold'>Social accounts</h3>
          <button
            type='button'
            className={btnSecondary}
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

        <div className='grid gap-4'>
          {fields.map((field, idx) => {
            const err = errors.socials?.[idx];
            return (
              <div
                key={field.id}
                className='relative overflow-hidden rounded-2xl border border-token bg-white/70 p-3 md:p-4 shadow-sm'
              >
                <div className='grid gap-3 md:grid-cols-12'>
                  <div className='md:col-span-3 grid gap-1 min-w-0'>
                    <label className='text-xs font-medium'>Platform</label>
                    <select
                      {...register(`socials.${idx}.platform` as const)}
                      {...withErr(!!err?.platform)}
                    >
                      {SOCIAL_PLATFORMS.map(p => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {err?.platform?.message && (
                      <p className={helpErr}>{err.platform.message}</p>
                    )}
                  </div>

                  <div className='md:col-span-3 grid gap-1 min-w-0'>
                    <label className='text-xs font-medium'>Handle</label>
                    <input
                      placeholder='@username'
                      {...register(`socials.${idx}.handle` as const)}
                      {...withErr(!!err?.handle)}
                    />
                    {err?.handle?.message && (
                      <p className={helpErr}>{err.handle.message}</p>
                    )}
                  </div>

                  <div className='md:col-span-4 grid gap-1 min-w-0'>
                    <label className='text-xs font-medium'>URL</label>
                    <input
                      placeholder='https://…'
                      {...register(`socials.${idx}.url` as const)}
                      {...withErr(!!err?.url)}
                    />
                    {err?.url?.message && (
                      <p className={helpErr}>{err.url.message}</p>
                    )}
                  </div>

                  <div className='md:col-span-2 grid grid-cols-[auto_1fr] items-center gap-3'>
                    <div className='grid gap-1'>
                      <label className='text-xs font-medium'>Order</label>
                      <input
                        type='number'
                        inputMode='numeric'
                        className={
                          (err?.sortOrder ? inputErr : inputOk) +
                          ' w-24 md:w-28 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                        }
                        aria-invalid={!!err?.sortOrder}
                        {...register(`socials.${idx}.sortOrder` as const, {
                          valueAsNumber: true
                        })}
                      />
                      {err?.sortOrder?.message && (
                        <p className={helpErr}>{err.sortOrder.message}</p>
                      )}
                    </div>
                    <label className='inline-flex items-center gap-2 whitespace-nowrap'>
                      <input
                        type='checkbox'
                        {...register(`socials.${idx}.isPublic` as const)}
                      />
                      <span className='text-sm'>Public</span>
                    </label>
                  </div>
                </div>

                {/* Row actions */}
                <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
                  <div className='text-xs text-black/60'>Row #{idx + 1}</div>
                  <div className='flex items-center gap-2'>
                    {idx > 0 && (
                      <button
                        type='button'
                        className={btnGhost}
                        aria-label='Move up'
                        onClick={() => swap(idx, idx - 1)}
                      >
                        ▲ Up
                      </button>
                    )}
                    {idx < fields.length - 1 && (
                      <button
                        type='button'
                        className={btnGhost}
                        aria-label='Move down'
                        onClick={() => swap(idx, idx + 1)}
                      >
                        ▼ Down
                      </button>
                    )}
                    <button
                      type='button'
                      className={btnGhost + ' text-red-600'}
                      onClick={() => remove(idx)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {firstErrorMessage(errors) && (
            <p className={helpErr}>{firstErrorMessage(errors)}</p>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className='flex justify-end'>
        <button
          type='submit'
          disabled={loading || isSubmitting}
          className={btnPrimary}
        >
          {loading || isSubmitting
            ? 'Saving…'
            : id
            ? 'Update card'
            : 'Create card'}
        </button>
      </div>

      {/* Subtle server message (kept) */}
      {serverMessage && (
        <div
          className='mt-2 rounded-xl border border-token bg-white px-3 py-2 text-sm'
          style={{
            boxShadow:
              '0 1px 2px rgba(10,10,15,0.06), 0 8px 16px rgba(10,10,15,0.06)'
          }}
        >
          {serverMessage}
        </div>
      )}

      {/* Dev-only error visibility (SAFE: no circular refs) */}
      {process.env.NODE_ENV === 'development' &&
        Object.keys(errors).length > 0 && (
          <pre className='text-xs whitespace-pre-wrap bg-black/30 p-3 rounded mt-2'>
            {JSON.stringify(flattenErrorMessages(errors), null, 2)}
          </pre>
        )}

      {/* Flash portal */}
      {flash.node}
    </form>
  );
}
