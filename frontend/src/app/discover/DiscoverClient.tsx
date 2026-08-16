"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Alert, VideoCard } from "@/components/ui";
import {
  CATALOG,
  fetchCatalog,
  filterCatalog,
  Language,
  LANGUAGES,
  THEME_LABELS,
  Video,
  videosByLanguage,
} from "@/lib/catalog";
import { discoverVideos, EXAMPLE_QUERIES, ParsedFilters, parseQueryLocally } from "@/lib/discovery";

export default function DiscoverClient() {
  const { session, ready } = useAuth();
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<Video[]>(CATALOG);
  const [aiMatches, setAiMatches] = useState<Video[] | null>(null);
  const [filters, setFilters] = useState<ParsedFilters | null>(null);
  const [unmatched, setUnmatched] = useState(false);
  const [searched, setSearched] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    void fetchCatalog().then((videos) => {
      if (videos.length > 0) setCatalog(videos);
    });
  }, []);

  function runDiscover(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    const pool = catalog.length ? catalog : CATALOG;

    // Instant local results so the UI never sits on "Thinking…"
    const local = parseQueryLocally(trimmed);
    const exact = filterCatalog(
      { language: local.language, theme: local.theme, ageRange: local.ageRange },
      pool
    );
    let instant = exact;
    if (instant.length === 0 && local.language) {
      instant = filterCatalog({ language: local.language }, pool);
    }
    if (instant.length === 0) instant = [...pool];

    setQuery(trimmed);
    setAiError("");
    setSearched(true);
    setFilters(local);
    setAiMatches(instant);
    setUnmatched(
      Boolean(local.language || local.theme || local.ageRange) && exact.length === 0
    );
    setAiLoading(true);
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    void discoverVideos(trimmed, pool)
      .then((result) => {
        setAiMatches(result.matches);
        setFilters(result.filters);
        setUnmatched(result.unmatchedDemand);
      })
      .catch(() => {
        setAiError("Could not reach the discovery service — showing local matches.");
      })
      .finally(() => setAiLoading(false));
  }

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) runDiscover(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when URL q changes
  }, [searchParams]);

  function clearSearch() {
    setAiMatches(null);
    setFilters(null);
    setSearched(false);
    setUnmatched(false);
    setQuery("");
    setAiError("");
    setAiLoading(false);
  }

  const sections = useMemo(
    () =>
      LANGUAGES.map((lang) => ({
        language: lang,
        videos: videosByLanguage(lang, catalog.length ? catalog : CATALOG),
      })),
    [catalog]
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="fade-up max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-wider text-[var(--primary)]">
          AI Discovery Assistant
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">
          What are you looking for?
        </h1>
        <p className="mt-3 text-lg text-[var(--foreground)]/70">
          Ask in plain words (language, age, theme). We&apos;ll match Sepedi, Sesotho or Setswana
          videos. Sign in (top-right) to play.
        </p>
      </div>

      {!ready ? null : !session ? (
        <div className="mt-6">
          <Alert tone="info">
            Browse and ask the AI freely.{" "}
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

      <div className="fade-up-delay mt-8">
        <div className="flex flex-col gap-3 rounded-3xl border border-[var(--border)]/50 bg-[var(--card)] p-3 shadow-xl sm:flex-row sm:items-center sm:p-4">
          <input
            className="field !border-0 !bg-transparent !shadow-none focus:!shadow-none"
            placeholder='e.g. "songs in Sepedi for my 2-year-old"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                runDiscover(query);
              }
            }}
            aria-label="AI discovery query"
          />
          <button
            type="button"
            className="btn btn-primary shrink-0 px-8 py-3.5"
            disabled={!query.trim()}
            onClick={() => runDiscover(query)}
          >
            {aiLoading ? "Refining…" : "Ask AI"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => runDiscover(example)}
              className="rounded-full border border-[var(--border)] bg-[var(--cream-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {aiError && (
        <div className="mt-5">
          <Alert tone="error">{aiError}</Alert>
        </div>
      )}

      {searched && filters && (
        <div className="mt-5 space-y-3">
          <Alert tone="success">
            {filters.rationale}
            {filters.source ? ` · source: ${filters.source}` : ""}
            {aiLoading ? " · refining…" : ""}
          </Alert>
          {unmatched && (
            <Alert tone="info">
              No exact theme/age match in the pilot — showing the closest language videos.
            </Alert>
          )}
          <div className="flex flex-wrap gap-2 text-sm">
            {[
              filters.language && `Language: ${filters.language}`,
              filters.theme && `Theme: ${THEME_LABELS[filters.theme] || filters.theme}`,
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
            onClick={clearSearch}
          >
            Clear AI results
          </button>
        </div>
      )}

      {aiMatches !== null && (
        <section
          ref={resultsRef}
          className="mt-8 scroll-mt-28"
          aria-labelledby="ai-results"
          aria-busy={aiLoading}
        >
          <h2 id="ai-results" className="mb-4 text-2xl font-black">
            AI matches ({aiMatches.length})
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {aiMatches.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      <div className={`space-y-14 ${aiMatches !== null ? "mt-14" : "mt-12"}`}>
        <h2 className="text-2xl font-black tracking-tight md:text-3xl">Browse by language</h2>
        {sections.map(({ language, videos }) => (
          <LanguageSection key={language} language={language} videos={videos} />
        ))}
      </div>
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
