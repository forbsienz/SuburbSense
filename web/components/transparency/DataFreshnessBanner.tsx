import type { Meta } from "@/lib/types";

export function DataFreshnessBanner({ meta }: { meta: Meta }) {
  return (
    <div className="card-info text-sm text-[var(--text-muted)]">
      Data through <strong className="text-[var(--text-primary)]">{meta.data_through}</strong>
    </div>
  );
}
