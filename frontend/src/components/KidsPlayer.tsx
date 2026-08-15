"use client";

import { useEffect, useRef } from "react";

type KidsPlayerProps = {
  src: string;
  title: string;
  poster?: string;
  startAt?: number;
  onProgress?: (progressSeconds: number, durationSeconds: number) => void;
};

/**
 * Kids-safe HTML5 player: self-hosted only, no related recommendations,
 * no PiP / remote playback hooks that surface other content.
 */
export function KidsPlayer({ src, title, poster, startAt = 0, onProgress }: KidsPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const lastSent = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (startAt > 0) {
      const seek = () => {
        if (Math.abs(el.currentTime - startAt) > 1) el.currentTime = startAt;
      };
      el.addEventListener("loadedmetadata", seek, { once: true });
    }
  }, [startAt, src]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onProgress) return;

    const tick = () => {
      const now = Date.now();
      if (now - lastSent.current < 4000) return;
      lastSent.current = now;
      if (el.duration && Number.isFinite(el.duration)) {
        onProgress(Math.floor(el.currentTime), Math.floor(el.duration));
      }
    };

    const onEnded = () => {
      if (el.duration && Number.isFinite(el.duration)) {
        onProgress(Math.floor(el.duration), Math.floor(el.duration));
      }
    };

    el.addEventListener("timeupdate", tick);
    el.addEventListener("pause", tick);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", tick);
      el.removeEventListener("pause", tick);
      el.removeEventListener("ended", onEnded);
    };
  }, [onProgress, src]);

  return (
    <video
      ref={ref}
      className="h-full w-full bg-black"
      controls
      controlsList="nodownload noplaybackrate"
      disablePictureInPicture
      playsInline
      preload="metadata"
      poster={poster}
      src={src}
      title={title}
      aria-label={title}
    >
      Your browser does not support video playback.
    </video>
  );
}
