// src/schemas/digitalCard.ts
import { z } from 'zod';

/** Helpers: treat empty string as undefined so optional() works with forms */
const emptyToUndef = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    v => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    schema
  );

const emptyString = emptyToUndef(z.string());
const emptyUrl = emptyToUndef(z.string().url());

/** FIXED: inner schema is optional so undefined is accepted post-preprocess */
const labelCoerce = z.preprocess(v => {
  if (typeof v === 'string') {
    const t = v.trim();
    return t === '' ? undefined : t;
  }
  return undefined;
}, z.string().max(50).optional());

export const SOCIAL_PLATFORMS = [
  'TWITTER',
  'INSTAGRAM',
  'FACEBOOK',
  'LINKEDIN',
  'TIKTOK',
  'YOUTUBE',
  'GITHUB',
  'PERSONAL',
  'OTHER'
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const socialAccountSchema = z.object({
  id: z.union([z.string().cuid(), z.string().uuid(), z.string()]).optional(),
  platform: z.enum(SOCIAL_PLATFORMS),
  handle: emptyToUndef(z.string().min(1).max(100)).optional(),
  url: emptyUrl.optional(),
  /** Use the fixed labelCoerce (no extra .optional() needed) */
  label: labelCoerce,
  isPublic: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional()
});

export const digitalCardSchema = z.object({
  slug: z.string().min(3).max(64),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  appName: z.string().min(1),
  role: z.string().min(1),
  status: z.enum(['STUDENT', 'GRADUATE', 'WORKING']),
  publishStatus: z.enum(['DRAFT', 'PRIVATE', 'PUBLISHED']),
  shortBio: z.string().min(1).max(300),

  company: emptyString.optional(),
  university: emptyString.optional(),
  country: emptyString.optional(),
  religion: emptyString.optional(),
  phone: emptyString.optional(),

  showPhone: z.boolean(),
  showReligion: z.boolean(),
  showCompany: z.boolean(),
  showUniversity: z.boolean(),
  showCountry: z.boolean(),

  avatarKey: emptyString.optional(),
  bannerKey: emptyString.optional(),

  socials: z.array(socialAccountSchema)
});

export type DigitalCardFormValues = z.infer<typeof digitalCardSchema>;
export type SocialAccountForm = z.infer<typeof socialAccountSchema>;
