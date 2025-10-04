// src/schemas/digitalCard.ts
import { z } from 'zod';

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
  id: z.string().cuid().optional(),
  platform: z.enum(SOCIAL_PLATFORMS),
  handle: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  label: z.string().max(50).optional(),
  isPublic: z.boolean().optional(), // let the form send true/false
  sortOrder: z.number().int().min(0).optional()
});

export const digitalCardSchema = z.object({
  // required core
  slug: z.string().min(3).max(64),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  appName: z.string().min(1),
  role: z.string().min(1),
  status: z.enum(['STUDENT', 'GRADUATE', 'WORKING']),
  // IMPORTANT: required — do NOT use .default() to avoid resolver optionality
  publishStatus: z.enum(['DRAFT', 'PRIVATE', 'PUBLISHED']),
  shortBio: z.string().min(1).max(300),

  // optional profile
  company: z.string().optional(),
  university: z.string().optional(),
  country: z.string().optional(),
  religion: z.string().optional(),
  phone: z.string().optional(),

  // visibility flags (booleans are required in the final type)
  showPhone: z.boolean(),
  showReligion: z.boolean(),
  showCompany: z.boolean(),
  showUniversity: z.boolean(),
  showCountry: z.boolean(),

  // media
  avatarKey: z.string().optional(),
  bannerKey: z.string().optional(),

  // socials
  socials: z.array(socialAccountSchema)
});

export type DigitalCardFormValues = z.infer<typeof digitalCardSchema>;
export type SocialAccountForm = z.infer<typeof socialAccountSchema>;
