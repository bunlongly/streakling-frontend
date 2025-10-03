import { z } from 'zod';

export const digitalCardSchema = z.object({
  // identity / routing
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),

  // names, handle, role
  firstName: z.string().min(1, 'First name is required').max(80),
  lastName: z.string().min(1, 'Last name is required').max(80),
  appName: z.string().min(1, 'Handle is required').max(50),
  role: z.string().min(1, 'Role is required').max(80),

  // enums
  status: z.enum(['STUDENT', 'GRADUATE', 'WORKING']),
  publishStatus: z.enum(['DRAFT', 'PUBLISHED']),

  // content
  shortBio: z.string().max(200, 'Max 200 characters').optional().default(''),
  company: z.string().optional().nullable(),
  university: z.string().optional().nullable(),
  country: z.string().optional().nullable(),

  // sensitive values
  phone: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),

  // per-field visibility
  showPhone: z.boolean().default(false),
  showReligion: z.boolean().default(false),
  showCompany: z.boolean().default(true),
  showUniversity: z.boolean().default(true),
  showCountry: z.boolean().default(true),

  // uploaded assets (S3 keys)
  avatarKey: z.string().optional().nullable(),
  bannerKey: z.string().optional().nullable()
});

export type DigitalCardFormValues = z.infer<typeof digitalCardSchema>;
