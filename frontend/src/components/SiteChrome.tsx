"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";

/** Logo left · nav + theme + auth pinned top-right */
export function SiteHeader() {
  const { session, logout, theme, toggleTheme } = useAuth();
  const { copy } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = ["/login", "/signup", "/verify", "/forgot-password", "/reset-password"].some(
    (p) => pathname.startsWith(p)
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)]/60 bg-[var(--background)]/95 backdrop-blur-sm">
      <a href="#main-content" className="skip-link">
        {copy.skipToContent}
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
        <Link
          href={session ? "/discover" : "/"}
          className="font-script text-2xl leading-none tracking-tight text-[var(--brand)] md:text-3xl"
        >
          watchamoo
        </Link>

        {!isAuthPage && (
          <nav
            className="flex shrink-0 items-center justify-end gap-1 sm:gap-2"
            aria-label="Primary"
          >
            <Link
              href="/discover"
              className={`rounded-full px-3 py-2 text-sm font-semibold ${
                pathname.startsWith("/discover")
                  ? "bg-[var(--cream-soft)] text-[var(--primary)]"
                  : "text-[var(--foreground)] hover:text-[var(--primary)]"
              }`}
            >
              {copy.discover}
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-bold text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              aria-label={theme === "dark" ? `Switch to ${copy.light} mode` : `Switch to ${copy.dark} mode`}
              aria-pressed={theme === "dark"}
            >
              {theme === "dark" ? copy.light : copy.dark}
            </button>

            {session ? (
              <>
                <Link
                  href="/account"
                  className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)]"
                >
                  {copy.account}
                </Link>
                <button
                  type="button"
                  className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90"
                  onClick={() => {
                    void logout().then(() => router.push("/"));
                  }}
                >
                  {copy.logOut}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)]"
                >
                  {copy.signIn}
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90"
                >
                  {copy.signUp}
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { copy } = useLocale();
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--cream-soft)] py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-script text-2xl text-[var(--brand)]">watchamoo</p>
        <p className="mt-3 max-w-md text-sm text-[var(--muted-foreground)]">{copy.footerTagline}</p>
        <p className="mt-6 text-xs text-[var(--muted-foreground)]">
          Use Discover, theme, Sign In, and Sign Up in the top-right corner.
        </p>
      </div>
    </footer>
  );
}
