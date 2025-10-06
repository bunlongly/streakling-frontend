// src/schemas/portfolio.ts
import { z } from 'zod';

export const VIDEO_PLATFORMS = [
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

const SocialPlatform = z.enum(VIDEO_PLATFORMS);

// ⚠️ rename to avoid name collision with TS type PublishStatus
export const PublishStatusZ = z.enum([
  'DRAFT',
  'PRIVATE',
  'PUBLISHED'
] as const);

// helper: convert null -> undefined (so optional stays optional)
const nullableToUndef = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullable().transform(v => (v == null ? undefined : v));

const subImageSchema = z.object({
  key: z.string().min(1),
  url: z.string().url(),
  sortOrder: z.number().int().min(0).optional()
});

const videoLinkSchema = z.object({
  platform: SocialPlatform,
  url: z.string().url(),
  description: nullableToUndef(z.string().max(300).optional())
});

const projectSchema = z.object({
  title: z.string().min(1).max(160),
  description: nullableToUndef(z.string().max(4000).optional()),
  mainImageKey: z.string().optional(),
  tags: z.array(z.string().min(1)).optional(),
  subImages: z.array(subImageSchema).optional(),
  videoLinks: z.array(videoLinkSchema).optional()
});

/** About block (copied from a card if desired) */
const aboutSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.string().optional(),
    shortBio: z.string().optional(),
    company: z.string().optional(),
    university: z.string().optional(),
    country: z.string().optional(),
    avatarKey: z.string().optional(),
    bannerKey: z.string().optional()
  })
  .optional();

/**
 * Keep dates as "YYYY-MM-DD" strings to match <input type="date"> and avoid
 * “expected date, received Date” issues.
 */
const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

const expSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional(),
  startDate: nullableToUndef(dateString.optional()),
  endDate: nullableToUndef(dateString.optional()),
  current: z.boolean().optional(),
  summary: z.string().optional()
});

const eduSchema = z.object({
  school: z.string().min(1),
  degree: z.string().optional(),
  field: z.string().optional(),
  startDate: nullableToUndef(dateString.optional()),
  endDate: nullableToUndef(dateString.optional()),
  summary: z.string().optional()
});

/** CREATE */
export const createPortfolioSchema = z.object({
  slug: z.string().min(1).max(120).optional(),
  publishStatus: PublishStatusZ.optional(),

  title: z.string().min(1).max(120),
  description: nullableToUndef(z.string().max(2000).optional()),
  mainImageKey: z.string().optional(),
  tags: z.array(z.string().min(1)).optional(),
  subImages: z.array(subImageSchema).optional(),
  videoLinks: z.array(videoLinkSchema).optional(),
  projects: z.array(projectSchema).optional(),

  about: aboutSchema,
  experiences: z.array(expSchema).optional(),
  educations: z.array(eduSchema).optional(),

  /** convenience: if provided, server will read user-owned card and fill `about` */
  prefillFromCardId: z.string().optional()
});

/** UPDATE (partial of create, but slug/title remain validated if present) */
export const updatePortfolioSchema = z.object({
  slug: z.string().min(1).max(120).optional(),
  publishStatus: PublishStatusZ.optional(),

  title: z.string().min(1).max(120).optional(),
  description: nullableToUndef(z.string().max(2000).optional()),
  mainImageKey: z.string().optional(),
  tags: z.array(z.string().min(1)).optional(),
  subImages: z.array(subImageSchema).optional(),
  videoLinks: z.array(videoLinkSchema).optional(),
  projects: z.array(projectSchema).optional(),

  about: aboutSchema,
  experiences: z.array(expSchema).optional(),
  educations: z.array(eduSchema).optional()
});

export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;
export type PortfolioFormValues = CreatePortfolioInput;
