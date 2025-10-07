import { z } from 'zod';

/** Frontend version of the profile update schema */
const emptyToUndef = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

const optTrimUndef = z.preprocess(emptyToUndef, z.string().trim().optional());

const usernameSchema = z.preprocess(
  emptyToUndef,
  z
    .string()
    .trim()
    .regex(
      /^[a-z0-9_-]{3,30}$/i,
      'Use 3–30 letters, numbers, underscore or dash'
    )
    .optional()
);

const dateStringSchema = z.preprocess(
  emptyToUndef,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
);

const nullableKey = z.union([z.string().trim().min(1), z.null()]).optional();

const industriesInput = z
  .union([
    z.array(z.string().min(1)),
    z.preprocess(
      v =>
        typeof v === 'string'
          ? v
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
          : v,
      z.array(z.string().min(1))
    )
  ])
  .optional();

export const updateMyProfileSchema = z
  .object({
    username: usernameSchema,
    displayName: optTrimUndef,
    email: z.preprocess(emptyToUndef, z.string().email().optional()),
    phone: optTrimUndef,
    country: optTrimUndef,
    religion: optTrimUndef,
    dateOfBirth: dateStringSchema,

    avatarKey: nullableKey,
    bannerKey: nullableKey,

    showEmail: z.boolean().optional(),
    showReligion: z.boolean().optional(),
    showDateOfBirth: z.boolean().optional(),
    showPhone: z.boolean().optional(),
    showCountry: z.boolean().optional(),

    industries: industriesInput
  })
  .strict();

export type UpdateMyProfileFormValues = z.infer<typeof updateMyProfileSchema>;
