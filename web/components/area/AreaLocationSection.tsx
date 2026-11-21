"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { AreaBrief } from "@/lib/types";
import { clipDisplayText, isInNzBbox } from "@/lib/geo";

const AreaMap = dynamic(
  () => import("@/components/map/AreaMap").then((m) => m.AreaMap),
  {
    ssr: false,
    loading: () => (
      <div className="area-map area-map--placeholder">
        <p className="text-sm text-[var(--text-muted)]">Loading map…</p>
      </div>
    ),
  },
);

interface AreaLocationSectionProps {
  brief: AreaBrief;
}

export function AreaLocationSection({ brief }: AreaLocationSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAddress = searchParams.get("from") === "address";
  const formattedAddress = searchParams.get("address") ?? undefined;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const pinLatRaw = lat ? parseFloat(lat) : undefined;
  const pinLonRaw = lon ? parseFloat(lon) : undefined;
  const pinLat =
    pinLatRaw !== undefined &&
    pinLonRaw !== undefined &&
    isInNzBbox(pinLatRaw, pinLonRaw)
      ? pinLatRaw
      : undefined;
  const pinLon =
    pinLatRaw !== undefined &&
    pinLonRaw !== undefined &&
    isInNzBbox(pinLatRaw, pinLonRaw)
      ? pinLonRaw
      : undefined;

  const contextLine = useMemo(() => {
    if (fromAddress && formattedAddress) {
      return `Located from address: ${clipDisplayText(formattedAddress)}`;
    }
    return `Current suburb: ${brief.display_name}`;
  }, [fromAddress, formattedAddress, brief.display_name]);

  const handleSuburbSelect = useCallback(
    (slug: string, hasBrief: boolean) => {
      if (slug === brief.slug) return;
      if (!hasBrief) return;
      router.push(`/area/${slug}?from=browse`);
    },
    [router, brief.slug],
  );

  return (
    <section className="area-location card-section space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Map
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{contextLine}</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Zoom or pan to explore nearby areas, then click a suburb to open its brief — or{" "}
          <Link href="/" className="font-medium text-[var(--accent)] underline-offset-2 hover:underline">
            go back to search
          </Link>
          .
        </p>
      </div>

      <AreaMap
        slug={brief.slug}
        pinLat={pinLat}
        pinLon={pinLon}
        onSuburbSelect={handleSuburbSelect}
      />
    </section>
  );
}
