"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { SuburbSenseMark } from "@/components/brand/SuburbSenseLogo";

/**
 * Floating brand mark — outer ring spins while a navigation is in progress.
 */
export function FloatingBrandLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onMapPage = pathname.startsWith("/area/");
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  // Clear spinner when the route settles
  useEffect(() => {
    setPending(false);
  }, [pathname, searchParams]);

  // Catch internal link clicks to start the spinner
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (href.startsWith("http") && !href.startsWith(window.location.origin)) return;

      const url = new URL(href, window.location.href);
      const samePath =
        url.pathname === window.location.pathname && url.search === window.location.search;
      if (samePath) return;

      startTransition(() => {
        setPending(true);
      });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [startTransition]);

  // Safety timeout so the ring never spins forever
  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => setPending(false), 8000);
    return () => window.clearTimeout(timer);
  }, [pending]);

  return (
    <Link
      href="/"
      className={`floating-brand${pending ? " floating-brand--loading" : ""}${onMapPage ? " floating-brand--on-map" : ""}`}
      aria-label={pending ? "Suburb Sense — loading" : "Suburb Sense — home"}
      aria-busy={pending}
    >
      <span className="floating-brand__face">
        <SuburbSenseMark className="floating-brand__mark" variant="header" />
      </span>
    </Link>
  );
}
