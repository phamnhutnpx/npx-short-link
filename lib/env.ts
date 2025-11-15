import { z } from 'zod';

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ADMIN_TOKEN: z.string().min(1, 'ADMIN_TOKEN is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  REDIS_URL: z.string().optional().nullable(),
  GEOIP_DB_PATH: z.string().optional().nullable()
});

const publicSchema = z.object({
  NEXT_PUBLIC_DOMAIN: z.string().url().default('http://localhost:3000')
});

type Env = z.infer<typeof serverSchema> & z.infer<typeof publicSchema>;

function loadEnv(): Env {
  const parsedServer = serverSchema.safeParse(process.env);
  if (!parsedServer.success) {
    const formatted = parsedServer.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid server environment variables:\n${formatted}`);
  }

  const parsedPublic = publicSchema.safeParse(process.env);
  if (!parsedPublic.success) {
    const formatted = parsedPublic.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid public environment variables:\n${formatted}`);
  }

  return {
    ...parsedServer.data,
    ...parsedPublic.data
  } as Env;
}

export const env = loadEnv();
