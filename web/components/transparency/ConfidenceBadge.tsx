import type { Confidence } from "@/lib/types";

const styles: Record<Confidence, string> = {
  high: "bg-[var(--confidence-high-bg)] text-[var(--confidence-high-text)]",
  medium: "bg-[var(--confidence-medium-bg)] text-[var(--confidence-medium-text)]",
  low: "bg-[var(--confidence-low-bg)] text-[var(--confidence-low-text)]",
};

export function ConfidenceBadge({ level }: { level: Confidence }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[level]}`}>
      {level} confidence
    </span>
  );
}
