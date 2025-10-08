import { z } from 'zod';
import { zOptionalDate } from './_date';

// Reusable helpers
const zUrl = z.string().url();

// ---- Create / Update Challenge ----
// Notes:
// - slug is NOT required here; backend generates a unique slug when omitted.
// - publishStatus allows 'PRIVATE' now.
// - images: up to 6 items, each with key/url/sortOrder.

export const challengeImageSchema = z.object({
  key: z.string().min(1),
  url: z.string().min(1),
  sortOrder: z.number().int().min(0).optional()
});

export const createChallengeSchema = z.object({
  // slug optional: backend can slugify title
  slug: z.string().trim().min(1).optional(),

  title: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  brandName: z.string().optional().nullable(),
  brandLogoKey: z.string().optional().nullable(),

  postingUrl: zUrl.optional().nullable(),

  // store as JSON array; allow null/empty
  targetPlatforms: z
    .array(z.string().trim().toLowerCase())
    .optional()
    .nullable(),

  goalViews: z.number().int().nonnegative().optional().nullable(),
  goalLikes: z.number().int().nonnegative().optional().nullable(),

  // accepts 'YYYY-MM-DD' or full ISO (via zOptionalDate)
  deadline: zOptionalDate.optional().nullable(),

  publishStatus: z.enum(['DRAFT', 'PRIVATE', 'PUBLISHED']).optional(),
  status: z.enum(['OPEN', 'CLOSED', 'ARCHIVED']).optional(),

  prizes: z
    .array(
      z.object({
        rank: z.number().int().positive(),
        label: z.string().optional().nullable(),
        amountCents: z.number().int().nonnegative().optional().nullable(),
        notes: z.string().optional().nullable()
      })
    )
    .optional(),

  // NEW: up to 6 images
  images: z.array(challengeImageSchema).max(6).optional()
});

export const updateChallengeSchema = createChallengeSchema.partial();

// ---- Submission ----
// No username; server snapshots name/phone/socials
export const submitEntrySchema = z.object({
  platform: z.string().trim().min(1),
  linkUrl: zUrl.optional(),
  imageKey: z.string().optional(),
  notes: z.string().optional()
});
