"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getStoredLocale, setStoredLocale, t, UiLocale, UI_LOCALES } from "@/lib/i18n";

type LocaleContextValue = {
  locale: UiLocale;
  setLocale: (locale: UiLocale) => void;
  copy: ReturnType<typeof t>;
  locales: typeof UI_LOCALES;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<UiLocale>(() =>
    typeof window === "undefined" ? "en" : getStoredLocale()
  );

  const setLocale = useCallback((next: UiLocale) => {
    setLocaleState(next);
    setStoredLocale(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next === "en" ? "en" : next;
    }
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      copy: t(locale),
      locales: UI_LOCALES,
    }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
