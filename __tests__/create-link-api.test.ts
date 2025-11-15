import { NextRequest } from 'next/server';

const envBackup = { ...process.env };

describe('POST /api/links', () => {
  beforeAll(() => {
    process.env.ADMIN_TOKEN = 'test-token';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
    process.env.JWT_SECRET = 'secret';
    process.env.NEXT_PUBLIC_DOMAIN = 'http://localhost:3000';
  });

  afterAll(() => {
    Object.assign(process.env, envBackup);
  });

  it('rejects duplicate slugs', async () => {
    const { POST } = await import('@/app/api/links/route');

    const headers = new Headers({
      'content-type': 'application/json',
      'x-admin-token': 'test-token',
      'x-forwarded-for': '1.1.1.1'
    });

    const request = new NextRequest('http://localhost/api/links', {
      method: 'POST',
      headers,
      body: JSON.stringify({ destination: 'https://example.com', slug: 'customslug' })
    });

    const response = await POST(request);
    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.error).toMatch(/Slug already exists/);
  });
});

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(async () => ({ success: true, remaining: 10, reset: Date.now() + 1000 }))
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    link: {
      findUnique: jest.fn().mockResolvedValueOnce({ id: '123', slug: 'customslug' }),
      create: jest.fn()
    }
  }
}));
