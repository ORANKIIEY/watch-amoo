"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AuthCard } from "@/components/ui";
import { useClientReady } from "@/lib/useClientReady";

export default function VerifyPage() {
  const { verifyOtp, resendOtp } = useAuth();
  const router = useRouter();
  const clientReady = useClientReady();
  const [email, setEmail] = useState("");
  const [devCode, setDevCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const pending = sessionStorage.getItem("watchamoo_pending_email") || "";
    setEmail(pending);
    setDevCode(sessionStorage.getItem("watchamoo_dev_code") || "");
    if (!pending) router.replace("/signup");
  }, [router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!clientReady || loading) return;
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
    sessionStorage.removeItem("watchamoo_dev_code");
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
    if (result.devCode) {
      sessionStorage.setItem("watchamoo_dev_code", result.devCode);
      setDevCode(result.devCode);
      setMessage("New local verification code is ready below.");
    } else {
      setMessage("A new verification code was sent to your email.");
    }
  }

  if (!email) return null;

  return (
    <AuthCard
      title="Verify your email"
      subtitle={
        devCode
          ? `Local mode: enter the 6-digit code for ${email}.`
          : `We sent a 6-digit verification code to ${email}. Enter it below.`
      }
    >
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}
      {devCode && (
        <Alert tone="info">
          Your verification code is <strong className="tracking-[0.2em]">{devCode}</strong>
          <span className="block mt-1 text-xs">
            (Shown because EMAIL_DEV_LOG is on — no real email was required.)
          </span>
        </Alert>
      )}
      <form method="post" onSubmit={onSubmit} className="space-y-4">
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
            defaultValue={devCode || undefined}
            key={devCode || "otp"}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={!clientReady || loading}
        >
          {!clientReady ? "Preparing…" : loading ? "Verifying…" : "Verify & continue"}
        </button>
      </form>
      <button
        type="button"
        onClick={onResend}
        disabled={resending}
        className="mt-4 w-full text-sm font-semibold text-[var(--primary)] hover:underline disabled:opacity-60"
      >
        {resending ? "Sending…" : "Resend code"}
      </button>
      <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
        Wrong email?{" "}
        <Link href="/signup" className="font-semibold text-[var(--primary)] hover:underline">
          Sign up again
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-[var(--muted-foreground)]">
        Password must be 8+ characters with a letter and a number (e.g. Password1).
      </p>
    </AuthCard>
  );
}
