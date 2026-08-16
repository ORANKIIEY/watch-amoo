"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { KidsPlayer } from "@/components/KidsPlayer";
import { VideoCard } from "@/components/ui";
import { hasActiveAccess, loadProfile } from "@/lib/access";
import {
  fetchFavorites,
  reportWatchProgress,
  toggleFavorite,
} from "@/lib/auth";
import { fetchCatalog, fetchVideoById, THEME_LABELS, Video, videoSrcFor } from "@/lib/catalog";

export default function WatchPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session, ready } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchVideoById(params.id), fetchCatalog({ relatedTo: params.id })]).then(
      ([v, rel]) => {
        if (cancelled) return;
        setVideo(v);
        setRelated(rel);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    if (!ready || !session) return;
    void loadProfile().then((profile) => {
      if (!profile?.language) {
        router.replace("/language");
        return;
      }
      if (!hasActiveAccess(profile)) {
        router.replace(profile.subscription_status === "none" ? "/subscribe" : "/paywall");
      }
    });
  }, [ready, session, router]);

  useEffect(() => {
    if (!session || !video) return;
    fetchFavorites().then((ids) => setFavorited(ids.includes(video.id)));
  }, [session, video]);

  const onProgress = useCallback(
    (progressSeconds: number, durationSeconds: number) => {
      if (!session || !video) return;
      void reportWatchProgress({
        videoId: video.id,
        progressSeconds,
        durationSeconds,
        completed: progressSeconds >= durationSeconds * 0.9,
      });
    },
    [session, video]
  );

  if (loading || !ready) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center text-[var(--muted-foreground)]">
        Loading video…
      </div>
    );
  }

  if (!video) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="text-3xl font-black">Video not found</h1>
        <Link href="/watch" className="btn btn-primary mt-6 inline-flex">
          Back to Watch
        </Link>
      </div>
    );
  }

  // Playback only after sign-in / sign-up (verified session cookie)
  const canPlay = Boolean(session);
  const poster = video.thumbnailSrc || undefined;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <Link
        href="/watch"
        className="text-sm font-semibold text-[var(--primary)] hover:underline"
      >
        ← Back to Watch
      </Link>

      <div className="mt-5 overflow-hidden rounded-3xl border border-[var(--border)]/40 bg-black shadow-[var(--shadow)]">
        {canPlay ? (
          <div className="aspect-video w-full bg-black">
            <KidsPlayer
              key={video.id}
              src={video.videoSrc || videoSrcFor(video.language)}
              title={video.titleLocal}
              poster={poster}
              onProgress={onProgress}
            />
          </div>
        ) : (
          <div
            className="video-thumb relative flex aspect-video flex-col items-center justify-center gap-5 p-8 text-center"
            style={
              {
                "--thumb-a": video.thumbA,
                "--thumb-b": video.thumbB,
                backgroundImage: poster ? `url(${poster})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              } as React.CSSProperties
            }
          >
            <div className="absolute inset-0 bg-black/45" />
            <div className="relative z-10 max-w-md space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-2xl text-[var(--primary)] shadow-lg">
                ▶
              </div>
              <h2 className="text-2xl font-black text-white drop-shadow">
                Sign in to play this video
              </h2>
              <p className="text-sm text-white/90">
                Create a free account or log in to watch nursery rhymes on watchamoo.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <Link
                  href={`/login?next=/watch/${video.id}`}
                  className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[var(--primary)] hover:opacity-90"
                >
                  Sign In
                </Link>
                <Link
                  href={`/signup?next=/watch/${video.id}`}
                  className="rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-bold text-[var(--primary-foreground)] hover:opacity-90"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex max-w-3xl flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--brand)]">
            {video.language} · {THEME_LABELS[video.theme]} · Ages {video.ageRange}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            {video.titleLocal}
          </h1>
          <p className="mt-1 text-lg text-[var(--muted-foreground)]">{video.title}</p>
          <p className="mt-4 leading-relaxed text-[var(--muted-foreground)]">{video.description}</p>
        </div>
        {session ? (
          <button
            type="button"
            className="btn btn-secondary shrink-0"
            onClick={() => {
              const next = !favorited;
              setFavorited(next);
              void toggleFavorite(video.id, next);
            }}
            aria-pressed={favorited}
          >
            {favorited ? "★ Favorited" : "☆ Favorite"}
          </button>
        ) : null}
      </div>

      {related.length > 0 ? (
        <section className="mt-12" aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-2xl font-black">
            Related videos
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
