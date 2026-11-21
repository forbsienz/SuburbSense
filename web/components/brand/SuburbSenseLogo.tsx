import Link from "next/link";

type LogoVariant = "header" | "light";

interface SuburbSenseMarkProps {
  className?: string;
  variant?: LogoVariant;
}

/** House + sensing arcs + fern — matches brand mockup. */
export function SuburbSenseMark({ className = "h-8 w-8", variant = "header" }: SuburbSenseMarkProps) {
  const stroke = variant === "header" ? "var(--header-text)" : "var(--header-bg)";
  const leaf = variant === "header" ? "var(--mint)" : "var(--accent-safety)";

  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Sensing arcs */}
      <path
        d="M10 42c0-8 4-16 12-22"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M6 46c0-12 6-24 18-32"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M3 50c0-15 8-30 22-40"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* House */}
      <path
        d="M22 28 L36 16 L50 28 V50 H22 Z"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M22 28 H50" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      {/* Window */}
      <rect x="32" y="34" width="5" height="5" stroke={stroke} strokeWidth="1.5" />
      <rect x="39" y="34" width="5" height="5" stroke={stroke} strokeWidth="1.5" />
      <rect x="32" y="41" width="5" height="5" stroke={stroke} strokeWidth="1.5" />
      <rect x="39" y="41" width="5" height="5" stroke={stroke} strokeWidth="1.5" />
      {/* Fern */}
      <path
        d="M48 44c4-2 8-1 10 2M48 44c3 0 6 2 7 5M48 44c2 2 3 5 2 8"
        stroke={leaf}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="48" cy="44" r="1.5" fill={leaf} />
    </svg>
  );
}

interface SuburbSenseWordmarkProps {
  variant?: LogoVariant;
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
}

export function SuburbSenseWordmark({
  variant = "header",
  className = "",
  showTagline = false,
  size = "sm",
}: SuburbSenseWordmarkProps) {
  const suburb =
    variant === "header" ? "text-[var(--header-text)]" : "text-[var(--header-bg)]";
  const sense =
    variant === "header" ? "text-[var(--mint)]" : "text-[var(--accent-safety)]";
  const titleSize =
    size === "lg" ? "text-3xl sm:text-4xl" : size === "md" ? "text-2xl" : "text-lg";

  return (
    <span className={`flex flex-col ${className}`}>
      <span className={`${titleSize} font-heading font-semibold tracking-tight leading-none`}>
        <span className={suburb}>Suburb</span> <span className={sense}>Sense</span>
      </span>
      {showTagline && (
        <span className="mt-2 text-sm font-normal tracking-wide text-[var(--text-muted)]">
          Make sense of safety where you live.
        </span>
      )}
    </span>
  );
}

interface SiteLogoLinkProps {
  className?: string;
}

export function SiteLogoLink({ className = "" }: SiteLogoLinkProps) {
  return (
    <Link
      href="/"
      className={`site-logo inline-flex items-center gap-2.5 no-underline hover:no-underline ${className}`}
      aria-label="Suburb Sense — home"
    >
      <SuburbSenseMark className="h-8 w-8 shrink-0" variant="header" />
      <SuburbSenseWordmark variant="header" size="sm" />
    </Link>
  );
}
