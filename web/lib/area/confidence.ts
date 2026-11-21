import type { Confidence } from "@/lib/types";

export function showLatestMonth(confidence: Confidence | string): boolean {
  return confidence !== "low";
}
