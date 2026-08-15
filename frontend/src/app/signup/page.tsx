"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AuthCard } from "@/components/ui";
import { sendCodeToEmail } from "@/lib/sendCode";

function safeNext(path: string | null) {
  if (path && path.startsWith("/") && !path.startsWith("//")) return path;
  return "/discover";
}

function SignupForm() {
  const { signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = signup({
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || ""),
    });
    if (!result.ok) {
      setLoading(false);
      setError(result.error);
      return;
    }

    const emailResult = await sendCodeToEmail({
      email: result.user.email,
      code: result.otp,
      type: "verification",
    });
    setLoading(false);
    if (!emailResult.ok) {
      setError(emailResult.error);
      return;
    }

    sessionStorage.setItem("watchamoo_pending_email", result.user.email);
    sessionStorage.setItem("watchamoo_next", next);
    router.push("/verify");
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start your 7-day free trial — we’ll email you a verification code."
    >
      {error && <Alert tone="error">{error}</Alert>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Full name
          </label>
          <input id="name" name="name" className="field" required autoComplete="name" />
        </div>
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
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="field"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Sending code…" : "Sign up"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
        Already have an account?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="font-semibold text-[var(--primary)] hover:underline"
        >
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="px-5 py-12 text-center text-[var(--muted-foreground)]">Loading…</div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
