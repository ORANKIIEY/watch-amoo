"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Alert } from "@/components/ui";
import { hasActiveAccess, loadProfile, startFreeTrial } from "@/lib/access";

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-9 w-9 text-foreground"
      aria-hidden
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function SubscribePage() {
  const router = useRouter();
  const { session, ready } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login?next=/subscribe");
      return;
    }
    void loadProfile().then((profile) => {
      if (!profile?.language) {
        router.replace("/language");
        return;
      }
      if (hasActiveAccess(profile)) router.replace("/watch");
    });
  }, [ready, session, router]);

  async function onStartTrial() {
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await startFreeTrial();
      router.push("/watch");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start trial");
    } finally {
      setLoading(false);
    }
  }

  if (!ready || !session) return null;

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <h1 className="text-center text-4xl font-black text-foreground md:text-5xl">
        Choose your plan
      </h1>

      <div className="relative mt-16 flex flex-col rounded-3xl border-2 border-foreground/80 bg-card">
        <div className="mx-8 -mt-6 rounded-t-2xl bg-primary py-3 text-center text-lg font-bold text-primary-foreground shadow-md">
          7 Day Free Trial
        </div>
        <div className="flex flex-col items-center p-8 pt-6 text-center">
          {error && (
            <div className="w-full">
              <Alert tone="error">{error}</Alert>
            </div>
          )}
          <div className="my-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-foreground/80">
            <StarIcon />
          </div>
          <p className="min-h-[3.5rem] max-w-xs text-base text-foreground/80">
            Experience everything for free.
            <br />
            Cancel anytime before your trial ends.
          </p>
          <div className="mb-4 mt-6">
            <span className="text-5xl font-black text-foreground">FREE</span>
          </div>
          <button
            type="button"
            onClick={() => void onStartTrial()}
            disabled={loading}
            className="w-full max-w-xs rounded-full bg-primary py-4 font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Starting…" : "Select Plan"}
          </button>
          <p className="mt-3 text-xs text-muted-foreground">Then $9.99/mo after trial</p>
        </div>
      </div>
    </main>
  );
}
