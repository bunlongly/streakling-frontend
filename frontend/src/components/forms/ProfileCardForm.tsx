'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import {
  digitalCardSchema,
  type DigitalCardFormValues
} from '@/schemas/digitalCard';

type Props = {
  id?: string; // if provided -> update, else create
  initial?: Partial<DigitalCardFormValues>;
};

export default function ProfileCardForm({ initial, id }: Props) {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<DigitalCardFormValues>({
    resolver: zodResolver(digitalCardSchema),
    defaultValues: {
      slug: '',
      status: 'WORKING',
      publishStatus: 'DRAFT',
      showPhone: false,
      showReligion: false,
      showCompany: true,
      showUniversity: true,
      showCountry: true,
      ...initial
    }
  });

  const onSubmit = async (values: DigitalCardFormValues) => {
    setServerMessage(null);
    setLoading(true);
    try {
      const res = id
        ? await api.card.updateById(id, values)
        : await api.card.create(values);
      setServerMessage(res.message || 'Saved');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save';
      setServerMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='grid gap-4'>
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
          Lowercase, numbers, hyphens (e.g. <code>my-card</code>).
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
            <option value='PUBLISHED'>Published</option>
          </select>
        </div>
      </div>

      {/* Short bio */}
      <div className='grid gap-2'>
        <label htmlFor='shortBio'>Short bio (≤200)</label>
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

      <button disabled={loading} className='btn mt-2'>
        {loading ? 'Saving…' : id ? 'Update card' : 'Create card'}
      </button>

      {serverMessage && <p className='mt-2'>{serverMessage}</p>}
    </form>
  );
}
