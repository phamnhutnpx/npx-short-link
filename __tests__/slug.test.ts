import { generateSlug, isValidSlug } from '@/lib/slug';

describe('slug helpers', () => {
  it('generates slugs of the expected length and pattern', () => {
    const slug = generateSlug(6);
    expect(slug).toHaveLength(6);
    expect(isValidSlug(slug)).toBe(true);
  });

  it('throws when generating invalid length', () => {
    expect(() => generateSlug(2)).toThrow();
    expect(() => generateSlug(100)).toThrow();
  });
});
