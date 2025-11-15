import { env } from './env';

export function isAuthorizedAdmin(token?: string | null): boolean {
  if (!token) return false;
  return token === env.ADMIN_TOKEN;
}
