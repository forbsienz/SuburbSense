/**
 * Safe slug for filesystem paths: lowercase letters, digits, hyphens only.
 * Rejects path traversal (`..`, `/`, `\`) and empty values.
 */
export function isSafeSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
