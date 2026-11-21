import type { AreaBrief, AreaIndex, Meta, NationalBaseline } from "@/lib/types";
import { isSafeSlug } from "@/lib/safeSlug";
import { readFile } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "public", "data");

async function readJson<T>(filename: string): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export async function getMeta(): Promise<Meta> {
  return readJson<Meta>("meta.json");
}

export async function getAreas(): Promise<AreaIndex[]> {
  return readJson<AreaIndex[]>("areas.json");
}

export async function getNational(): Promise<NationalBaseline> {
  return readJson<NationalBaseline>("national.json");
}

export async function getAreaBrief(slug: string): Promise<AreaBrief | null> {
  if (!isSafeSlug(slug)) return null;
  try {
    return await readJson<AreaBrief>(`briefs/${slug}.json`);
  } catch {
    return null;
  }
}

export async function getAreasByRegion(): Promise<
  Record<string, Record<string, AreaIndex[]>>
> {
  const areas = await getAreas();
  const grouped: Record<string, Record<string, AreaIndex[]>> = {};

  for (const area of areas) {
    if (!grouped[area.region_slug]) {
      grouped[area.region_slug] = {};
    }
    if (!grouped[area.region_slug][area.ta_slug]) {
      grouped[area.region_slug][area.ta_slug] = [];
    }
    grouped[area.region_slug][area.ta_slug].push(area);
  }

  return grouped;
}

export { showLatestMonth } from "@/lib/area/confidence";