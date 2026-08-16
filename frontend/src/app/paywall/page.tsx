"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { hasActiveAccess, loadProfile } from "@/lib/access";

export default function PaywallPage() {
  const router = useRouter();
  const { session, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login?next=/paywall");
      return;
    }
    void loadProfile().then((profile) => {
      if (!profile?.language) {
        router.replace("/language");
        return;
      }
      if (hasActiveAccess(profile)) {
        router.replace("/watch");
        return;
      }
      if (profile.subscription_status === "none") router.replace("/subscribe");
    });
  }, [ready, session, router]);

  if (!ready || !session) return null;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-center px-6 py-16 text-center">
      <h1 className="text-4xl font-black text-foreground md:text-5xl">Your trial has ended</h1>
      <p className="mt-4 text-lg text-foreground/70">
        Subscribe to keep watching nursery rhymes in your chosen language.
      </p>
      <Link
        href="/subscribe"
        className="mt-8 w-full max-w-xs rounded-full bg-primary py-4 font-bold text-primary-foreground transition hover:opacity-90"
      >
        View plans
      </Link>
      <Link href="/account" className="mt-4 text-sm font-bold text-primary hover:underline">
        Back to account
      </Link>
    </main>
  );
}
