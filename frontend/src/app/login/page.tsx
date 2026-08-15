"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AuthCard } from "@/components/ui";

function safeNext(path: string | null) {
  if (path && path.startsWith("/") && !path.startsWith("//")) return path;
  return "/discover";
}

function LoginForm() {
  const { login } = useAuth();
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
    const email = String(fd.get("email") || "");
    const result = await login({
      email,
      password: String(fd.get("password") || ""),
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.needsVerification) {
      sessionStorage.setItem(
        "watchamoo_pending_email",
        (result.email || email).trim().toLowerCase()
      );
      sessionStorage.setItem("watchamoo_next", next);
      router.push("/verify");
      return;
    }
    router.push(next);
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in to play videos for your little one.">
      {error && <Alert tone="error">{error}</Alert>}
      <form onSubmit={onSubmit} className="space-y-4">
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
            autoComplete="current-password"
          />
        </div>
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
        New here?{" "}
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="font-semibold text-[var(--primary)] hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="px-5 py-12 text-center text-[var(--muted-foreground)]">Loading…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
