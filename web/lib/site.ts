/**
 * Canonical site config for SEO, analytics, and absolute URLs.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://suburbsense.nz).
 */
export const SITE_NAME = "Suburb Sense";
export const SITE_TAGLINE = "Make sense of safety where you live";
export const SITE_DESCRIPTION =
  "Reported crime trends, rates per 1,000 residents, and practical safety guidance for New Zealand suburbs — from open NZ Police victimisation data.";

/** Shared content column: ~1152px on desktop; full width + safe gutters on mobile. */
export const SITE_SHELL_CLASS = "site-shell mx-auto w-full min-w-0 max-w-6xl";

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
