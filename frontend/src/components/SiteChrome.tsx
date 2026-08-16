"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useLocale } from "./LocaleProvider";

export function SiteHeader() {
  const { session, logout, theme, toggleTheme, ready } = useAuth();
  const { copy, locale, setLocale, locales } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = ["/login", "/signup", "/verify", "/forgot-password", "/reset-password"].some(
    (p) => pathname.startsWith(p)
  );

  return (
    <header className="w-full">
      <a href="#main-content" className="skip-link">
        {copy.skipToContent}
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-6">
        <Link
          href={session ? "/discover" : "/"}
          className="font-script text-2xl leading-none tracking-tight text-[var(--brand)] md:text-3xl"
        >
          watchamoo
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {!isAuthPage && (
            <>
              <Link
                href="/discover"
                className={`hidden px-3 py-2 text-sm font-semibold sm:inline ${
                  pathname.startsWith("/discover")
                    ? "text-[var(--primary)]"
                    : "text-[var(--foreground)] hover:text-[var(--primary)]"
                }`}
              >
                {copy.discover}
              </Link>
              <Link
                href="/support"
                className={`hidden px-3 py-2 text-sm font-semibold sm:inline ${
                  pathname.startsWith("/support")
                    ? "text-[var(--primary)]"
                    : "text-[var(--foreground)] hover:text-[var(--primary)]"
                }`}
              >
                {copy.support}
              </Link>
            </>
          )}

          <label className="sr-only" htmlFor="ui-locale">
            {copy.language}
          </label>
          <select
            id="ui-locale"
            className="rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-2 text-xs font-bold text-[var(--muted-foreground)]"
            value={locale}
            onChange={(e) => setLocale(e.target.value as typeof locale)}
            aria-label={copy.language}
          >
            {locales.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-bold text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            aria-label={theme === "dark" ? copy.light : copy.dark}
          >
            {theme === "dark" ? copy.light : copy.dark}
          </button>

          {ready && session ? (
            <>
              <Link
                href="/account"
                className="hidden text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)] sm:inline"
              >
                {copy.account}
              </Link>
              <button
                type="button"
                className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90"
                onClick={() => {
                  void logout().then(() => router.push("/"));
                }}
              >
                {copy.logOut}
              </button>
            </>
          ) : (
            ready &&
            !isAuthPage && (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)]"
                >
                  {copy.signIn}
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90"
                >
                  {copy.signUp}
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { copy } = useLocale();
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--cream-soft)] py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-script text-2xl text-[var(--brand)]">watchamoo</p>
          <p className="mt-3 max-w-sm text-sm text-[var(--muted-foreground)]">{copy.footerTagline}</p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm font-semibold">
          <Link href="/discover" className="hover:text-[var(--primary)]">
            {copy.discover}
          </Link>
          <Link href="/support" className="hover:text-[var(--primary)]">
            {copy.support}
          </Link>
          <Link href="/signup" className="hover:text-[var(--primary)]">
            {copy.signUp}
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-6 text-xs text-[var(--muted-foreground)]">
        Free pilot — create an account to watch. No subscription billing yet.
      </p>
    </footer>
  );
}
