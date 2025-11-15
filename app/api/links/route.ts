import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createLinkSchema } from '@/lib/validation';
import { generateSlug } from '@/lib/slug';
import { jsonResponse } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';
import { isAuthorizedAdmin } from '@/lib/auth';
import { getClientIp } from '@/lib/request-utils';

const SHORT_LINK_LIMIT = 60; // per hour per IP

export async function GET(request: NextRequest) {
  const token = request.headers.get('x-admin-token');
  if (!isAuthorizedAdmin(token)) {
    return jsonResponse(401, { success: false, error: 'Unauthorized' });
  }

  const links = await prisma.link.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return jsonResponse(200, { success: true, data: links });
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('x-admin-token');
  if (!isAuthorizedAdmin(token)) {
    return jsonResponse(401, { success: false, error: 'Unauthorized' });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse(400, { success: false, error: 'Invalid JSON payload' });
  }

  const clientIp = getClientIp(request) ?? 'unknown';
  const rate = await checkRateLimit(`admin-create:${clientIp}`, SHORT_LINK_LIMIT);
  if (!rate.success) {
    return jsonResponse(429, {
      success: false,
      error: 'Rate limit exceeded. Try again later.',
      meta: { reset: rate.reset }
    });
  }

  const parsed = createLinkSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(422, {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join(', ')
    });
  }

  const data = parsed.data;
  let slug = data.slug;

  if (slug) {
    const existing = await prisma.link.findUnique({ where: { slug } });
    if (existing) {
      return jsonResponse(409, { success: false, error: 'Slug already exists' });
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
    }

    if (!unique || !slug) {
      logger.error('Failed to generate unique slug for API create', { attempts });
      return jsonResponse(500, { success: false, error: 'Failed to generate unique slug' });
    }
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

  const domain = env.NEXT_PUBLIC_DOMAIN ?? 'http://localhost:3000';

  return jsonResponse(201, {
    success: true,
    data: {
      ...link,
      shortUrl: `${domain}/r/${slug}`
    }
  });
}
