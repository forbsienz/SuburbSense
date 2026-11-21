import type { ReactNode } from "react";

type SectionAccent = "compare" | "safety" | "patterns" | "transparency" | "neutral";

const pillClass: Record<SectionAccent, string> = {
  compare: "section-pill section-pill--compare",
  safety: "section-pill section-pill--safety",
  patterns: "section-pill section-pill--patterns",
  transparency: "section-pill section-pill--transparency",
  neutral: "section-pill section-pill--neutral",
};

interface SectionCardProps {
  title?: string;
  accent?: SectionAccent;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  accent = "neutral",
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section className={`card-section ${className}`}>
      {title && (
        <div>
          <span className={pillClass[accent]}>{title}</span>
        </div>
      )}
      {children}
    </section>
  );
}

export function SubCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card-sub ${className}`}>{children}</div>;
}

export function SafetyCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card-safety ${className}`}>{children}</div>;
}

export function HelpCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card-help ${className}`}>{children}</div>;
}

export function InsetCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card-inset ${className}`}>{children}</div>;
}
