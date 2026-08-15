"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { EXAMPLE_QUERIES } from "@/lib/discovery";

function PlayIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
    </svg>
  );
}

function BanIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M4.929 4.929 19.07 19.071" />
    </svg>
  );
}

function LanguagesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]" aria-hidden>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState(EXAMPLE_QUERIES[0]);

  function tryAi(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/discover?q=${encodeURIComponent(q)}`);
  }

  return (
    <div>
      {/* Hero — matches Lovable composition, brand as script logo in header */}
      <section className="px-6 pb-16 pt-8">
        <div className="fade-up mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-black leading-[1.02] md:text-7xl">
            <span className="text-[var(--foreground)]">African Language</span>{" "}
            <span className="text-[var(--primary)]">Entertainment for Kids</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[var(--foreground)]/70 md:text-xl">
            Discover our joyful collection of nursery rhyme videos and fun content in your
            child&apos;s native tongue — plus ask our AI what you need.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-3 rounded-full bg-[var(--primary)] px-10 py-5 text-lg font-bold text-[var(--primary-foreground)] transition hover:opacity-90"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-foreground)]/20">
                <PlayIcon />
              </span>
              Start 7-Day Free Trial
            </Link>
            <p className="text-sm font-semibold text-[var(--primary)]">
              $9.99/month after your 7-day free trial
            </p>
          </div>

          <div className="relative mt-14 aspect-[16/10] overflow-hidden rounded-3xl border border-[var(--border)]/40 bg-[var(--cream-soft)] shadow-xl">
            <Image
              src="/hero-preview.png"
              alt="watchamoo preview"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 896px) 100vw, 896px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            <Link
              href="/discover"
              aria-label="Play preview"
              className="soft-bounce absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--primary)]/90 text-[var(--primary-foreground)] shadow-2xl transition hover:scale-105"
            >
              <PlayIcon className="ml-1 h-8 w-8" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature tiles — Lovable style + AI tile */}
      <section className="bg-[var(--cream-soft)] px-6 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-[var(--tile-pink)] p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--background)]">
              <BanIcon />
            </div>
            <h3 className="mb-3 text-xl font-bold">100% Ad-Free</h3>
            <p className="text-sm leading-relaxed text-[var(--foreground)]/75">
              Kids enjoy uninterrupted video entertainment with no ads, pop-ups or distractions.
            </p>
          </div>
          <div className="rounded-3xl bg-[var(--tile-mint)] p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--background)]">
              <LanguagesIcon />
            </div>
            <h3 className="mb-3 text-xl font-bold">Multiple African Languages</h3>
            <p className="text-sm leading-relaxed text-[var(--foreground)]/75">
              Explore nursery rhyme videos in Sepedi, Sesotho and Setswana, with more languages
              coming soon.
            </p>
          </div>
          <div className="rounded-3xl bg-[var(--tile-yellow)] p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--background)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]" aria-hidden>
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-bold">New Content Every Month</h3>
            <p className="text-sm leading-relaxed text-[var(--foreground)]/75">
              Our video library is updated every month to give your little one something new to
              discover and enjoy.
            </p>
          </div>
          <div className="rounded-3xl bg-[var(--tile-lavender)] p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--background)]">
              <SparkIcon />
            </div>
            <h3 className="mb-3 text-xl font-bold">AI Discovery Model</h3>
            <p className="text-sm leading-relaxed text-[var(--foreground)]/75">
              Just ask in plain words — our AI parses language, theme and age, then matches the
              catalog for you.
            </p>
          </div>
        </div>
      </section>

      {/* AI model demo section — key addition vs Lovable */}
      <section className="px-6 py-20">
        <div className="fade-up mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-[var(--primary)]">
            AI Discovery Assistant
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
            Ask for a song.{" "}
            <span className="text-[var(--primary)]">Our model finds it.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--foreground)]/70">
            Type what you need like you would tell a friend. The AI turns it into filters and shows
            matching Sepedi, Sesotho or Setswana videos.
          </p>
        </div>

        <form
          onSubmit={tryAi}
          className="fade-up-delay mx-auto mt-10 max-w-2xl rounded-3xl border border-[var(--border)]/50 bg-[var(--card)] p-3 shadow-xl sm:p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="field !border-0 !bg-transparent !shadow-none focus:!shadow-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "songs about animals in Sepedi for my 2-year-old"'
              aria-label="AI discovery query"
            />
            <button type="submit" className="btn btn-primary shrink-0 px-8 py-3.5">
              Ask AI
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 px-1">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuery(example)}
                className="rounded-full border border-[var(--border)] bg-[var(--cream-soft)] px-3 py-1.5 text-left text-xs font-semibold text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                {example}
              </button>
            ))}
          </div>
        </form>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[var(--cream-soft)] px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black tracking-tight md:text-5xl">
            Ready for worry-free screen time?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--foreground)]/70">
            Join parents who trust watchamoo for African language entertainment. Start your 7-day
            free trial today.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-[var(--primary)] px-10 py-5 text-lg font-bold text-[var(--primary-foreground)] transition hover:opacity-90"
          >
            Get Started Now
          </Link>
          <p className="mt-4 text-sm font-semibold text-[var(--muted-foreground)]">
            $9.99/month after your 7-day free trial. No credit card required to start.
          </p>
        </div>
      </section>
    </div>
  );
}
