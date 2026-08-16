"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AuthCard } from "@/components/ui";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  async function submit() {
    if (loading) return;
    setError("");
    setSuccess(false);
    const mail = email.trim().toLowerCase();
    if (!mail) {
      setError("Enter your email.");
      return;
    }
    setLoading(true);
    const result = await requestPasswordReset(mail);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    sessionStorage.setItem("watchamoo_reset_email", mail);
    setSuccess(true);
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your email. If an account exists, Supabase will send a reset link."
    >
      {error && <Alert tone="error">{error}</Alert>}
      {success && (
        <Alert tone="success">
          Check {email} for a password reset link. After you open it, set a new password on the
          next screen.
        </Alert>
      )}
      {!success ? (
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
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit();
              }}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary w-full"
            disabled={loading}
            onClick={() => void submit()}
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={() => router.push("/reset-password")}
        >
          Continue to reset password
        </button>
      )}
      <p className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-[var(--primary)] hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
