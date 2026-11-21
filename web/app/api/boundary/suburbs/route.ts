import { NextRequest, NextResponse } from "next/server";

import {
  getSuburbNearbyCollection,
  getSuburbSelfCollection,
} from "@/lib/map/suburbs-boundary";
import { isSafeSlug } from "@/lib/safeSlug";
import type { BoundaryCollection } from "@/lib/map/types";

export const runtime = "nodejs";

function withCache(data: BoundaryCollection, maxAgeSeconds: number) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}`,
    },
  });
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim() ?? "";
  const scope = request.nextUrl.searchParams.get("scope")?.trim() ?? "nearby";

  // Require slug — never stream the full national GeoJSON over the API (DoS / bandwidth).
  if (!slug) {
    return NextResponse.json(
      { error: "slug is required. Use scope=self or scope=nearby." },
      { status: 400 },
    );
  }

  if (!isSafeSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  if (scope === "self") {
    const self = await getSuburbSelfCollection(slug);
    if (self) return withCache(self, 86400);
    return NextResponse.json({ error: `No boundary for ${slug}` }, { status: 404 });
  }

  if (scope !== "nearby") {
    return NextResponse.json({ error: "scope must be self or nearby." }, { status: 400 });
  }

  const nearby = await getSuburbNearbyCollection(slug);
  if (nearby) return withCache(nearby, 86400);
  return NextResponse.json({ error: `No boundary for ${slug}` }, { status: 404 });
}
