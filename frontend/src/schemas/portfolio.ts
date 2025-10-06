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
const PublishStatus = z.enum(['DRAFT', 'PRIVATE', 'PUBLISHED']); // 👈 add

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

export const createPortfolioSchema = z.object({
  slug: z.string().min(1).max(120).optional(), // 👈 add
  publishStatus: PublishStatus.optional(), // 👈 add

  title: z.string().min(1).max(120),
  description: nullableToUndef(z.string().max(2000).optional()),
  mainImageKey: z.string().optional(),
  tags: z.array(z.string().min(1)).optional(),
  subImages: z.array(subImageSchema).optional(),
  videoLinks: z.array(videoLinkSchema).optional(),
  projects: z.array(projectSchema).optional()
});

export type PortfolioFormValues = z.infer<typeof createPortfolioSchema>;
