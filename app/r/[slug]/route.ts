import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { lookupCountry } from '@/lib/geo';
import { logger } from '@/lib/logger';
import { getClientIp, getReferrer, getUserAgent } from '@/lib/request-utils';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;

  const link = await prisma.link.findUnique({ where: { slug } });

  if (!link) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 });
  }

  const destinationUrl = link.destination;

  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);
  const referrer = getReferrer(request);
  const country = await lookupCountry(ip);

  await prisma
    .$transaction([
      prisma.click.create({
        data: {
          linkId: link.id,
          ip,
          userAgent,
          referrer,
          country,
        },
      }),
      prisma.link.update({
        where: { id: link.id },
        data: {
          clickCount: {
            increment: 1,
          },
        },
      }),
    ])
    .catch((error: unknown) => {
      logger.error("Failed to log click analytics", {
        error: error instanceof Error ? error.message : String(error),
        slug,
      });
    });

  return NextResponse.redirect(destinationUrl, { status: 301 });
}
