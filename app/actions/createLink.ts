'use server';

import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createLinkSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateSlug } from '@/lib/slug';
import { logger } from '@/lib/logger';

function formDataToObject(formData: FormData) {
  const data: Record<string, FormDataEntryValue> = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });
  return data;
}

type ActionResult =
  | {
      ok: true;
      message: string;
      shortUrl: string;
      slug: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function createLinkAction(formData: FormData): Promise<ActionResult> {
  const headerList = headers();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  const rateResult = await checkRateLimit(`create:${ip}`);
  if (!rateResult.success) {
    return {
      ok: false,
      error: 'Rate limit exceeded. Please wait before creating another link.'
    };
  }

  const input = formDataToObject(formData);
  const parseResult = createLinkSchema.safeParse({
    destination: input.destination,
    slug: input.slug,
    expiresAt: input.expiresAt,
    title: input.title,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
    utmTerm: input.utmTerm,
    utmContent: input.utmContent
  });

  if (!parseResult.success) {
    return {
      ok: false,
      error: parseResult.error.issues.map((issue) => issue.message).join(', ')
    };
  }

  const data = parseResult.data;
  let slug = data.slug;

  if (slug) {
    const existing = await prisma.link.findUnique({ where: { slug } });
    if (existing) {
      return {
        ok: false,
        error: 'Slug already in use. Please choose another.'
      };
    }
  }

  if (!slug) {
    let unique = false;
    let attempts = 0;
    while (!unique && attempts < 10) {
      const candidate = generateSlug();
      const exists = await prisma.link.findUnique({ where: { slug: candidate } });
      if (!exists) {
        slug = candidate;
        unique = true;
      }
      attempts += 1;
      if (attempts > 5 && !unique) {
        logger.warn('High collision rate while generating slug', { attempts });
      }
    }
  }

  if (!slug) {
    return {
      ok: false,
      error: 'Failed to generate unique slug. Try again.'
    };
  }

  const link = await prisma.link.create({
    data: {
      slug,
      destination: data.destination,
      expiresAt: data.expiresAt,
      title: data.title,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      utmTerm: data.utmTerm,
      utmContent: data.utmContent
    }
  });

  logger.info('Created link via server action', { id: link.id, slug: link.slug });

  const domain = process.env.NEXT_PUBLIC_DOMAIN ?? 'http://localhost:3000';
  return {
    ok: true,
    message: 'Short link created successfully',
    shortUrl: `${domain}/r/${slug}`,
    slug
  };
}
