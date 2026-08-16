"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AuthCard, VideoCard } from "@/components/ui";
import {
  fetchContinueWatching,
  fetchDiscoveryInsights,
  fetchFavorites,
  fetchParental,
  setKidsMode,
  setParentalPin,
} from "@/lib/auth";
import { fetchCatalog, getVideoById, Video } from "@/lib/catalog";

export default function AccountPage() {
  const { session, ready, changePassword } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logCount, setLogCount] = useState(0);
  const [matchedPct, setMatchedPct] = useState(0);
  const [unmatched, setUnmatched] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [kidsMode, setKidsModeState] = useState(false);
  const [pinMsg, setPinMsg] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [continueVideos, setContinueVideos] = useState<Video[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<Video[]>([]);

  useEffect(() => {
    if (ready && !session) router.replace("/login");
  }, [ready, session, router]);

  useEffect(() => {
    if (!session) return;
    fetchDiscoveryInsights().then((insights) => {
      setLogCount(insights.total);
      setMatchedPct(insights.matchedPct);
      setUnmatched(insights.unmatchedDemand || 0);
    });
    fetchParental().then((p) => {
      setHasPin(p.hasPin);
      setKidsModeState(p.kidsMode);
    });
    void fetchCatalog().then(async () => {
      const [cont, favIds] = await Promise.all([fetchContinueWatching(), fetchFavorites()]);
      setContinueVideos(
        cont
          .map((c) => getVideoById(c.videoId))
          .filter((v): v is Video => Boolean(v))
      );
      setFavoriteVideos(
        favIds.map((id) => getVideoById(id)).filter((v): v is Video => Boolean(v))
      );
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

  async function onSetPin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPinErr("");
    setPinMsg("");
    const fd = new FormData(e.currentTarget);
    const pin = String(fd.get("pin") || "");
    const currentPin = String(fd.get("currentPin") || "") || undefined;
    const result = await setParentalPin(pin, currentPin);
    if (!result.ok) {
      setPinErr(result.error);
      return;
    }
    setHasPin(true);
    setPinMsg("Parental PIN saved.");
    e.currentTarget.reset();
  }

  async function onKidsMode(enable: boolean, e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    setPinErr("");
    setPinMsg("");
    let pin: string | undefined;
    if (e) {
      const fd = new FormData(e.currentTarget);
      pin = String(fd.get("pin") || "") || undefined;
    }
    const result = await setKidsMode(enable, pin);
    if (!result.ok) {
      setPinErr(result.error);
      return;
    }
    setKidsModeState(enable);
    setPinMsg(enable ? "Kids Mode on." : "Kids Mode off.");
  }

  if (!ready || !session) return null;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-5 py-12 lg:grid-cols-2">
      <AuthCard title="Your account" subtitle={`Signed in as ${session.email}`}>
        <div className="space-y-3 text-sm text-[var(--muted-foreground)]">
          <p>
            <span className="font-semibold text-[var(--foreground)]">Name:</span> {session.name}
          </p>
          <p>
            <Link href="/watch" className="font-semibold text-[var(--primary)] hover:underline">
              Go to Watch →
            </Link>
            {" · "}
            <Link href="/language" className="font-semibold text-[var(--primary)] hover:underline">
              Change language
            </Link>
          </p>
        </div>

        <div className="mt-8 border-t border-[var(--border)] pt-6">
          <h2 className="text-xl font-bold">Discovery insights</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Market-uptake signals from your AI Discovery queries (SQLite).
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-2xl font-semibold text-[var(--primary)]">{logCount}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Searches</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-2xl font-semibold text-[var(--brand)]">{matchedPct}%</p>
              <p className="text-xs text-[var(--muted-foreground)]">Exact matches</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-2xl font-semibold text-[var(--foreground)]">{unmatched}</p>
              <p className="text-xs text-[var(--muted-foreground)]">Unmatched</p>
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

      <AuthCard
        title="Parental PIN & Kids Mode"
        subtitle="Lock the adult account behind a 4-digit PIN when kids are watching."
      >
        {pinErr && <Alert tone="error">{pinErr}</Alert>}
        {pinMsg && <Alert tone="success">{pinMsg}</Alert>}
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          Status: {hasPin ? "PIN set" : "No PIN yet"} · Kids Mode{" "}
          <strong>{kidsMode ? "ON" : "OFF"}</strong>
        </p>
        <form onSubmit={onSetPin} className="space-y-3">
          {hasPin ? (
            <div>
              <label className="label" htmlFor="currentPin">
                Current PIN
              </label>
              <input
                id="currentPin"
                name="currentPin"
                className="field"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                required
              />
            </div>
          ) : null}
          <div>
            <label className="label" htmlFor="pin">
              {hasPin ? "New PIN" : "Create 4-digit PIN"}
            </label>
            <input
              id="pin"
              name="pin"
              className="field"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
            />
          </div>
          <button type="submit" className="btn btn-secondary w-full">
            Save PIN
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!hasPin || kidsMode}
            onClick={() => void onKidsMode(true)}
          >
            Enter Kids Mode
          </button>
        </div>
        {kidsMode ? (
          <form onSubmit={(e) => void onKidsMode(false, e)} className="mt-4 space-y-3">
            <label className="label" htmlFor="exitPin">
              PIN to exit Kids Mode
            </label>
            <input
              id="exitPin"
              name="pin"
              className="field"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
            />
            <button type="submit" className="btn btn-secondary w-full">
              Exit Kids Mode
            </button>
          </form>
        ) : null}
      </AuthCard>

      <div className="space-y-8 lg:col-span-2">
        {continueVideos.length > 0 ? (
          <section aria-labelledby="continue-heading">
            <h2 id="continue-heading" className="text-2xl font-black">
              Continue watching
            </h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {continueVideos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </section>
        ) : null}
        {favoriteVideos.length > 0 ? (
          <section aria-labelledby="fav-heading">
            <h2 id="fav-heading" className="text-2xl font-black">
              Favorites
            </h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {favoriteVideos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
