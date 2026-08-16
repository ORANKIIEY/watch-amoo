"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { VideoCard } from "@/components/ui";
import {
  hasActiveAccess,
  loadProfile,
  toCatalogLanguage,
  type Profile,
} from "@/lib/access";
import {
  CATALOG,
  fetchCatalog,
  THEME_LABELS,
  THEMES,
  Video,
} from "@/lib/catalog";

export default function WatchHome() {
  const router = useRouter();
  const { session, ready } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checked, setChecked] = useState(false);
  const [catalog, setCatalog] = useState<Video[]>(CATALOG);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login?next=/watch");
      return;
    }

    void Promise.all([loadProfile(), fetchCatalog()]).then(([nextProfile, videos]) => {
      setProfile(nextProfile);
      if (videos.length > 0) setCatalog(videos);
      setChecked(true);

      if (!nextProfile) return;
      if (!nextProfile.language) {
        router.replace("/language");
        return;
      }
      if (!hasActiveAccess(nextProfile)) {
        router.replace(nextProfile.subscription_status === "none" ? "/subscribe" : "/paywall");
      }
    });
  }, [ready, session, router]);

  const language = toCatalogLanguage(profile?.language);
  const sections = useMemo(() => {
    const videos = language ? catalog.filter((video) => video.language === language) : [];
    return THEMES.map((theme) => ({
      id: theme,
      name: THEME_LABELS[theme],
      videos: videos.filter((video) => video.theme === theme),
    })).filter((section) => section.videos.length > 0);
  }, [catalog, language]);

  if (!ready || !checked || !profile || !hasActiveAccess(profile) || !language) return null;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-4">
      <p className="mb-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {language}
      </p>

      {sections.map((section) => (
        <section key={section.id} className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black text-foreground md:text-3xl">{section.name}</h2>
            <Link
              href={`/discover#${language.toLowerCase()}`}
              className="inline-flex items-center gap-1 text-sm font-bold text-primary"
            >
              View All
              <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {section.videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      ))}

      {sections.length === 0 ? (
        <p className="text-muted-foreground">
          No {language} videos in the catalog yet.{" "}
          <Link href="/discover" className="font-bold text-primary hover:underline">
            Browse Discover
          </Link>
        </p>
      ) : null}
    </main>
  );
}
