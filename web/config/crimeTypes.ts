import type { NationalBaseline } from "@/lib/types";

/** Five crime types shown across the site — Harm is excluded. */
export const MAIN_CRIME_TYPES = [
  "Theft",
  "Burglary",
  "Assault",
  "Robbery",
  "Sexual",
] as const;

export type MainCrimeType = (typeof MAIN_CRIME_TYPES)[number];

export const EXCLUDED_CRIME_TYPES = ["Harm"] as const;

/** Display order for crime type groups in the pipeline dataset. */
const CRIME_TYPE_ORDER = [...MAIN_CRIME_TYPES];

export const CRIME_TYPE_COLORS: Record<MainCrimeType, string> = {
  Theft: "#2c6a7a", // harbour teal
  Burglary: "#c17f3a", // clay / brand warm
  Assault: "#8b3a3a", // burgundy (not orange-red)
  Robbery: "#5b4d8a", // soft plum
  Sexual: "#5a6b5e", // muted sage-slate
};

const SUBTYPE_PALETTE = [
  "#2c6a7a",
  "#3d7f8f",
  "#c17f3a",
  "#a3682f",
  "#5b4d8a",
  "#6b8f71",
  "#8b3a3a",
  "#5a6b5e",
];

export function subtypeColor(index: number): string {
  return SUBTYPE_PALETTE[index % SUBTYPE_PALETTE.length];
}

export function isMainCrimeType(type: string): type is MainCrimeType {
  return (MAIN_CRIME_TYPES as readonly string[]).includes(type);
}

export function sortCrimeTypeKeys(keys: string[]): string[] {
  return [...keys]
    .filter((key) => !EXCLUDED_CRIME_TYPES.includes(key as (typeof EXCLUDED_CRIME_TYPES)[number]))
    .sort((a, b) => {
      const ia = CRIME_TYPE_ORDER.indexOf(a as MainCrimeType);
      const ib = CRIME_TYPE_ORDER.indexOf(b as MainCrimeType);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
}

/** Every main crime type available in the exported dataset. */
export function getAllCrimeTypes(national: NationalBaseline): string[] {
  const keys = Object.keys(national.rolling_year.by_crime_type).filter((key) =>
    isMainCrimeType(key),
  );
  return sortCrimeTypeKeys(keys.length > 0 ? keys : [...MAIN_CRIME_TYPES]);
}
