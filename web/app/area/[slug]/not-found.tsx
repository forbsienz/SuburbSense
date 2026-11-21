import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-bold">Area not found</h1>
      <p className="text-sm text-[var(--muted)]">
        No brief available for this suburb yet — it may have insufficient data.
      </p>
      <Link href="/">Return home</Link>
    </div>
  );
}
