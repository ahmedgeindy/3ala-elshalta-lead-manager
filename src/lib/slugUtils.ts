export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug) return { valid: false, error: 'Slug is required' };
  if (!/^[a-z0-9-]+$/.test(slug))
    return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
  if (slug.length < 3 || slug.length > 60)
    return { valid: false, error: 'Slug must be between 3 and 60 characters' };
  if (slug.startsWith('-') || slug.endsWith('-'))
    return { valid: false, error: 'Slug cannot start or end with a hyphen' };
  if (slug.includes('--'))
    return { valid: false, error: 'Slug cannot contain consecutive hyphens' };
  return { valid: true };
}

export function generateSlug(from: string): string {
  return from
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}