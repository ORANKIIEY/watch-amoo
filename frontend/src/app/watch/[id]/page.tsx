"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getVideoById, THEME_LABELS, videoSrcFor } from "@/lib/catalog";

export default function WatchPage() {
  const params = useParams<{ id: string }>();
  const { session, ready } = useAuth();
  const video = getVideoById(params.id);

  if (!video) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="text-3xl font-black">Video not found</h1>
        <Link href="/discover" className="btn btn-primary mt-6 inline-flex">
          Back to Discover
        </Link>
      </div>
    );
  }

  const canPlay = ready && Boolean(session);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <Link
        href="/discover"
        className="text-sm font-semibold text-[var(--primary)] hover:underline"
      >
        ← Back to Discover
      </Link>

      <div className="mt-5 overflow-hidden rounded-3xl border border-[var(--border)]/40 bg-black shadow-[var(--shadow)]">
        {canPlay ? (
          <div className="aspect-video w-full bg-black">
            <video
              key={video.language}
              className="h-full w-full"
              controls
              playsInline
              preload="metadata"
              src={video.videoSrc || videoSrcFor(video.language)}
            >
              Your browser does not support video playback.
            </video>
          </div>
        ) : (
          <div
            className="video-thumb relative flex aspect-video flex-col items-center justify-center gap-5 p-8 text-center"
            style={
              {
                "--thumb-a": video.thumbA,
                "--thumb-b": video.thumbB,
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

      <div className="mt-6 max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-wide text-[var(--brand)]">
          {video.language} · {THEME_LABELS[video.theme]} · Ages {video.ageRange}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          {video.titleLocal}
        </h1>
        <p className="mt-1 text-lg text-[var(--muted-foreground)]">{video.title}</p>
        <p className="mt-4 leading-relaxed text-[var(--muted-foreground)]">{video.description}</p>
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">Duration {video.duration}</p>
      </div>
    </div>
  );
}
