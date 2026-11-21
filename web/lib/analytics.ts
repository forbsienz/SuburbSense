/**
 * Client-side event helpers. No-ops when GA is not configured.
 * Events appear in GA4 → Reports → Engagement → Events.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsEvent =
  | { name: "address_search"; params?: { has_result?: boolean } }
  | { name: "address_resolve"; params?: { success: boolean } }
  | { name: "area_view"; params: { slug: string } }
  | { name: "crime_filter"; params: { type: string } }
  | { name: "safety_guide_open"; params: { type: string } };

export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", event.name, event.params ?? {});
}
