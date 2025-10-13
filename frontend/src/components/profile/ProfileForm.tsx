'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, type SubmitErrorHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { PublicProfile } from '@/types/profile';
import { api } from '@/lib/api';
import {
  updateMyProfileSchema,
  type UpdateMyProfileFormValues
} from '@/schemas/profile';
import ImageUploader from '@/components/uploader/ImageUploader';
import IndustriesInput from './IndustriesInput';

import {
  Box,
  Card,
  CardHeader,
  CardContent,
  FormControlLabel,
  Checkbox,
  Divider,
  Typography,
  Stack,
  Button
} from '@mui/material';

import TextFieldPro from '@/components/ui/TextFieldPro';
import Flash, { type FlashKind } from '@/components/ui/Flash';

type OwnerFields = Partial<{
  email: string | null;
  country: string | null;
  religion: string | null;
  dateOfBirth: string | null;
  phone: string | null;
}>;

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return 'Failed to update profile';
}

// Walk RHF/Zod error tree and grab the first message
function firstErrorMessage(errors: Record<string, unknown>): string | null {
  const walk = (node: unknown): string | null => {
    if (!node) return null;
    if (typeof node === 'object') {
      const rec = node as Record<string, unknown>;
      if (typeof rec.message === 'string') return rec.message;
      for (const v of Object.values(rec)) {
        const found = walk(v);
        if (found) return found;
      }
    } else if (Array.isArray(node)) {
      for (const v of node) {
        const found = walk(v);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(errors);
}

export default function ProfileForm({ initial }: { initial: PublicProfile }) {
  const initialWithOwner = initial as PublicProfile & OwnerFields;

  const [busy, setBusy] = useState(false);

  // Flash state
  const [flashOpen, setFlashOpen] = useState(false);
  const [flashKind, setFlashKind] = useState<FlashKind>('success');
  const [flashMsg, setFlashMsg] = useState<string | null>(null);
  const showFlash = (kind: FlashKind, msg: string) => {
    setFlashKind(kind);
    setFlashMsg(msg);
    setFlashOpen(true);
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UpdateMyProfileFormValues>({
    resolver: zodResolver(updateMyProfileSchema),
    defaultValues: {
      username: initial.username ?? '',
      displayName: initial.displayName ?? '',
      email: initialWithOwner.email ?? '',
      country: initialWithOwner.country ?? '',
      religion: initialWithOwner.religion ?? '',
      dateOfBirth: initialWithOwner.dateOfBirth ?? '',
      phone: initialWithOwner.phone ?? '',
      avatarKey: initial.avatarKey ?? null,
      bannerKey: initial.bannerKey ?? null,
      showEmail: initial.showEmail ?? false,
      showReligion: initial.showReligion ?? false,
      showDateOfBirth: initial.showDateOfBirth ?? false,
      showPhone: initial.showPhone ?? false,
      showCountry: initial.showCountry ?? true,
      industries: (initial.industries || []).map(i => i.slug)
    },
    mode: 'onSubmit'
  });

  const avatarKey = watch('avatarKey') ?? null;
  const bannerKey = watch('bannerKey') ?? null;
  const industries = watch('industries') ?? [];

  // keep a human-friendly edit field if you like (we don’t need it now with Autocomplete)

  const avatarUploaderKey = useMemo(
    () => `avatar-${avatarKey ?? 'none'}`,
    [avatarKey]
  );
  const bannerUploaderKey = useMemo(
    () => `banner-${bannerKey ?? 'none'}`,
    [bannerKey]
  );

  async function onSubmit(values: UpdateMyProfileFormValues) {
    setBusy(true);
    try {
      const payload: UpdateMyProfileFormValues & { industries: string[] } = {
        ...values,
        avatarKey: avatarKey ?? null,
        bannerKey: bannerKey ?? null,
        industries: industries as string[]
      };

      const res = await api.profile.update(payload);
      const updated = res.data as PublicProfile & OwnerFields;

      reset({
        username: updated.username ?? '',
        displayName: updated.displayName ?? '',
        email: updated.email ?? '',
        country: updated.country ?? '',
        religion: updated.religion ?? '',
        dateOfBirth: updated.dateOfBirth ?? '',
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

      showFlash('success', 'Profile saved!');
    } catch (e: unknown) {
      showFlash('error', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const onInvalid: SubmitErrorHandler<UpdateMyProfileFormValues> = errs => {
    const msg = firstErrorMessage(errs as unknown as Record<string, unknown>);
    showFlash('error', msg ?? 'Please fix the highlighted fields.');
  };

  return (
    <>
      <Box
        component='form'
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        sx={{ display: 'grid', gap: 3 }}
      >
        {/* Header */}
        <Box>
          <Typography variant='h5' fontWeight={600}>
            Edit Profile
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Update your public information, media, and privacy preferences.
          </Typography>
        </Box>

        {/* Media */}
        <Card variant='outlined' sx={{ boxShadow: 1 }}>
          <CardHeader title='Media' subheader='Upload your avatar and banner' />
          <CardContent>
            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }
              }}
            >
              <Stack spacing={1.5}>
                <ImageUploader
                  key={avatarUploaderKey}
                  label='Avatar'
                  category='profile'
                  purpose='avatar'
                  existingKey={avatarKey}
                  previewUrl={null}
                  onUploadedAction={(key: string) =>
                    setValue('avatarKey', key, {
                      shouldDirty: true,
                      shouldTouch: true
                    })
                  }
                />
                {avatarKey ? (
                  <Button
                    size='small'
                    variant='text'
                    onClick={() =>
                      setValue('avatarKey', null, {
                        shouldDirty: true,
                        shouldTouch: true
                      })
                    }
                  >
                    Remove avatar
                  </Button>
                ) : null}
              </Stack>

              <Stack spacing={1.5}>
                <ImageUploader
                  key={bannerUploaderKey}
                  label='Banner'
                  category='profile'
                  purpose='banner'
                  existingKey={bannerKey}
                  previewUrl={null}
                  onUploadedAction={(key: string) =>
                    setValue('bannerKey', key, {
                      shouldDirty: true,
                      shouldTouch: true
                    })
                  }
                />
                {bannerKey ? (
                  <Button
                    size='small'
                    variant='text'
                    onClick={() =>
                      setValue('bannerKey', null, {
                        shouldDirty: true,
                        shouldTouch: true
                      })
                    }
                  >
                    Remove banner
                  </Button>
                ) : null}
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Identity */}
        <Card variant='outlined' sx={{ boxShadow: 1 }}>
          <CardHeader title='Identity' />
          <CardContent>
            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }
              }}
            >
              <TextFieldPro
                label='Display name'
                {...register('displayName')}
                error={!!errors.displayName}
                helperText={errors.displayName?.message}
              />
              <TextFieldPro
                label='Username'
                placeholder='your-handle'
                {...register('username')}
                error={!!errors.username}
                helperText={
                  errors.username?.message ??
                  'letters, numbers, dash, underscore'
                }
              />
            </Box>
          </CardContent>
        </Card>

        {/* Contact & Meta */}
        <Card variant='outlined' sx={{ boxShadow: 1 }}>
          <CardHeader title='Contact & Meta' />
          <CardContent>
            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }
              }}
            >
              <TextFieldPro
                type='email'
                label='Email'
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <TextFieldPro
                label='Phone'
                {...register('phone')}
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
              <TextFieldPro
                label='Country'
                {...register('country')}
                error={!!errors.country}
                helperText={errors.country?.message}
              />
              <TextFieldPro
                label='Religion'
                {...register('religion')}
                error={!!errors.religion}
                helperText={errors.religion?.message}
              />
              <TextFieldPro
                type='date'
                label='Date of birth'
                InputLabelProps={{ shrink: true }}
                {...register('dateOfBirth')}
                error={!!errors.dateOfBirth}
                helperText={errors.dateOfBirth?.message}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card variant='outlined' sx={{ boxShadow: 1 }}>
          <CardHeader
            title='Privacy'
            subheader='Control what is visible on your public profile'
          />
          <CardContent>
            <Box
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr 1fr',
                  md: 'repeat(3, 1fr)'
                }
              }}
            >
              <FormControlLabel
                control={
                  <Controller
                    name='showEmail'
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={!!field.value}
                        onChange={e => field.onChange(e.target.checked)}
                      />
                    )}
                  />
                }
                label='Show email publicly'
              />
              <FormControlLabel
                control={
                  <Controller
                    name='showPhone'
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={!!field.value}
                        onChange={e => field.onChange(e.target.checked)}
                      />
                    )}
                  />
                }
                label='Show phone publicly'
              />
              <FormControlLabel
                control={
                  <Controller
                    name='showCountry'
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={!!field.value}
                        onChange={e => field.onChange(e.target.checked)}
                      />
                    )}
                  />
                }
                label='Show country publicly'
              />
              <FormControlLabel
                control={
                  <Controller
                    name='showReligion'
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={!!field.value}
                        onChange={e => field.onChange(e.target.checked)}
                      />
                    )}
                  />
                }
                label='Show religion publicly'
              />
              <FormControlLabel
                control={
                  <Controller
                    name='showDateOfBirth'
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        checked={!!field.value}
                        onChange={e => field.onChange(e.target.checked)}
                      />
                    )}
                  />
                }
                label='Show DOB publicly'
              />
            </Box>
          </CardContent>
        </Card>

        {/* Industries */}
        <Card variant='outlined' sx={{ boxShadow: 1 }}>
          <CardHeader
            title='Industries'
            subheader='Pick from suggestions or add your own'
          />
          <CardContent>
            <Stack spacing={2}>
              <IndustriesInput
                value={industries as string[]}
                onChange={vals =>
                  setValue('industries', vals, { shouldDirty: true })
                }
              />
              <Divider />
              <Typography variant='caption' color='text.secondary'>
                You can also press <b>Enter</b> or <b>Comma</b> to add a custom
                tag.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Actions */}
        <Stack direction='row' gap={2} justifyContent='flex-end'>
          <Button
            type='submit'
            variant='contained'
            color='primary'
            disabled={busy || isSubmitting}
          >
            {busy || isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </Stack>
      </Box>

      {/* Modern flash */}
      <Flash
        open={flashOpen}
        kind={flashKind}
        message={flashMsg}
        onClose={() => setFlashOpen(false)}
      />
    </>
  );
}
