import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/api-response';
import { isAuthorizedAdmin } from '@/lib/auth';

type RouteParams = {
  params: {
    slug: string;
  };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const token = request.headers.get('x-admin-token');
  if (!isAuthorizedAdmin(token)) {
    return jsonResponse(401, { success: false, error: 'Unauthorized' });
  }

  const link = await prisma.link.findUnique({
    where: { slug: params.slug },
    include: {
      clicks: {
        take: 10,
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!link) {
    return jsonResponse(404, { success: false, error: 'Link not found' });
  }

  return jsonResponse(200, { success: true, data: link });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const token = request.headers.get('x-admin-token');
  if (!isAuthorizedAdmin(token)) {
    return jsonResponse(401, { success: false, error: 'Unauthorized' });
  }

  const link = await prisma.link.findUnique({ where: { slug: params.slug } });
  if (!link) {
    return jsonResponse(404, { success: false, error: 'Link not found' });
  }

  await prisma.click.deleteMany({ where: { linkId: link.id } });
  await prisma.link.delete({ where: { id: link.id } });

  return jsonResponse(200, { success: true, data: { slug: params.slug } });
}
