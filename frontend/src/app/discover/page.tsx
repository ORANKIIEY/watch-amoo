import { Suspense } from "react";
import DiscoverClient from "./DiscoverClient";

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-6 py-16 text-[var(--muted-foreground)]">
          Loading discovery…
        </div>
      }
    >
      <DiscoverClient />
    </Suspense>
  );
}
