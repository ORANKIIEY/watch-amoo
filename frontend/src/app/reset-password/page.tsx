"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AuthCard } from "@/components/ui";
import { useClientReady } from "@/lib/useClientReady";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const clientReady = useClientReady();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail(sessionStorage.getItem("watchamoo_reset_email") || "");
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!clientReady || loading) return;
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await resetPassword({
      email: String(fd.get("email") || email),
      token: String(fd.get("token") || ""),
      password: String(fd.get("password") || ""),
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    sessionStorage.removeItem("watchamoo_reset_email");
    setSuccess(true);
    setTimeout(() => router.push("/login"), 1200);
  }

  return (
    <AuthCard
      title="Reset password"
      subtitle="Enter the code from your email and choose a new password (8+ chars, letter + number)."
    >
      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">Password updated. Redirecting to log in…</Alert>}
      <form method="post" onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="field"
            required
            defaultValue={email}
            key={email}
          />
        </div>
        <div>
          <label className="label" htmlFor="token">
            Reset code from email
          </label>
          <input
            id="token"
            name="token"
            className="field tracking-[0.35em]"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoComplete="one-time-code"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="field"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={!clientReady || success || loading}
        >
          {!clientReady ? "Preparing…" : loading ? "Updating…" : "Update password"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
        <Link href="/forgot-password" className="font-semibold text-[var(--primary)] hover:underline">
          Request a new code
        </Link>
      </p>
    </AuthCard>
  );
}
