"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AuthCard } from "@/components/ui";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail(sessionStorage.getItem("watchamoo_reset_email") || "");
  }, []);

  async function submit() {
    if (loading) return;
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const result = await resetPassword({
      email,
      token: "",
      password,
    });
    setLoading(false);
    if (!result.ok) {
      setError(
        result.error ||
          "Could not update password. Open the reset link from your email first, then try again."
      );
      return;
    }
    sessionStorage.removeItem("watchamoo_reset_email");
    setSuccess(true);
    setTimeout(() => router.push("/login"), 1200);
  }

  return (
    <AuthCard
      title="Reset password"
      subtitle="Open the reset link from your email first, then choose a new password here."
    >
      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">Password updated. Redirecting to log in…</Alert>}
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            New password
          </label>
          <input
            id="password"
            type="password"
            className="field"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary w-full"
          disabled={success || loading}
          onClick={() => void submit()}
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </div>
      <p className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
        <Link href="/forgot-password" className="font-semibold text-[var(--primary)] hover:underline">
          Request a new reset link
        </Link>
      </p>
    </AuthCard>
  );
}
