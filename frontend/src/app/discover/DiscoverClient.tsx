"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Alert, VideoCard } from "@/components/ui";
import {
  CATALOG,
  Language,
  LANGUAGES,
  THEME_LABELS,
  Video,
  videosByLanguage,
} from "@/lib/catalog";
import { discoverVideos, EXAMPLE_QUERIES, ParsedFilters } from "@/lib/discovery";

export default function DiscoverClient() {
  const { session, ready } = useAuth();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [aiMatches, setAiMatches] = useState<Video[] | null>(null);
  const [filters, setFilters] = useState<ParsedFilters | null>(null);
  const [unmatched, setUnmatched] = useState(false);
  const [searched, setSearched] = useState(false);

  function runDiscover(q: string) {
    if (!q.trim()) return;
    const result = discoverVideos(q.trim());
    setAiMatches(result.matches);
    setFilters(result.filters);
    setUnmatched(result.unmatchedDemand);
    setSearched(true);
  }

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      runDiscover(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function onDiscover(e: FormEvent) {
    e.preventDefault();
    runDiscover(query);
  }

  const sections = useMemo(
    () =>
      LANGUAGES.map((lang) => ({
        language: lang,
        videos: videosByLanguage(lang),
      })),
    []
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="fade-up max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-wider text-[var(--primary)]">
          AI Discovery Model
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">
          What are you looking for?
        </h1>
        <p className="mt-3 text-lg text-[var(--foreground)]/70">
          Browse by language, or ask the AI. Sign in to play any video.
        </p>
      </div>

      {!ready ? null : !session ? (
        <div className="mt-6">
          <Alert tone="info">
            You can browse all videos freely.{" "}
            <Link href="/login" className="font-bold text-[var(--primary)] hover:underline">
              Sign In
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="font-bold text-[var(--primary)] hover:underline">
              Sign Up
            </Link>{" "}
            to play.
          </Alert>
        </div>
      ) : null}

      <form onSubmit={onDiscover} className="fade-up-delay mt-8">
        <div className="flex flex-col gap-3 rounded-3xl border border-[var(--border)]/50 bg-[var(--card)] p-3 shadow-xl sm:flex-row sm:items-center sm:p-4">
          <input
            className="field !border-0 !bg-transparent !shadow-none focus:!shadow-none"
            placeholder='e.g. "songs in Sepedi for my 2-year-old"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Discovery query"
          />
          <button type="submit" className="btn btn-primary shrink-0 px-8 py-3.5">
            Ask AI
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setQuery(example);
                runDiscover(example);
              }}
              className="rounded-full border border-[var(--border)] bg-[var(--cream-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              {example}
            </button>
          ))}
        </div>
      </form>

      {searched && filters && (
        <div className="mt-5 space-y-3">
          <Alert tone="success">{filters.rationale}</Alert>
          {unmatched && (
            <Alert tone="info">
              Exact match not in the pilot yet — showing closest videos. This unmatched request is
              logged as market-demand signal.
            </Alert>
          )}
          <div className="flex flex-wrap gap-2 text-sm">
            {[
              filters.language && `Language: ${filters.language}`,
              filters.theme && `Theme: ${THEME_LABELS[filters.theme]}`,
              filters.ageRange && `Ages: ${filters.ageRange}`,
              `Confidence: ${filters.confidence}`,
            ]
              .filter(Boolean)
              .map((chip) => (
                <span
                  key={String(chip)}
                  className="rounded-full border border-[var(--border)] bg-[var(--cream-soft)] px-3 py-1 font-semibold"
                >
                  {chip}
                </span>
              ))}
          </div>
          <button
            type="button"
            className="text-sm font-bold text-[var(--primary)] hover:underline"
            onClick={() => {
              setAiMatches(null);
              setFilters(null);
              setSearched(false);
              setUnmatched(false);
              setQuery("");
            }}
          >
            Clear AI results & browse by language
          </button>
        </div>
      )}

      {aiMatches ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {aiMatches.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
          {aiMatches.length === 0 && (
            <p className="col-span-full text-center text-[var(--muted-foreground)]">
              No videos matched. Try another language or clear AI results.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-12 space-y-14">
          {sections.map(({ language, videos }) => (
            <LanguageSection key={language} language={language} videos={videos} />
          ))}
          <p className="text-center text-sm text-[var(--muted-foreground)]">
            {CATALOG.length} language videos in the pilot catalog
          </p>
        </div>
      )}
    </div>
  );
}

function LanguageSection({ language, videos }: { language: Language; videos: Video[] }) {
  return (
    <section id={language.toLowerCase()} className="scroll-mt-24">
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">{language}</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Nursery rhyme video for the {language} section
          </p>
        </div>
        <span className="rounded-full bg-[var(--cream-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
          {videos.length} video{videos.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  );
}
