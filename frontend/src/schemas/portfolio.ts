import { z } from 'zod';

const emptyToUndef = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(v => (v === '' ? undefined : v), schema);

export const VIDEO_PLATFORMS = [
  'TIKTOK',
  'YOUTUBE',
  'TWITTER',
  'INSTAGRAM',
  'FACEBOOK',
  'LINKEDIN',
  'GITHUB',
  'PERSONAL',
  'OTHER'
] as const;

export const portfolioImageSchema = z.object({
  id: z.string().cuid().optional(),
  key: z.string().min(1),
  url: z.string().url(),
  sortOrder: z.number().int().optional()
});

export const portfolioVideoSchema = z.object({
  id: z.string().cuid().optional(),
  platform: z.enum(VIDEO_PLATFORMS),
  url: z.string().url(),
  description: emptyToUndef(z.string().max(500).optional()),
  thumbnailUrl: emptyToUndef(z.string().url().optional())
});

export const createPortfolioSchema = z.object({
  title: z.string().min(1).max(120),
  description: emptyToUndef(z.string().max(2000).optional()),
  mainImageKey: emptyToUndef(z.string().optional()),
  subImages: z.array(portfolioImageSchema).max(12).optional(),
  videoLinks: z.array(portfolioVideoSchema).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional()
});

export type PortfolioFormValues = z.infer<typeof createPortfolioSchema>;
export const updatePortfolioSchema = createPortfolioSchema.partial();
export type UpdatePortfolioFormValues = z.infer<typeof updatePortfolioSchema>;
