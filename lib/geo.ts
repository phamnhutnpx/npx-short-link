import { logger } from './logger';

export async function lookupCountry(ip?: string | null): Promise<string | null> {
  if (!ip) return null;

  // TODO: Integrate GeoIP provider (e.g., MaxMind, IPStack).
  logger.warn('Geo lookup not configured. Returning null country.', { ip });
  return null;
}
