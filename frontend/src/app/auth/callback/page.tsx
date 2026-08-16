"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";

/** Handles Supabase email confirmation / magic-link redirects. */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your account…");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (error) {
        setMessage(error.message);
        return;
      }
      if (data.session) {
        router.replace("/discover");
        return;
      }
      // Give detectSessionInUrl a moment to parse hash/query tokens
      setTimeout(async () => {
        const again = await supabase.auth.getSession();
        if (cancelled) return;
        if (again.data.session) router.replace("/discover");
        else router.replace("/login");
      }, 800);
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="mx-auto max-w-md px-5 py-16 text-center text-[var(--muted-foreground)]">
      {message}
    </div>
  );
}
