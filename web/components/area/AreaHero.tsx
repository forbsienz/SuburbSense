import type { AreaBrief, Meta } from "@/lib/types";
import Link from "next/link";

interface AreaHeroProps {
  brief: AreaBrief;
  meta: Meta;
  narrative: string;
}

export function AreaHero({ brief, meta, narrative }: AreaHeroProps) {
  return (
    <div className="area-hero">
      <Link href="/" className="text-sm font-medium text-[var(--text-muted)] no-underline hover:text-[var(--accent)]">
        ← Back to search
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {brief.display_name}
      </h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Data through {meta.data_through} · {meta.current_period.start} – {meta.current_period.end}
      </p>
      <p className="mt-4 max-w-prose text-base leading-relaxed text-[var(--text-primary)]">
        {narrative}
      </p>
    </div>
  );
}
