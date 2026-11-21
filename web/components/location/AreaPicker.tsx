"use client";

import type { AreaIndex } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface AreaPickerProps {
  areas: AreaIndex[];
}

function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

export function AreaPicker({ areas }: AreaPickerProps) {
  const router = useRouter();
  const withBriefs = areas.filter((a) => a.has_brief);

  const regions = useMemo(() => {
    const map = new Map<string, { name: string; tas: Map<string, { name: string; areas: AreaIndex[] }> }>();
    for (const area of withBriefs) {
      if (!map.has(area.region_slug)) {
        map.set(area.region_slug, { name: area.region_name, tas: new Map() });
      }
      const region = map.get(area.region_slug)!;
      if (!region.tas.has(area.ta_slug)) {
        region.tas.set(area.ta_slug, { name: area.ta_name, areas: [] });
      }
      region.tas.get(area.ta_slug)!.areas.push(area);
    }
    return map;
  }, [withBriefs]);

  const regionEntries = useMemo(
    () =>
      sortByName(
        Array.from(regions.entries()).map(([slug, data]) => ({
          slug,
          name: data.name,
          tas: data.tas,
        })),
      ),
    [regions],
  );

  const [regionSlug, setRegionSlug] = useState(regionEntries[0]?.slug ?? "");
  const taMap = regions.get(regionSlug)?.tas;

  const taEntries = useMemo(() => {
    if (!taMap) return [];
    return sortByName(
      Array.from(taMap.entries()).map(([slug, data]) => ({
        slug,
        name: data.name,
        areas: data.areas,
      })),
    );
  }, [taMap]);

  const [taSlug, setTaSlug] = useState(taEntries[0]?.slug ?? "");

  const activeTaSlug = taEntries.some((t) => t.slug === taSlug)
    ? taSlug
    : (taEntries[0]?.slug ?? "");

  const sortedAreas = useMemo(() => {
    const list = taMap?.get(activeTaSlug)?.areas ?? [];
    return [...list].sort((a, b) => a.display_name.localeCompare(b.display_name));
  }, [taMap, activeTaSlug]);

  const [areaSlug, setAreaSlug] = useState(sortedAreas[0]?.slug ?? "");

  const activeAreaSlug = sortedAreas.some((a) => a.slug === areaSlug)
    ? areaSlug
    : (sortedAreas[0]?.slug ?? "");

  function selectRegion(nextRegionSlug: string) {
    setRegionSlug(nextRegionSlug);
    const tas = regions.get(nextRegionSlug)?.tas;
    if (!tas) {
      setTaSlug("");
      setAreaSlug("");
      return;
    }
    const sortedTas = sortByName(
      Array.from(tas.entries()).map(([slug, data]) => ({ slug, name: data.name, areas: data.areas })),
    );
    const firstTa = sortedTas[0];
    setTaSlug(firstTa?.slug ?? "");
    const firstArea = firstTa
      ? [...firstTa.areas].sort((a, b) => a.display_name.localeCompare(b.display_name))[0]
      : undefined;
    setAreaSlug(firstArea?.slug ?? "");
  }

  function selectTa(nextTaSlug: string) {
    setTaSlug(nextTaSlug);
    const list = taMap?.get(nextTaSlug)?.areas ?? [];
    const first = [...list].sort((a, b) => a.display_name.localeCompare(b.display_name))[0];
    setAreaSlug(first?.slug ?? "");
  }

  function goToArea() {
    if (activeAreaSlug) {
      router.push(`/area/${activeAreaSlug}?from=browse`);
    }
  }

  return (
    <div className="card-section space-y-4">
      <label className="block text-sm font-medium">
        Region
        <select
          className="mt-1 w-full min-h-11 rounded border border-[var(--border)] px-3 py-2.5"
          value={regionSlug}
          onChange={(e) => selectRegion(e.target.value)}
        >
          {regionEntries.map(({ slug, name }) => (
            <option key={slug} value={slug}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        City / district
        <select
          className="mt-1 w-full min-h-11 rounded border border-[var(--border)] px-3 py-2.5"
          value={activeTaSlug}
          onChange={(e) => selectTa(e.target.value)}
        >
          {taEntries.map(({ slug, name }) => (
            <option key={slug} value={slug}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Suburb (Area Unit)
        <select
          className="mt-1 w-full min-h-11 rounded border border-[var(--border)] px-3 py-2.5"
          value={activeAreaSlug}
          onChange={(e) => setAreaSlug(e.target.value)}
        >
          {sortedAreas.map((area) => (
            <option key={area.slug} value={area.slug}>
              {area.display_name}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-[var(--muted)]">
        Statistics use the official suburb boundary (Area Unit), which may differ slightly from
        your street.
      </p>
      <button
        type="button"
        onClick={goToArea}
        className="w-full min-h-11 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
      >
        View area brief
      </button>
    </div>
  );
}
