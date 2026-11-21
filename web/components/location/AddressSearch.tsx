"use client";

import { trackEvent } from "@/lib/analytics";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Completion {
  address: string;
  pxid: string;
  suburb?: string;
  district?: string;
  locality?: string;
  city?: string;
  territorial_authority?: string;
}

export function AddressSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setCompletions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/address/autocomplete?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as {
          completions?: Completion[];
          error?: string;
        };

        if (!res.ok) {
          setError(data.error ?? "Could not fetch address suggestions.");
          setCompletions([]);
          return;
        }

        setCompletions(data.completions ?? []);
      } catch {
        setError("Could not fetch address suggestions.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function selectAddress(item: Completion) {
    setResolving(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        pxid: item.pxid,
        address: item.address,
      });
      if (item.suburb) params.set("suburb", item.suburb);
      if (item.district) params.set("district", item.district);
      if (item.locality) params.set("locality", item.locality);
      if (item.city) params.set("city", item.city);
      if (item.territorial_authority) params.set("ta", item.territorial_authority);

      const res = await fetch(`/api/address/resolve?${params.toString()}`);
      const data = (await res.json()) as {
        slug?: string;
        formatted_address?: string;
        meshblock?: string;
        lat?: number;
        lon?: number;
        has_brief?: boolean;
        display_name?: string;
        error?: string;
      };

      if (!res.ok || !data.slug) {
        setError(data.error ?? "Could not map this address to a suburb.");
        trackEvent({ name: "address_resolve", params: { success: false } });
        return;
      }

      if (!data.has_brief) {
        setError(
          `${data.display_name ?? item.address} does not have enough reported crime for a full brief.`,
        );
        trackEvent({ name: "address_resolve", params: { success: false } });
        return;
      }

      trackEvent({ name: "address_resolve", params: { success: true } });

      const navParams = new URLSearchParams({
        from: "address",
        address: data.formatted_address ?? item.address,
        lat: String(data.lat),
        lon: String(data.lon),
      });

      router.push(`/area/${data.slug}?${navParams.toString()}`);
    } catch {
      setError("Could not resolve address.");
      trackEvent({ name: "address_resolve", params: { success: false } });
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="card-section space-y-3">
      <label className="block text-sm font-medium">
        Search by street address
        <input
          type="text"
          placeholder="Start typing e.g. 210 Federal Street, Auckland Central"
          className="mt-1 w-full min-h-11 rounded border border-[var(--border)] px-3 py-2.5 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="street-address"
        />
      </label>

      {loading && <p className="text-xs text-[var(--text-muted)]">Finding addresses…</p>}
      {resolving && <p className="text-xs text-[var(--text-muted)]">Mapping to suburb…</p>}
      {error && <p className="text-sm text-[var(--trend-up)]">{error}</p>}

      {completions.length > 0 && (
        <ul className="max-h-56 space-y-1 overflow-y-auto rounded border border-[var(--border)] bg-[var(--bg-card)] p-1">
          {completions.map((item) => (
            <li key={item.pxid}>
              <button
                type="button"
                className="w-full min-h-11 rounded px-3 py-2.5 text-left text-sm hover:bg-[var(--bg-card-muted)]"
                onClick={() => selectAddress(item)}
              >
                {item.address}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-[var(--text-muted)]">
        Select an address to open the suburb safety brief for that area.
      </p>
    </div>
  );
}
