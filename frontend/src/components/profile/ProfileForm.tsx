// src/components/profile/ProfileForm.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { PublicProfile } from '@/types/profile';
import { api } from '@/lib/api';
import {
  updateMyProfileSchema,
  type UpdateMyProfileFormValues
} from '@/schemas/profile';
import IndustriesInput from './IndustriesInput';
import ProfileImagePicker from './ProfileImagePicker';

// Build a preview URL directly (no lib/images.ts needed)
function previewFromKey(key?: string | null) {
  if (!key) return null;
  const PUBLIC_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE || '';
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';
  if (PUBLIC_BASE) return `${PUBLIC_BASE}/${key}`;
  if (API_BASE)
    return `${API_BASE}/api/uploads/view/${encodeURIComponent(key)}`;
  return null; // neither configured → show "No image"
}

// Helper: some owner-only fields are optional/nullable on the response
type OwnerFields = Partial<{
  email: string | null;
  country: string | null;
  religion: string | null;
  dateOfBirth: string | null;
  phone: string | null;
}>;

// Helper: safe error -> message (no `any`)
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return 'Failed to update profile';
}

export default function ProfileForm({ initial }: { initial: PublicProfile }) {
  const initialWithOwner = initial as PublicProfile & OwnerFields;

  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // local state for media + industries
  const [avatarKey, setAvatarKey] = useState<string | null>(
    initial.avatarKey ?? null
  );
  const [bannerKey, setBannerKey] = useState<string | null>(
    initial.bannerKey ?? null
  );
  const [industries, setIndustries] = useState<string[]>(
    (initial.industries || []).map(i => i.slug)
  );

  // optional helper input: comma-separated editing UX
  const [industriesText, setIndustriesText] = useState(industries.join(', '));

  // keep helper text <-> array in sync
  useEffect(() => {
    setIndustriesText(industries.join(', '));
  }, [industries]);

  // live previews
  const avatarPreviewUrl =
    previewFromKey(avatarKey) ?? initial.avatarUrl ?? null;
  const bannerPreviewUrl = previewFromKey(bannerKey);

  // compute defaults from current local state
  const defaults: UpdateMyProfileFormValues = useMemo(
    () => ({
      username: initial.username ?? '',
      displayName: initial.displayName ?? '',
      email: initialWithOwner.email ?? '',
      country: initialWithOwner.country ?? '',
      religion: initialWithOwner.religion ?? '',
      dateOfBirth: initialWithOwner.dateOfBirth?.slice(0, 10) ?? '',
      phone: initialWithOwner.phone ?? '',

      // media
      avatarKey,
      bannerKey,

      // flags
      showEmail: initial.showEmail ?? false,
      showReligion: initial.showReligion ?? false,
      showDateOfBirth: initial.showDateOfBirth ?? false,
      showPhone: initial.showPhone ?? false,
      showCountry: initial.showCountry ?? true,

      // industries (RHF mirror)
      industries
    }),
    [initial, initialWithOwner, avatarKey, bannerKey, industries]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm<UpdateMyProfileFormValues>({
    resolver: zodResolver(updateMyProfileSchema),
    defaultValues: defaults
  });

  // IMPORTANT: hydrate the form when `defaults` change
  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  // media pickers keep RHF in sync
  function applyAvatar(k: string | null) {
    setAvatarKey(k);
    setValue('avatarKey', k === null ? null : k, { shouldDirty: true });
  }
  function applyBanner(k: string | null) {
    setBannerKey(k);
    setValue('bannerKey', k === null ? null : k, { shouldDirty: true });
  }

  // helper: parse comma-separated industries into array
  function parseIndustriesText(input: string): string[] {
    return input
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
  }

  async function onSubmit(values: UpdateMyProfileFormValues) {
    setBusy(true);
    setServerError(null);
    try {
      // final industries from helper text (if user typed there) OR current state
      const finalIndustries =
        industriesText.trim() !== industries.join(', ')
          ? parseIndustriesText(industriesText)
          : industries;

      const payload: UpdateMyProfileFormValues & { industries: string[] } = {
        ...values,
        industries: finalIndustries
      };

      const res = await api.profile.update(payload);
      const updated = res.data as PublicProfile & OwnerFields;

      // reflect server truth in local state
      setAvatarKey(updated.avatarKey ?? null);
      setBannerKey(updated.bannerKey ?? null);
      setIndustries((updated.industries || []).map(i => i.slug));

      // reset the form with fresh values so fields show the saved data
      reset({
        username: updated.username ?? '',
        displayName: updated.displayName ?? '',
        email: updated.email ?? '',
        country: updated.country ?? '',
        religion: updated.religion ?? '',
        dateOfBirth: updated.dateOfBirth?.slice(0, 10) ?? '',
        phone: updated.phone ?? '',
        avatarKey: updated.avatarKey ?? null,
        bannerKey: updated.bannerKey ?? null,
        showEmail: updated.showEmail ?? false,
        showReligion: updated.showReligion ?? false,
        showDateOfBirth: updated.showDateOfBirth ?? false,
        showPhone: updated.showPhone ?? false,
        showCountry: updated.showCountry ?? true,
        industries: (updated.industries || []).map(i => i.slug)
      });
    } catch (e: unknown) {
      setServerError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
      {/* identity */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium'>Display name</label>
          <input
            {...register('displayName')}
            className='w-full rounded-xl border px-3 py-2'
          />
          {errors.displayName && (
            <p className='text-sm text-red-600'>{errors.displayName.message}</p>
          )}
        </div>
        <div>
          <label className='block text-sm font-medium'>Username</label>
          <input
            {...register('username')}
            placeholder='your-handle'
            className='w-full rounded-xl border px-3 py-2'
          />
          <p className='text-xs text-gray-500'>
            letters, numbers, dash, underscore
          </p>
          {errors.username && (
            <p className='text-sm text-red-600'>{errors.username.message}</p>
          )}
        </div>
      </div>

      {/* contact & meta */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium'>Email</label>
          <input
            type='email'
            {...register('email')}
            className='w-full rounded-xl border px-3 py-2'
          />
          {errors.email && (
            <p className='text-sm text-red-600'>{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className='block text-sm font-medium'>Phone</label>
          <input
            {...register('phone')}
            className='w-full rounded-xl border px-3 py-2'
          />
          {errors.phone && (
            <p className='text-sm text-red-600'>{errors.phone.message}</p>
          )}
        </div>
        <div>
          <label className='block text-sm font-medium'>Country</label>
          <input
            {...register('country')}
            className='w-full rounded-xl border px-3 py-2'
          />
          {errors.country && (
            <p className='text-sm text-red-600'>{errors.country.message}</p>
          )}
        </div>
        <div>
          <label className='block text-sm font-medium'>Religion</label>
          <input
            {...register('religion')}
            className='w-full rounded-xl border px-3 py-2'
          />
          {errors.religion && (
            <p className='text-sm text-red-600'>{errors.religion.message}</p>
          )}
        </div>
        <div>
          <label className='block text-sm font-medium'>Date of birth</label>
        <input
            type='date'
            {...register('dateOfBirth')}
            className='w-full rounded-xl border px-3 py-2'
          />
          {errors.dateOfBirth && (
            <p className='text-sm text-red-600'>{errors.dateOfBirth.message}</p>
          )}
        </div>
      </div>

      {/* privacy toggles */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <label className='flex items-center gap-2 text-sm'>
          <input type='checkbox' {...register('showEmail')} />
          Show email publicly
        </label>
        <label className='flex items-center gap-2 text-sm'>
          <input type='checkbox' {...register('showPhone')} />
          Show phone publicly
        </label>
        <label className='flex items-center gap-2 text-sm'>
          <input type='checkbox' {...register('showCountry')} />
          Show country publicly
        </label>
        <label className='flex items-center gap-2 text-sm'>
          <input type='checkbox' {...register('showReligion')} />
          Show religion publicly
        </label>
        <label className='flex items-center gap-2 text-sm'>
          <input type='checkbox' {...register('showDateOfBirth')} />
          Show DOB publicly
        </label>
      </div>

      {/* industries */}
      <div className='space-y-2'>
        <IndustriesInput value={industries} onChange={setIndustries} />
        {/* Companion comma input (optional, doesn’t change your IndustriesInput) */}
        <div className='grid gap-1'>
          <label className='text-xs text-gray-500'>
            Or type industries separated by commas
          </label>
          <input
            value={industriesText}
            onChange={e => setIndustriesText(e.target.value)}
            onBlur={() => setIndustries(parseIndustriesText(industriesText))}
            placeholder='e.g. tech, marketing, finance'
            className='w-full rounded-xl border px-3 py-2 text-sm'
          />
          <p className='text-xs text-gray-500'>
            We’ll convert this into tags for you.
          </p>
        </div>
      </div>

      {/* images */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <ProfileImagePicker
          label='Avatar'
          purpose='avatar'
          value={avatarKey}
          onChange={applyAvatar}
          previewUrl={avatarPreviewUrl}
        />
        <ProfileImagePicker
          label='Banner'
          purpose='banner'
          value={bannerKey}
          onChange={applyBanner}
          previewUrl={bannerPreviewUrl}
        />
      </div>

      {serverError ? (
        <p className='text-sm text-red-600'>{serverError}</p>
      ) : null}

      <div className='flex gap-3'>
        <button
          type='submit'
          disabled={busy}
          className='px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50'
        >
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
