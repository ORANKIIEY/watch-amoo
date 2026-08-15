"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AuthCard } from "@/components/ui";
import { fetchDiscoveryInsights } from "@/lib/auth";

export default function AccountPage() {
  const { session, ready, changePassword } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logCount, setLogCount] = useState(0);
  const [matchedPct, setMatchedPct] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && !session) router.replace("/login");
  }, [ready, session, router]);

  useEffect(() => {
    if (!session) return;
    fetchDiscoveryInsights().then((insights) => {
      setLogCount(insights.total);
      setMatchedPct(insights.matchedPct);
    });
  }, [session]);

  async function onChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await changePassword({
      current: String(fd.get("current") || ""),
      next: String(fd.get("next") || ""),
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess("Password updated.");
    e.currentTarget.reset();
  }

  if (!ready || !session) return null;

  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-5 py-12 lg:grid-cols-2">
      <AuthCard title="Your account" subtitle={`Signed in as ${session.email}`}>
        <div className="space-y-3 text-sm text-[var(--muted-foreground)]">
          <p>
            <span className="font-semibold text-[var(--foreground)]">Name:</span> {session.name}
          </p>
          <p>
            <Link href="/discover" className="font-semibold text-[var(--primary)] hover:underline">
              Go to Discover →
            </Link>
          </p>
        </div>

        <div className="mt-8 border-t border-[var(--border)] pt-6">
          <h2 className="text-xl font-bold">Discovery insights</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Market-uptake signals from your AI Discovery queries (stored in SQLite).
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-2xl font-semibold text-[var(--primary)]">{logCount}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Searches logged</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-2xl font-semibold text-[var(--brand)]">{matchedPct}%</p>
              <p className="text-xs text-[var(--muted-foreground)]">Exact matches</p>
            </div>
          </div>
        </div>
      </AuthCard>

      <AuthCard
        title="Change password"
        subtitle="New password needs 8+ characters with a letter and a number."
      >
        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}
        <form onSubmit={onChangePassword} className="space-y-4">
          <div>
            <label className="label" htmlFor="current">
              Current password
            </label>
            <input
              id="current"
              name="current"
              type="password"
              className="field"
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="label" htmlFor="next">
              New password
            </label>
            <input
              id="next"
              name="next"
              type="password"
              className="field"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </AuthCard>
    </div>
  );
}
