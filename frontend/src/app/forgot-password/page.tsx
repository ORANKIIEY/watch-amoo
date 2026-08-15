"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AuthCard } from "@/components/ui";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const mail = String(fd.get("email") || "")
      .trim()
      .toLowerCase();
    const result = await requestPasswordReset(mail);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEmail(mail);
    sessionStorage.setItem("watchamoo_reset_email", mail);
    setSuccess(true);
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your email. If an account exists, we’ll send a reset code."
    >
      {error && <Alert tone="error">{error}</Alert>}
      {success && (
        <Alert tone="success">
          If an account exists for {email}, a reset code was sent. Check your inbox.
        </Alert>
      )}
      {!success ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" className="field" required />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset code"}
          </button>
        </form>
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
