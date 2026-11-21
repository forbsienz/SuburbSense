import Link from "next/link";
import { SiteLogoLink } from "@/components/brand/SuburbSenseLogo";
import { SITE_SHELL_CLASS } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-10 backdrop-blur-sm">
      <div className={`${SITE_SHELL_CLASS} flex items-center justify-between gap-3 py-3.5`}>
        <SiteLogoLink />
        <nav className="flex shrink-0 gap-2 text-sm font-medium sm:gap-5">
          <Link
            href="/methodology"
            className="inline-flex min-h-11 items-center px-1 no-underline hover:underline"
          >
            Methodology
          </Link>
          <Link
            href="/glossary"
            className="inline-flex min-h-11 items-center px-1 no-underline hover:underline"
          >
            Glossary
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer mt-12 border-t border-[var(--border)] sm:mt-16">
      <div
        className={`${SITE_SHELL_CLASS} py-8 text-center text-xs text-[var(--text-muted)]`}
      >
        <p className="font-medium text-[var(--text-primary)]">Suburb Sense</p>
        <p className="mt-1">Make sense of safety where you live.</p>
        <p className="mx-auto mt-3 max-w-2xl">
          Crime statistics derived from NZ Police victimisation data (CC BY 4.0). Not affiliated
          with NZ Police, Stats NZ, or any government agency.
        </p>
      </div>
    </footer>
  );
}
