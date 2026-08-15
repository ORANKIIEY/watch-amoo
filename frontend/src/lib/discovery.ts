import {
  AGE_RANGES,
  AgeRange,
  filterCatalog,
  Language,
  LANGUAGES,
  Theme,
  THEMES,
  Video,
} from "./catalog";
import { logDiscovery } from "./auth";

export type ParsedFilters = {
  language: Language | null;
  theme: Theme | null;
  ageRange: AgeRange | null;
  confidence: "high" | "medium" | "low";
  rationale: string;
};

const LANGUAGE_ALIASES: Record<string, Language> = {
  sepedi: "Sepedi",
  pedi: "Sepedi",
  northernsotho: "Sepedi",
  "northern sotho": "Sepedi",
  sesotho: "Sesotho",
  sotho: "Sesotho",
  southernsotho: "Sesotho",
  "southern sotho": "Sesotho",
  setswana: "Setswana",
  tswana: "Setswana",
};

const THEME_ALIASES: Record<string, Theme> = {
  animal: "animals",
  animals: "animals",
  farm: "animals",
  lion: "animals",
  elephant: "animals",
  bird: "animals",
  zebra: "animals",
  lullaby: "lullabies",
  lullabies: "lullabies",
  sleep: "lullabies",
  bedtime: "lullabies",
  night: "lullabies",
  number: "numbers",
  numbers: "numbers",
  count: "numbers",
  counting: "numbers",
  family: "family",
  mama: "family",
  mother: "family",
  home: "family",
  nature: "nature",
  rain: "nature",
  river: "nature",
  mountain: "nature",
  sun: "nature",
  everyday: "everyday",
  routine: "everyday",
  hygiene: "everyday",
  wash: "everyday",
  brush: "everyday",
  thank: "everyday",
  greeting: "greeting",
  hello: "greeting",
  goodmorning: "greeting",
  dumela: "greeting",
  lumela: "greeting",
};

/** Local NLP-style parser so the Discovery Assistant works without an API key. */
export function parseQueryLocally(query: string): ParsedFilters {
  const q = query.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const compact = q.replace(/[^a-z0-9\s]/g, " ");

  let language: Language | null = null;
  for (const [alias, lang] of Object.entries(LANGUAGE_ALIASES)) {
    if (compact.includes(alias)) {
      language = lang;
      break;
    }
  }

  let theme: Theme | null = null;
  for (const [alias, t] of Object.entries(THEME_ALIASES)) {
    if (compact.includes(alias)) {
      theme = t;
      break;
    }
  }

  let ageRange: AgeRange | null = null;
  const ageMatch =
    compact.match(/(\d+)\s*(?:year|yr|y\.?o\.?|month|mo)/) ||
    compact.match(/for\s+(?:my\s+)?(\d+)/) ||
    compact.match(/age\s*(\d+)/);
  if (ageMatch) {
    const n = Number(ageMatch[1]);
    if (compact.includes("month") || compact.includes("mo")) {
      ageRange = "0-2";
    } else if (n <= 2) ageRange = "0-2";
    else if (n <= 4) ageRange = "2-4";
    else ageRange = "4-6";
  } else if (/\bbaby\b|\btoddler\b|\binfant\b/.test(compact)) {
    ageRange = "0-2";
  } else if (/\bpreschool\b|\bkid\b|\bchild\b/.test(compact)) {
    ageRange = "2-4";
  }

  const hits = [language, theme, ageRange].filter(Boolean).length;
  const confidence = hits >= 2 ? "high" : hits === 1 ? "medium" : "low";
  const bits = [
    language ? `language=${language}` : null,
    theme ? `theme=${theme}` : null,
    ageRange ? `age=${ageRange}` : null,
  ].filter(Boolean);

  return {
    language,
    theme,
    ageRange,
    confidence,
    rationale:
      bits.length > 0
        ? `AI model parsed ${bits.join(", ")} from your request.`
        : "No clear language/theme/age found — showing popular picks from the pilot catalog.",
  };
}

export function discoverVideos(query: string): {
  filters: ParsedFilters;
  matches: Video[];
  unmatchedDemand: boolean;
} {
  const filters = parseQueryLocally(query);
  const hasFilters = Boolean(filters.language || filters.theme || filters.ageRange);

  let matches: Video[] = [];
  if (hasFilters) {
    matches = filterCatalog({
      language: filters.language,
      theme: filters.theme,
      ageRange: filters.ageRange,
    });

    if (matches.length === 0) {
      matches = filterCatalog({
        language: filters.language,
        theme: filters.theme,
        ageRange: null,
      });
    }
    if (matches.length === 0 && filters.language) {
      matches = filterCatalog({ language: filters.language });
    }
  }

  const exact = hasFilters
    ? filterCatalog({
        language: filters.language,
        theme: filters.theme,
        ageRange: filters.ageRange,
      })
    : [];
  const unmatchedDemand = hasFilters && exact.length === 0;

  void logDiscovery({
    query,
    language: filters.language,
    theme: filters.theme,
    ageRange: filters.ageRange,
    matchCount: exact.length,
    matchedIds: exact.map((v) => v.id),
  });

  return { filters, matches, unmatchedDemand };
}

export const DISCOVERY_VOCAB = {
  languages: LANGUAGES,
  themes: THEMES,
  ageRanges: AGE_RANGES,
};

export const EXAMPLE_QUERIES = [
  "nursery rhymes in Sepedi",
  "Sesotho songs for my baby",
  "Setswana videos for kids",
];
