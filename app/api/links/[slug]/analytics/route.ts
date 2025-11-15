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

  const link = await prisma.link.findUnique({ where: { slug: params.slug } });
  if (!link) {
    return jsonResponse(404, { success: false, error: 'Link not found' });
  }

  const clicks = await prisma.click.findMany({
    where: { linkId: link.id },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return jsonResponse(200, { success: true, data: clicks });
}
