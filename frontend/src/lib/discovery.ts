import {
  AGE_RANGES,
  AgeRange,
  CATALOG,
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
  source?: "llm" | "local";
};

const LANGUAGE_ALIASES: Record<string, Language> = {
  sepedi: "Sepedi",
  pedi: "Sepedi",
  northernsotho: "Sepedi",
  "northern sotho": "Sepedi",
  nso: "Sepedi",
  sesotho: "Sesotho",
  "southern sotho": "Sesotho",
  southernsotho: "Sesotho",
  sot: "Sesotho",
  setswana: "Setswana",
  tswana: "Setswana",
  tsn: "Setswana",
  sotho: "Sesotho",
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
  greetings: "greeting",
  hello: "greeting",
  goodmorning: "greeting",
  dumela: "greeting",
  lumela: "greeting",
  nursery: "greeting",
  rhyme: "greeting",
  rhymes: "greeting",
  song: "lullabies",
  songs: "lullabies",
};

/** Local parser — works offline without an LLM key. Instant. */
export function parseQueryLocally(query: string): ParsedFilters {
  const q = query.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const compact = q.replace(/[^a-z0-9\s]/g, " ");

  let language: Language | null = null;
  const langEntries = Object.entries(LANGUAGE_ALIASES).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, lang] of langEntries) {
    if (compact.includes(alias)) {
      language = lang;
      break;
    }
  }

  let theme: Theme | null = null;
  const themeEntries = Object.entries(THEME_ALIASES).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, t] of themeEntries) {
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
    if (compact.includes("month") || compact.includes("mo")) ageRange = "0-2";
    else if (n <= 2) ageRange = "0-2";
    else if (n <= 4) ageRange = "2-4";
    else ageRange = "4-6";
  } else if (/\bbaby\b|\btoddler\b|\binfant\b/.test(compact)) {
    ageRange = "0-2";
  } else if (/\bpreschool\b|\bkids?\b|\bchildren\b|\bchild\b/.test(compact)) {
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
    source: "local",
    rationale:
      bits.length > 0
        ? `AI Discovery understood ${bits.join(", ")}.`
        : "No clear language/theme/age — showing the full pilot catalog.",
  };
}

async function parseQueryRemote(query: string): Promise<ParsedFilters | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch("/api/discovery/parse", {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; filters?: ParsedFilters };
    if (!data.ok || !data.filters) return null;
    return {
      ...data.filters,
      source: data.filters.source || "local",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function matchVideos(filters: ParsedFilters, pool: Video[]): { matches: Video[]; unmatchedDemand: boolean } {
  const tryFilter = (f: {
    language?: Language | null;
    theme?: Theme | null;
    ageRange?: AgeRange | null;
  }) => filterCatalog(f, pool);

  let matches: Video[] = [];
  if (filters.language || filters.theme || filters.ageRange) {
    matches = tryFilter({
      language: filters.language,
      theme: filters.theme,
      ageRange: filters.ageRange,
    });
    if (matches.length === 0) {
      matches = tryFilter({
        language: filters.language,
        theme: filters.theme,
        ageRange: null,
      });
    }
    if (matches.length === 0 && filters.language) {
      matches = tryFilter({ language: filters.language });
    }
    if (matches.length === 0 && filters.theme) {
      matches = tryFilter({ theme: filters.theme });
    }
  }

  const exact = tryFilter({
    language: filters.language,
    theme: filters.theme,
    ageRange: filters.ageRange,
  });
  const hasFilters = Boolean(filters.language || filters.theme || filters.ageRange);
  const unmatchedDemand = hasFilters && exact.length === 0;

  if (matches.length === 0) {
    matches = [...pool];
  }

  return { matches, unmatchedDemand };
}

/**
 * Instant local match, then optionally upgrade with a remote/LLM parse (2.5s timeout).
 * Never blocks the UI on a hanging API.
 */
export async function discoverVideos(
  query: string,
  catalog?: Video[]
): Promise<{
  filters: ParsedFilters;
  matches: Video[];
  unmatchedDemand: boolean;
}> {
  const pool = catalog && catalog.length > 0 ? catalog : CATALOG;
  const local = parseQueryLocally(query);
  const localResult = matchVideos(local, pool);

  // Try remote briefly; keep local if it fails/times out
  const remote = await parseQueryRemote(query);
  const filters = remote || local;
  const { matches, unmatchedDemand } = remote ? matchVideos(remote, pool) : localResult;

  void logDiscovery({
    query,
    language: filters.language,
    theme: filters.theme,
    ageRange: filters.ageRange,
    matchCount: matches.length,
    matchedIds: matches.map((v) => v.id),
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
