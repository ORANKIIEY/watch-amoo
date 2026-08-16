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

function SignupForm() {
  const { signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    setError("");
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in name, email, and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const result = await signup({ name, email, password });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.loggedIn) {
      router.push(next);
      return;
    }
    sessionStorage.setItem("watchamoo_pending_email", result.email);
    sessionStorage.setItem("watchamoo_next", next);
    router.push("/verify");
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="We’ll email you a confirmation link. After you confirm, you can sign in and play videos."
    >
      {error && <Alert tone="error">{error}</Alert>}
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            className="field"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
          />
        </div>
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
          disabled={loading}
          onClick={() => void submit()}
        >
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </div>
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
