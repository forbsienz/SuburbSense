import { readFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { getAreas } from "@/lib/data";
import { isAddressfinderPxid, isInNzBbox, parseGeoPxid } from "@/lib/geo";
import { matchGeocodeToArea } from "@/lib/geocoder/match-area";
import type { GeocodeHit } from "@/lib/geocoder/types";
import type { ResolvedAddress } from "@/lib/map/types";

const DATA_DIR = path.join(process.cwd(), "public", "data");

type MeshblockEntry = { slug: string; display_name: string; has_brief: boolean };

function clipParam(value: string | null, max = 100): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

async function getMeshblockLookup(): Promise<Record<string, MeshblockEntry>> {
  try {
    const raw = await readFile(path.join(DATA_DIR, "meshblock_to_area.json"), "utf-8");
    return JSON.parse(raw) as Record<string, MeshblockEntry>;
  } catch {
    return {};
  }
}

async function resolveViaAddressfinder(pxid: string, key: string): Promise<ResolvedAddress> {
  const params = new URLSearchParams({
    key,
    pxid,
    format: "json",
    census: "2018",
  });

  const res = await fetch(
    `https://api.addressfinder.io/api/nz/address/metadata?${params}`,
    { next: { revalidate: 86400 } },
  );

  if (!res.ok) {
    throw new Error("Could not resolve address.");
  }

  const meta = (await res.json()) as {
    success?: boolean;
    a?: string;
    meshblock?: string;
    x?: string;
    y?: string;
    suburb?: string;
    city?: string;
    ta?: string;
  };

  if (!meta.success || !meta.meshblock || !meta.x || !meta.y || !meta.a) {
    throw new Error("Address metadata incomplete.");
  }

  const lookup = await getMeshblockLookup();
  const meshblockKey = meta.meshblock.padStart(7, "0");
  const area = lookup[meshblockKey];

  if (!area) {
    throw new Error("No suburb mapping found for this meshblock.");
  }

  return {
    formatted_address: meta.a,
    meshblock: meshblockKey,
    lat: parseFloat(meta.y),
    lon: parseFloat(meta.x),
    slug: area.slug,
    display_name: area.display_name,
    has_brief: area.has_brief,
    suburb: meta.suburb,
    city: meta.city ?? meta.ta,
    source: "addressfinder",
  };
}

async function resolveViaGeocode(
  pxid: string,
  address: string,
  location?: {
    suburb?: string;
    district?: string;
    locality?: string;
    city?: string;
    territorialAuthority?: string;
  },
): Promise<ResolvedAddress> {
  const coords = parseGeoPxid(pxid);
  if (!coords) {
    throw new Error("Invalid geocode reference.");
  }
  const { lat, lon } = coords;
  if (!isInNzBbox(lat, lon)) {
    throw new Error("Invalid geocode reference.");
  }

  const hit: GeocodeHit = {
    lat,
    lon,
    formatted_address: address,
    suburb: location?.suburb,
    district: location?.district,
    locality: location?.locality,
    city: location?.city,
    territorial_authority: location?.territorialAuthority,
  };

  const areas = await getAreas();
  const matched = matchGeocodeToArea(hit, areas);
  if (!matched) {
    throw new Error("Could not match this address to a suburb in our data.");
  }

  return {
    formatted_address: matched.formatted_address ?? address,
    lat,
    lon,
    slug: matched.slug,
    display_name: matched.display_name,
    has_brief: matched.has_brief,
    suburb: location?.suburb ?? location?.district ?? location?.locality,
    city: location?.city ?? location?.territorialAuthority,
    source: "photon",
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pxid = searchParams.get("pxid")?.trim();
  if (!pxid) {
    return NextResponse.json({ error: "pxid is required." }, { status: 400 });
  }
  if (pxid.length > 200) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const address = (searchParams.get("address")?.trim() ?? "").slice(0, 200);
  const suburb = clipParam(searchParams.get("suburb"));
  const district = clipParam(searchParams.get("district"));
  const locality = clipParam(searchParams.get("locality"));
  const city = clipParam(searchParams.get("city"));
  const territorialAuthority = clipParam(searchParams.get("ta"));

  try {
    let result: ResolvedAddress;

    if (pxid.startsWith("geo:")) {
      result = await resolveViaGeocode(pxid, address, {
        suburb,
        district,
        locality,
        city,
        territorialAuthority,
      });
    } else {
      if (!isAddressfinderPxid(pxid)) {
        return NextResponse.json({ error: "Invalid request." }, { status: 400 });
      }
      const key = process.env.ADDRESSFINDER_KEY?.trim();
      if (!key) {
        return NextResponse.json(
          { error: "Address resolution requires ADDRESSFINDER_KEY for this selection." },
          { status: 503 },
        );
      }
      result = await resolveViaAddressfinder(pxid, key);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("address resolve failed", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Could not match") || message.includes("Invalid geocode")) {
      return NextResponse.json({ error: "Could not resolve this address." }, { status: 404 });
    }
    return NextResponse.json({ error: "Could not resolve address." }, { status: 502 });
  }
}
