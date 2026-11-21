import { NextResponse, type NextRequest } from "next/server";

import { clientIp, rateLimit } from "@/lib/rateLimit";

/** Stricter limits on endpoints that hit paid/third-party APIs or large GeoJSON. */
const API_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/address/autocomplete": { limit: 40, windowMs: 60_000 },
  "/api/address/resolve": { limit: 30, windowMs: 60_000 },
  "/api/boundary/area": { limit: 60, windowMs: 60_000 },
  "/api/boundary/suburbs": { limit: 90, windowMs: 60_000 },
};

const DEFAULT_API = { limit: 120, windowMs: 60_000 };

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
  }

  const rules = API_LIMITS[pathname] ?? DEFAULT_API;
  const ip = clientIp(request);
  const result = rateLimit(`${ip}:${pathname}`, rules.limit, rules.windowMs);

  if (!result.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfterSec),
          "X-RateLimit-Limit": String(rules.limit),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(rules.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
