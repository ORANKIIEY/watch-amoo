"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AuthCard } from "@/components/ui";

export default function VerifyPage() {
  const { verifyOtp, resendOtp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const pending = sessionStorage.getItem("watchamoo_pending_email") || "";
    setEmail(pending);
    if (!pending) router.replace("/signup");
  }, [router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const code = String(fd.get("otp") || "");
    const result = await verifyOtp(email, code);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    sessionStorage.removeItem("watchamoo_pending_email");
    const next = sessionStorage.getItem("watchamoo_next");
    sessionStorage.removeItem("watchamoo_next");
    router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/discover");
  }

  async function onResend() {
    setError("");
    setMessage("");
    setResending(true);
    const result = await resendOtp(email);
    setResending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("A new verification code was sent to your email.");
  }

  if (!email) return null;

  return (
    <AuthCard
      title="Check your email"
      subtitle={`We sent a 6-digit verification code to ${email}. Enter it below.`}
    >
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="otp">
            One-time password
          </label>
          <input
            id="otp"
            name="otp"
            className="field tracking-[0.35em]"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="••••••"
            required
            autoComplete="one-time-code"
          />
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Verifying…" : "Verify & continue"}
        </button>
      </form>
      <button
        type="button"
        onClick={onResend}
        disabled={resending}
        className="mt-4 w-full text-sm font-semibold text-[var(--primary)] hover:underline disabled:opacity-60"
      >
        {resending ? "Sending…" : "Resend code to email"}
      </button>
      <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        Wrong email?{" "}
        <Link href="/signup" className="font-semibold text-[var(--primary)] hover:underline">
          Sign up again
        </Link>
      </p>
    </AuthCard>
  );
}
