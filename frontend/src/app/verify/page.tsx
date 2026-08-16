"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AuthCard } from "@/components/ui";

export default function VerifyPage() {
  const { resendOtp, session, ready } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const pending = sessionStorage.getItem("watchamoo_pending_email") || "";
    setEmail(pending);
    if (!pending) router.replace("/signup");
  }, [router]);

  useEffect(() => {
    if (ready && session) {
      const next = sessionStorage.getItem("watchamoo_next");
      sessionStorage.removeItem("watchamoo_pending_email");
      sessionStorage.removeItem("watchamoo_next");
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/watch");
    }
  }, [ready, session, router]);

  async function onResend() {
    if (!email) return;
    setError("");
    setMessage("");
    setResending(true);
    const result = await resendOtp(email);
    setResending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Confirmation email sent again. Check your inbox (and spam).");
  }

  if (!email) return null;

  return (
    <AuthCard
      title="Confirm your email"
      subtitle={`We sent a confirmation link to ${email}. Open it to finish signing up, then come back and log in.`}
    >
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}
      <Alert tone="info">
        No 6-digit code needed — click the link in the email from Supabase / watchamoo.
      </Alert>
      <button
        type="button"
        onClick={() => void onResend()}
        disabled={resending}
        className="btn btn-primary mt-2 w-full"
      >
        {resending ? "Sending…" : "Resend confirmation email"}
      </button>
      <p className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
        Already confirmed?{" "}
        <Link href="/login" className="font-semibold text-[var(--primary)] hover:underline">
          Log in
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-[var(--muted-foreground)]">
        Wrong email?{" "}
        <Link href="/signup" className="font-semibold text-[var(--primary)] hover:underline">
          Sign up again
        </Link>
      </p>
    </AuthCard>
  );
}
