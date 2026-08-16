import { z } from "zod";

export type ParsedDiscovery = {
  language: "Sepedi" | "Sesotho" | "Setswana" | null;
  theme: string | null;
  ageRange: "0-2" | "2-4" | "4-6" | null;
  confidence: "high" | "medium" | "low";
  rationale: string;
  source: "llm" | "local";
};

const LANGUAGE_ALIASES: Record<string, ParsedDiscovery["language"]> = {
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

const THEME_ALIASES: Record<string, string> = {
  animal: "animals",
  animals: "animals",
  farm: "animals",
  lullaby: "lullabies",
  lullabies: "lullabies",
  sleep: "lullabies",
  bedtime: "lullabies",
  number: "numbers",
  numbers: "numbers",
  count: "numbers",
  counting: "numbers",
  family: "family",
  mama: "family",
  mother: "family",
  nature: "nature",
  rain: "nature",
  everyday: "everyday",
  routine: "everyday",
  greeting: "greeting",
  hello: "greeting",
  dumela: "greeting",
  lumela: "greeting",
};

const THEMES = new Set([
  "animals",
  "lullabies",
  "numbers",
  "family",
  "nature",
  "everyday",
  "greeting",
]);
const AGES = new Set(["0-2", "2-4", "4-6"]);
const LANGS = new Set(["Sepedi", "Sesotho", "Setswana"]);

/** Local keyword parser — always available as fallback. */
export function parseQueryLocally(query: string): ParsedDiscovery {
  const q = query.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const compact = q.replace(/[^a-z0-9\s]/g, " ");

  let language: ParsedDiscovery["language"] = null;
  for (const [alias, lang] of Object.entries(LANGUAGE_ALIASES)) {
    if (compact.includes(alias)) {
      language = lang;
      break;
    }
  }

  let theme: string | null = null;
  for (const [alias, t] of Object.entries(THEME_ALIASES)) {
    if (compact.includes(alias)) {
      theme = t;
      break;
    }
  }

  let ageRange: ParsedDiscovery["ageRange"] = null;
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
    rationale:
      bits.length > 0
        ? `Local parser found ${bits.join(", ")}.`
        : "No clear language/theme/age found.",
    source: "local",
  };
}

const llmSchema = z.object({
  language: z.enum(["Sepedi", "Sesotho", "Setswana"]).nullable(),
  theme: z.string().nullable(),
  ageRange: z.enum(["0-2", "2-4", "4-6"]).nullable(),
});

export async function parseQueryWithLlm(query: string): Promise<ParsedDiscovery | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.includes("xxxxxxxx")) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Extract kids video search filters as JSON: {"language":"Sepedi"|"Sesotho"|"Setswana"|null,"theme":"animals"|"lullabies"|"numbers"|"family"|"nature"|"everyday"|"greeting"|null,"ageRange":"0-2"|"2-4"|"4-6"|null}. Only those values.',
          },
          { role: "user", content: query },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = llmSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;

    let theme = parsed.data.theme;
    if (theme && !THEMES.has(theme)) theme = null;
    const language =
      parsed.data.language && LANGS.has(parsed.data.language) ? parsed.data.language : null;
    const ageRange =
      parsed.data.ageRange && AGES.has(parsed.data.ageRange) ? parsed.data.ageRange : null;

    const hits = [language, theme, ageRange].filter(Boolean).length;
    return {
      language,
      theme,
      ageRange,
      confidence: hits >= 2 ? "high" : hits === 1 ? "medium" : "low",
      rationale: "LLM parsed structured filters from your request.",
      source: "llm",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function parseDiscoveryQuery(query: string): Promise<ParsedDiscovery> {
  const llm = await parseQueryWithLlm(query);
  if (llm) return llm;
  return parseQueryLocally(query);
}
