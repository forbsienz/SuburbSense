import { NextResponse } from "next/server";

import { searchAddressCompletions } from "@/lib/geocoder/autocomplete";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return NextResponse.json({ completions: [] });
  }
  if (q.length > 120) {
    return NextResponse.json(
      { completions: [], error: "Query too long." },
      { status: 400 },
    );
  }

  try {
    const { completions, source } = await searchAddressCompletions(q);
    return NextResponse.json({ completions, source });
  } catch (error) {
    console.error("address autocomplete failed", error);
    return NextResponse.json(
      { completions: [], error: "Could not fetch address suggestions." },
      { status: 502 },
    );
  }
}
