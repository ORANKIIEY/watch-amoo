import Link from "next/link";
import { THEME_LABELS, Video } from "@/lib/catalog";

export function VideoCard({ video }: { video: Video }) {
  return (
    <Link
      href={`/watch/${video.id}`}
      className="group block overflow-hidden rounded-3xl border border-[var(--border)]/50 bg-[var(--card)] shadow-[var(--shadow)] transition duration-300 hover:-translate-y-1 hover:border-[var(--primary)]"
    >
      <div
        className="video-thumb relative aspect-video overflow-hidden"
        style={
          {
            "--thumb-a": video.thumbA,
            "--thumb-b": video.thumbB,
            backgroundImage: video.thumbnailSrc ? `url(${video.thumbnailSrc})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          } as React.CSSProperties
        }
      >
        <div className="absolute inset-0 flex items-end justify-between p-3">
          <span className="rounded-full bg-black/35 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
            {video.language}
          </span>
          <span className="rounded-full bg-black/35 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
            {video.duration}
          </span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[var(--primary)] shadow-lg">
            ▶
          </span>
        </div>
      </div>
      <div className="space-y-1.5 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand)]">
          {THEME_LABELS[video.theme]} · Ages {video.ageRange}
        </p>
        <h3 className="text-lg font-bold leading-snug text-[var(--foreground)]">
          {video.titleLocal}
        </h3>
        <p className="text-sm text-[var(--muted-foreground)]">{video.title}</p>
      </div>
    </Link>
  );
}

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-5 py-12">
      <div className="surface rounded-3xl p-7 sm:p-8">
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-[var(--muted-foreground)]">{subtitle}</p>}
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error";
  children: React.ReactNode;
}) {
  const styles =
    tone === "error"
      ? "border-[color-mix(in_oklab,var(--destructive)_35%,transparent)] bg-[color-mix(in_oklab,var(--destructive)_10%,transparent)] text-[var(--destructive)]"
      : tone === "success"
        ? "border-[color-mix(in_oklab,var(--success)_35%,transparent)] bg-[color-mix(in_oklab,var(--success)_10%,transparent)] text-[var(--success)]"
        : "border-[var(--border)] bg-[var(--cream-soft)] text-[var(--muted-foreground)]";
  return (
    <div className={`mb-4 rounded-xl border px-3.5 py-3 text-sm ${styles}`}>{children}</div>
  );
}
