// src/app/(onboarding)/username/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, HttpError } from '@/lib/api';

import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Stack,
  Button,
  Typography,
  InputAdornment,
  Chip,
  Fade,
  Divider
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';

import TextFieldPro from '@/components/ui/TextFieldPro';
import Flash, { type FlashKind } from '@/components/ui/Flash';

// ---------------- Schema ----------------
const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be at most 32 characters')
    .regex(
      /^[a-z0-9_-]+$/,
      'Only lowercase letters, numbers, hyphen, underscore'
    )
});
type UsernameFormValues = z.infer<typeof usernameSchema>;

// Normalize to what your backend expects
function normalizeUsername(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '')
    .slice(0, 32);
}

// Some fun, safe suggestions
const SUGGESTIONS = ['creator', 'maker', 'dev', 'artist', 'writer', 'designer'];

export default function UsernameOnboardingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';

  const [busy, setBusy] = useState(false);
  const [flashOpen, setFlashOpen] = useState(false);
  const [flashKind, setFlashKind] = useState<FlashKind>('success');
  const [flashMsg, setFlashMsg] = useState<string | null>(null);

  const flash = (kind: FlashKind, msg: string) => {
    setFlashKind(kind);
    setFlashMsg(msg);
    setFlashOpen(true);
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting, isDirty }
  } = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: '' },
    mode: 'onChange' // instant validation UX
  });

  const username = watch('username') || '';
  const urlPreview = useMemo(
    () => (username ? `/u/${username}` : '/u/your-handle'),
    [username]
  );
  const canContinue = isValid && !busy && !isSubmitting;

  async function onSubmit(values: UsernameFormValues) {
    setBusy(true);
    try {
      await api.profile.update({ username: values.username });
      flash('success', 'Username saved! Redirecting…');
      setTimeout(() => router.replace(next), 550);
    } catch (e: unknown) {
      const msg =
        e instanceof HttpError
          ? e.message
          : e instanceof Error
          ? e.message
          : 'Failed to set username';
      flash('error', msg);
    } finally {
      setBusy(false);
    }
  }

  const pickSuggestion = (slug: string) => {
    const normalized = normalizeUsername(slug);
    setValue('username', normalized, {
      shouldDirty: true,
      shouldValidate: true
    });
  };

  return (
    <Box
      sx={{
        px: 2,
        py: { xs: 6, md: 10 },
        display: 'grid',
        placeItems: 'start center',
        gap: 3
      }}
    >
      {/* Hero header */}
      <Box
        sx={{
          textAlign: 'center',
          mb: 1,
          background:
            'radial-gradient(800px 400px at 10% -20%, rgba(123,57,232,0.12), transparent), radial-gradient(600px 300px at 90% 0%, rgba(45,105,234,0.10), transparent)',
          borderRadius: 4,
          p: { xs: 3, md: 4 },
          maxWidth: 720,
          width: '100%'
        }}
      >
        <Typography
          variant='h4'
          sx={{ fontWeight: 700, letterSpacing: '-0.01em', mb: 0.5 }}
        >
          Claim your username
        </Typography>
        <Typography color='text.secondary'>
          Your username becomes your public profile URL. You can change it
          later.
        </Typography>
      </Box>

      {/* Card */}
      <Card
        variant='outlined'
        sx={{
          width: '100%',
          maxWidth: 720,
          mx: 'auto',
          borderRadius: 3,
          borderColor: 'rgba(10,10,15,0.1)',
          boxShadow:
            '0 2px 8px rgba(10,10,15,0.06), 0 18px 36px rgba(10,10,15,0.08)',
          backdropFilter: 'saturate(140%) blur(2px)'
        }}
      >
        <CardHeader
          avatar={<PersonOutlineRoundedIcon color='primary' />}
          title='Pick your username'
          subheader='Keep it short and memorable. Lowercase only.'
          sx={{ pb: 0 }}
        />
        <CardContent>
          <form
            noValidate
            onSubmit={e => {
              e.preventDefault();
              void handleSubmit(onSubmit)(e);
            }}
          >
            <Stack spacing={2.5}>
              <TextFieldPro
                label='Username'
                placeholder='your-handle'
                {...register('username', {
                  onChange: e => {
                    const normalized = normalizeUsername(e.target.value);
                    if (normalized !== e.target.value) {
                      // force normalized value into the field
                      setValue('username', normalized, {
                        shouldDirty: true,
                        shouldValidate: true
                      });
                    }
                  }
                })}
                error={!!errors.username}
                helperText={
                  errors.username?.message ??
                  'Allowed: lowercase letters, numbers, hyphen (-), underscore (_).'
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>@</InputAdornment>
                  )
                }}
              />

              {/* URL preview */}
              <Fade in timeout={250}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.25,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid rgba(10,10,15,0.08)'
                  }}
                >
                  {errors.username ? (
                    <ErrorOutlineRoundedIcon color='error' fontSize='small' />
                  ) : username.length >= 3 ? (
                    <CheckCircleRoundedIcon color='success' fontSize='small' />
                  ) : (
                    <PersonOutlineRoundedIcon
                      color='disabled'
                      fontSize='small'
                    />
                  )}
                  <Typography variant='body2' color='text.secondary'>
                    Your URL will be{' '}
                    <code style={{ fontSize: 13 }}>{urlPreview}</code>
                  </Typography>
                </Box>
              </Fade>

              {/* Suggestions */}
              <Stack direction='row' flexWrap='wrap' gap={1}>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ mr: 1 }}
                >
                  Quick picks:
                </Typography>
                {SUGGESTIONS.map(s => (
                  <Chip
                    key={s}
                    label={s}
                    variant='outlined'
                    onClick={() => pickSuggestion(s)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'primary.main', color: 'white' }
                    }}
                  />
                ))}
              </Stack>

              <Divider />

              <Button
                type='submit'
                variant='contained'
                color='primary'
                size='large'
                disabled={!canContinue}
                sx={{
                  alignSelf: 'start',
                  px: 3,
                  boxShadow: '0 8px 24px rgba(123,57,232,0.22)',
                  ':disabled': { boxShadow: 'none' }
                }}
              >
                {busy ? 'Saving…' : 'Continue'}
              </Button>

              <Typography variant='caption' color='text.secondary'>
                You can change this later in Settings → Profile.
              </Typography>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {/* Flash toaster */}
      <Flash
        open={flashOpen}
        kind={flashKind}
        message={flashMsg}
        onClose={() => setFlashOpen(false)}
      />
    </Box>
  );
}
