"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AuthCard } from "@/components/ui";

function safeNext(path: string | null) {
  if (path && path.startsWith("/") && !path.startsWith("//")) return path;
  return "/watch";
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    const result = await login({ email, password });
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
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="field"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="field"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
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
        <button
          type="button"
          className="btn btn-primary w-full"
          disabled={loading}
          onClick={() => void submit()}
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </div>
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
