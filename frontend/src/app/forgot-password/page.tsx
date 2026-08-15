"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AuthCard } from "@/components/ui";
import { sendCodeToEmail } from "@/lib/sendCode";

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
    const result = requestPasswordReset(mail);
    if (!result.ok) {
      setLoading(false);
      setError(result.error);
      return;
    }

    const emailResult = await sendCodeToEmail({
      email: mail,
      code: result.token,
      type: "reset",
    });
    setLoading(false);
    if (!emailResult.ok) {
      setError(emailResult.error);
      return;
    }

    setEmail(mail);
    sessionStorage.setItem("watchamoo_reset_email", mail);
    setSuccess(true);
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your email and we’ll send a reset code — check your inbox."
    >
      {error && <Alert tone="error">{error}</Alert>}
      {success && (
        <Alert tone="success">
          Reset code sent to {email}. Check your email, then continue to set a new password.
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
