import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";

/**
 * Production analytics stack:
 * - Vercel Analytics: privacy-friendly page views / Web Vitals (works on Vercel)
 * - GA4: deeper funnels when NEXT_PUBLIC_GA_MEASUREMENT_ID is set
 */
export function SiteAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  return (
    <>
      <Analytics />
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </>
  );
}
