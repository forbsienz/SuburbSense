import type { Meta } from "@/lib/types";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { Confidence } from "@/lib/types";

interface TransparencyPanelProps {
  meta: Meta;
  confidence: Confidence;
  areaDisplayName?: string;
}

export function TransparencyPanel({ meta, confidence, areaDisplayName }: TransparencyPanelProps) {
  return (
    <dl className="space-y-3 text-sm">
      <div>
        <dt className="font-medium">Current period</dt>
        <dd className="text-[var(--text-muted)]">
          {meta.current_period.start} – {meta.current_period.end}
        </dd>
      </div>
      <div>
        <dt className="font-medium">Comparison period</dt>
        <dd className="text-[var(--text-muted)]">
          {meta.prior_period.start} – {meta.prior_period.end}
        </dd>
      </div>
      <div>
        <dt className="font-medium">Population basis</dt>
        <dd className="text-[var(--text-muted)]">{meta.population_caveat}</dd>
      </div>
      {areaDisplayName && (
        <div>
          <dt className="font-medium">Area boundary</dt>
          <dd className="text-[var(--text-muted)]">
            Statistics for {areaDisplayName} use the official suburb boundary (Area Unit),
            which may differ slightly from your street.
          </dd>
        </div>
      )}
      <div>
        <dt className="font-medium">Limitations</dt>
        <dd className="text-[var(--text-muted)]">
          Reported victimisations only — not all crime is reported. Dwelling-based crimes may
          be excluded from some Police views. Calendar week trends are not available from
          this data source.
        </dd>
      </div>
      <div>
        <dt className="font-medium">Confidence</dt>
        <dd className="mt-1">
          <ConfidenceBadge level={confidence} />
        </dd>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        Source: NZ Police victimisation data (CC BY 4.0). Not affiliated with NZ Police or
        Stats NZ.{" "}
        <a href="/methodology">Methodology</a>
        {" · "}
        <a href="/glossary">Glossary</a>
      </p>
    </dl>
  );
}
