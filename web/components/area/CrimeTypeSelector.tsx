"use client";

import { trackEvent } from "@/lib/analytics";
import {
  crimeTypeToParam,
  paramToCrimeType,
} from "@/lib/area/crimeTypes";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface CrimeTypeSelectorProps {
  allCrimeTypes: string[];
}

export function CrimeTypeSelector({ allCrimeTypes }: CrimeTypeSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const param = searchParams.get("type") ?? "";
  const selected = paramToCrimeType(param, allCrimeTypes);
  const value = selected ?? "";

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "") {
      params.delete("type");
    } else {
      params.set("type", crimeTypeToParam(next));
    }
    trackEvent({ name: "crime_filter", params: { type: next || "all" } });
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="card-section flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Crime type
        </p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          View all reported crime or focus on a specific type for this area.
        </p>
      </div>
      <label className="block w-full sm:max-w-xs">
        <span className="sr-only">Select crime type</span>
        <select
          className="mt-1 w-full min-h-11 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm font-medium"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
        >
          <option value="">All crime types</option>
          {allCrimeTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** Read selected crime type from URL — for use inside client components. */
export function useSelectedCrimeType(allCrimeTypes: string[]): string | null {
  const searchParams = useSearchParams();
  const param = searchParams.get("type") ?? "";
  if (!param) return null;
  return paramToCrimeType(param, allCrimeTypes);
}
