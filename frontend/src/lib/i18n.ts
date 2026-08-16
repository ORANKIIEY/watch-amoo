export type UiLocale = "en" | "nso" | "st" | "tn";

export const UI_LOCALES: { code: UiLocale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "nso", label: "Sepedi" },
  { code: "st", label: "Sesotho" },
  { code: "tn", label: "Setswana" },
];

type Dict = {
  discover: string;
  support: string;
  account: string;
  signIn: string;
  signUp: string;
  logOut: string;
  dark: string;
  light: string;
  footerTagline: string;
  skipToContent: string;
  language: string;
};

const dict: Record<UiLocale, Dict> = {
  en: {
    discover: "Discover",
    support: "Support",
    account: "Account",
    signIn: "Sign In",
    signUp: "Sign Up",
    logOut: "Log out",
    dark: "Dark",
    light: "Light",
    footerTagline:
      "Ad-free nursery rhymes and stories in Sepedi, Sesotho & Setswana — with an AI Discovery Assistant for caregivers.",
    skipToContent: "Skip to content",
    language: "Language",
  },
  nso: {
    discover: "Hwetša",
    support: "Thekgo",
    account: "Akhaonto",
    signIn: "Tsena",
    signUp: "Ngwadiša",
    logOut: "Tšwa",
    dark: "Lefifi",
    light: "Lesedi",
    footerTagline:
      "Dikoša tša bana tša Sepedi, Sesotho le Setswana — ka mothusi wa AI Discovery.",
    skipToContent: "Feta go dikagare",
    language: "Polelo",
  },
  st: {
    discover: "Fumana",
    support: "Tšehetso",
    account: "Akhaonto",
    signIn: "Kena",
    signUp: "Ingodisa",
    logOut: "Tsoa",
    dark: "Lefifi",
    light: "Leseli",
    footerTagline:
      "Lipina tsa bana tsa Sepedi, Sesotho le Setswana — ka mothusi oa AI Discovery.",
    skipToContent: "Feta ho dikahare",
    language: "Puo",
  },
  tn: {
    discover: "Fitlhelela",
    support: "Thuso",
    account: "Akaonto",
    signIn: "Tsena",
    signUp: "Ikwadise",
    logOut: "Tswa",
    dark: "Lefifi",
    light: "Lesedi",
    footerTagline:
      "Dipina tsa bana tsa Sepedi, Sesotho le Setswana — ka mothusi wa AI Discovery.",
    skipToContent: "Feta go dikahare",
    language: "Puo",
  },
};

export function t(locale: UiLocale): Dict {
  return dict[locale] || dict.en;
}

const LOCALE_KEY = "watchamoo_ui_locale";

export function getStoredLocale(): UiLocale {
  if (typeof window === "undefined") return "en";
  try {
    const raw = localStorage.getItem(LOCALE_KEY);
    if (raw === "nso" || raw === "st" || raw === "tn" || raw === "en") return raw;
  } catch {
    /* ignore */
  }
  return "en";
}

export function setStoredLocale(locale: UiLocale) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCALE_KEY, locale);
}
