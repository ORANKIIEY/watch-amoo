/**
 * Catalog types + offline fallback. Prefer fetchCatalog() which loads from SQLite via API.
 */

export type Language = "Sepedi" | "Sesotho" | "Setswana";
export type Theme =
  | "animals"
  | "lullabies"
  | "numbers"
  | "family"
  | "nature"
  | "everyday"
  | "greeting";
export type AgeRange = "0-2" | "2-4" | "4-6";

export type Video = {
  id: string;
  title: string;
  titleLocal: string;
  language: Language;
  theme: Theme;
  ageRange: AgeRange;
  duration: string;
  description: string;
  videoSrc: string;
  driveFileId?: string | null;
  thumbA: string;
  thumbB: string;
  thumbnailSrc?: string;
};

export const LANGUAGES: Language[] = ["Sepedi", "Sesotho", "Setswana"];
export const THEMES: Theme[] = [
  "animals",
  "lullabies",
  "numbers",
  "family",
  "nature",
  "everyday",
  "greeting",
];
export const AGE_RANGES: AgeRange[] = ["0-2", "2-4", "4-6"];

export const THEME_LABELS: Record<Theme, string> = {
  animals: "Animals",
  lullabies: "Lullabies",
  numbers: "Numbers",
  family: "Family",
  nature: "Nature",
  everyday: "Everyday life",
  greeting: "Greetings",
};

export const VIDEO_SRC_BY_LANGUAGE: Record<Language, string> = {
  Sepedi: "/videos/sepedi/video.mp4",
  Sesotho: "/videos/sesotho/video.mp4",
  Setswana: "/videos/setswana/video.mp4",
};

export function videoSrcFor(language: Language) {
  return VIDEO_SRC_BY_LANGUAGE[language];
}

/** Offline fallback if the API is unavailable. */
export const CATALOG: Video[] = [
  {
    id: "sepedi-main",
    title: "Sepedi nursery rhymes",
    titleLocal: "Dikoša tša Sepedi",
    language: "Sepedi",
    theme: "greeting",
    ageRange: "0-2",
    duration: "Video",
    description:
      "Watch nursery rhyme entertainment in Sepedi — curated for caregivers and little ones.",
    videoSrc: "/videos/sepedi/video.mp4",
    driveFileId: "1YZb5_zr8onVP5hzLoVHA1qHR3UcEgrlc",
    thumbA: "#8B4513",
    thumbB: "#E8A87C",
    thumbnailSrc: "/thumbs/sepedi.svg",
  },
  {
    id: "sesotho-main",
    title: "Sesotho nursery rhymes",
    titleLocal: "Lipina tsa Sesotho",
    language: "Sesotho",
    theme: "lullabies",
    ageRange: "0-2",
    duration: "Video",
    description:
      "Watch nursery rhyme entertainment in Sesotho — curated for caregivers and little ones.",
    videoSrc: "/videos/sesotho/video.mp4",
    driveFileId: "1F_I-Sa5eKvmhuj5H7jWX6tPRv57Qquxl",
    thumbA: "#7c2d12",
    thumbB: "#0b6e63",
    thumbnailSrc: "/thumbs/sesotho.svg",
  },
  {
    id: "setswana-main",
    title: "Setswana nursery rhymes",
    titleLocal: "Dipina tsa Setswana",
    language: "Setswana",
    theme: "everyday",
    ageRange: "2-4",
    duration: "Video",
    description:
      "Watch nursery rhyme entertainment in Setswana — curated for caregivers and little ones.",
    videoSrc: "/videos/setswana/video.mp4",
    driveFileId: "1PcnRFpwi1cZ9gEzUgvKtigEvwA8WNjEZ",
    thumbA: "#9a3412",
    thumbB: "#e8902a",
    thumbnailSrc: "/thumbs/setswana.svg",
  },
];

let catalogCache: Video[] | null = null;

function normalizeVideo(raw: Record<string, unknown>): Video {
  return {
    id: String(raw.id),
    title: String(raw.title),
    titleLocal: String(raw.titleLocal),
    language: raw.language as Language,
    theme: raw.theme as Theme,
    ageRange: raw.ageRange as AgeRange,
    duration: String(raw.duration),
    description: String(raw.description),
    videoSrc: String(raw.videoSrc),
    driveFileId: (raw.driveFileId as string) || null,
    thumbA: String(raw.thumbA),
    thumbB: String(raw.thumbB),
    thumbnailSrc: String(raw.thumbnailSrc || ""),
  };
}

export async function fetchCatalog(opts?: {
  q?: string;
  language?: string;
  relatedTo?: string;
}): Promise<Video[]> {
  const params = new URLSearchParams();
  if (opts?.q) params.set("q", opts.q);
  if (opts?.language) params.set("language", opts.language);
  if (opts?.relatedTo) params.set("relatedTo", opts.relatedTo);
  const qs = params.toString();
  try {
    const res = await fetch(`/api/videos${qs ? `?${qs}` : ""}`, { credentials: "include" });
    if (!res.ok) throw new Error("videos failed");
    const data = (await res.json()) as { videos?: Record<string, unknown>[] };
    const videos = (data.videos || []).map(normalizeVideo);
    if (!opts?.q && !opts?.language && !opts?.relatedTo) {
      catalogCache = videos;
    }
    return videos;
  } catch {
    if (opts?.relatedTo) {
      const seed = getVideoById(opts.relatedTo);
      return seed
        ? CATALOG.filter((v) => v.id !== seed.id && (v.language === seed.language || v.theme === seed.theme))
        : [];
    }
    let list = catalogCache || CATALOG;
    if (opts?.language) list = list.filter((v) => v.language === opts.language);
    if (opts?.q) {
      const q = opts.q.toLowerCase();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.titleLocal.toLowerCase().includes(q) ||
          v.language.toLowerCase().includes(q)
      );
    }
    return list;
  }
}

export function getVideoById(id: string): Video | undefined {
  return activeCatalog().find((v) => v.id === id);
}

function activeCatalog(): Video[] {
  return catalogCache && catalogCache.length > 0 ? catalogCache : CATALOG;
}

export async function fetchVideoById(id: string): Promise<Video | null> {
  try {
    const res = await fetch(`/api/videos/${id}`, { credentials: "include" });
    if (!res.ok) return getVideoById(id) || null;
    const data = (await res.json()) as { video?: Record<string, unknown> };
    return data.video ? normalizeVideo(data.video) : getVideoById(id) || null;
  } catch {
    return getVideoById(id) || null;
  }
}

export function videosByLanguage(language: Language, catalog: Video[] = activeCatalog()): Video[] {
  return catalog.filter((v) => v.language === language);
}

export function filterCatalog(
  filters: {
    language?: Language | null;
    theme?: Theme | null;
    ageRange?: AgeRange | null;
  },
  catalog: Video[] = activeCatalog()
): Video[] {
  const list = catalog.length > 0 ? catalog : CATALOG;
  return list.filter((v) => {
    if (filters.language && v.language !== filters.language) return false;
    if (filters.theme && v.theme !== filters.theme) return false;
    if (filters.ageRange && v.ageRange !== filters.ageRange) return false;
    return true;
  });
}
