import Image from "next/image";
import { AddressSearch } from "@/components/location/AddressSearch";
import { AreaPicker } from "@/components/location/AreaPicker";
import { DataFreshnessBanner } from "@/components/transparency/DataFreshnessBanner";
import { getAreas, getMeta } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Suburb Sense — Make sense of safety where you live",
  },
  description:
    "Explore reported crime trends and rates for New Zealand suburbs, with practical safety guidance from open Police data.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [meta, areas] = await Promise.all([getMeta(), getAreas()]);

  return (
    <div className="space-y-8">
      <section className="area-hero overflow-hidden !px-4 !py-5 sm:!px-6 sm:!py-6">
        <div className="flex justify-center">
          <Image
            src="/brand/suburb-sense-logo.png"
            alt="Suburb Sense — Make sense of safety where you live"
            width={1342}
            height={316}
            priority
            className="h-auto w-full max-w-xl object-contain"
          />
        </div>
        <p className="mx-auto mt-4 max-w-xl text-center text-base text-[var(--text-muted)]">
          Rolling trends, rates per 1,000 residents, and practical guidance for New Zealand
          suburbs.
        </p>
      </section>

      <DataFreshnessBanner meta={meta} />

      <section id="area-picker">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Browse by suburb
        </h2>
        <AreaPicker areas={areas} />
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Search by address
        </h2>
        <AddressSearch />
      </section>
    </div>
  );
}
