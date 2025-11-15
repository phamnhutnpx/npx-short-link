import { z } from 'zod';
import { SLUG_PATTERN } from './slug';

export const urlSchema = z
  .string()
  .url('Destination must be a valid URL')
  .refine((value) => /^https?:\/\//i.test(value), {
    message: 'Only http and https schemes are allowed.'
  });

const expiresPreprocessor = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length === 0 || !Number.isNaN(new Date(value).valueOf()), {
    message: 'Expiration must be a valid datetime.'
  })
  .transform((value) => (value.length === 0 ? undefined : new Date(value)));

export const slugSchema = z
  .string()
  .regex(SLUG_PATTERN, 'Slug must be 4-64 characters (letters, numbers, - or _).');

export const createLinkSchema = z.object({
  destination: urlSchema,
  slug: z.string().trim().optional().transform((val) => (val === '' ? undefined : val)),
  expiresAt: z.union([expiresPreprocessor, z.date()]).optional().transform((value) => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    const date = value as unknown as Date;
    return date;
  }),
  title: z.string().trim().max(120).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
  utmTerm: z.string().trim().max(120).optional(),
  utmContent: z.string().trim().max(120).optional()
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
