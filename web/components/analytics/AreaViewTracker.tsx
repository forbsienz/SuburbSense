"use client";

import { trackEvent } from "@/lib/analytics";
import { useEffect } from "react";

/** Fires once per suburb brief mount for GA funnel analysis. */
export function AreaViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    trackEvent({ name: "area_view", params: { slug } });
  }, [slug]);

  return null;
}
