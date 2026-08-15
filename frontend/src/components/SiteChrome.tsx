"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function SiteHeader() {
  const { session, logout, theme, toggleTheme, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = ["/login", "/signup", "/verify", "/forgot-password", "/reset-password"].some(
    (p) => pathname.startsWith(p)
  );

  return (
    <header className="w-full">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link
          href={session ? "/discover" : "/"}
          className="font-script text-2xl leading-none tracking-tight text-[var(--brand)] md:text-3xl"
        >
          watchamoo
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
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
                Discover
              </Link>
              <Link
                href="/support"
                className={`hidden px-3 py-2 text-sm font-semibold sm:inline ${
                  pathname.startsWith("/support")
                    ? "text-[var(--primary)]"
                    : "text-[var(--foreground)] hover:text-[var(--primary)]"
                }`}
              >
                Support
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-[var(--border)] px-3 py-2 text-xs font-bold text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>

          {ready && session ? (
            <>
              <Link
                href="/account"
                className="hidden text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)] sm:inline"
              >
                Account
              </Link>
              <button
                type="button"
                className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                Log out
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
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90"
                >
                  Sign Up
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
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--cream-soft)] py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-script text-2xl text-[var(--brand)]">watchamoo</p>
          <p className="mt-3 max-w-sm text-sm text-[var(--muted-foreground)]">
            Ad-free nursery rhymes and stories in Sepedi, Sesotho & Setswana — with an AI Discovery
            Assistant for caregivers.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm font-semibold">
          <Link href="/discover" className="hover:text-[var(--primary)]">
            Discover
          </Link>
          <Link href="/support" className="hover:text-[var(--primary)]">
            Support
          </Link>
          <Link href="/signup" className="hover:text-[var(--primary)]">
            Free trial
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-6 text-xs text-[var(--muted-foreground)]">
        $9.99/month after your 7-day free trial. No credit card required to start.
      </p>
    </footer>
  );
}
