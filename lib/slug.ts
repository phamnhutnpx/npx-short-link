const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
const ALPHABET_LENGTH = ALPHABET.length;

export const SLUG_PATTERN = /^[A-Za-z0-9-_]{4,64}$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function generateSlug(length = 6): string {
  if (length < 4 || length > 64) {
    throw new Error('Slug length must be between 4 and 64 characters.');
  }

  let slug = '';
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * ALPHABET_LENGTH);
    slug += ALPHABET[index];
  }
  return slug;
}
