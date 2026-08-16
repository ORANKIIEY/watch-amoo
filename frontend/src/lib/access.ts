/**
 * Language + trial access. Prefers a Supabase `profiles` row, then auth
 * metadata, then a local cache so the onboarding flow works without extra tables.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Language } from "./catalog";

export const LANGUAGE_OPTIONS = [
  { id: "sepedi", label: "Sepedi" },
  { id: "sesotho", label: "Sesotho" },
  { id: "setswana", label: "Setswana" },
] as const;

export type LanguageId = (typeof LANGUAGE_OPTIONS)[number]["id"];
export type SubscriptionStatus = "none" | "trialing" | "active" | "expired" | "canceled";

export type Profile = {
  id: string;
  language: LanguageId | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
};

const CACHE_KEY = "watchamoo_access_profile";
const TRIAL_DAYS = 7;

export function isLanguageId(value: string | null | undefined): value is LanguageId {
  return value === "sepedi" || value === "sesotho" || value === "setswana";
}

export function toCatalogLanguage(id: string | null | undefined): Language | null {
  if (id === "sepedi" || id === "Sepedi") return "Sepedi";
  if (id === "sesotho" || id === "Sesotho") return "Sesotho";
  if (id === "setswana" || id === "Setswana") return "Setswana";
  return null;
}

export function hasActiveAccess(profile: Profile, now = Date.now()): boolean {
  if (profile.subscription_status === "active") return true;
  if (profile.subscription_status === "trialing" && profile.trial_ends_at) {
    return new Date(profile.trial_ends_at).getTime() > now;
  }
  return false;
}

function emptyProfile(id: string): Profile {
  return { id, language: null, subscription_status: "none", trial_ends_at: null };
}

function normalizeStatus(value: unknown): SubscriptionStatus {
  if (
    value === "none" ||
    value === "trialing" ||
    value === "active" ||
    value === "expired" ||
    value === "canceled"
  ) {
    return value;
  }
  return "none";
}

function normalizeLanguage(value: unknown): LanguageId | null {
  if (typeof value !== "string") return null;
  const lower = value.toLowerCase();
  return isLanguageId(lower) ? lower : null;
}

function fromRecord(id: string, raw: Record<string, unknown> | null | undefined): Profile {
  const base = emptyProfile(id);
  if (!raw) return base;
  return {
    id,
    language: normalizeLanguage(raw.language),
    subscription_status: normalizeStatus(raw.subscription_status),
    trial_ends_at: typeof raw.trial_ends_at === "string" ? raw.trial_ends_at : null,
  };
}

function readCache(userId: string): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Profile;
    return parsed.id === userId ? fromRecord(userId, parsed) : null;
  } catch {
    return null;
  }
}

function writeCache(profile: Profile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CACHE_KEY, JSON.stringify(profile));
}

function mergeProfile(id: string, ...layers: Array<Record<string, unknown> | null | undefined>): Profile {
  const merged: Record<string, unknown> = {};
  for (const layer of layers) {
    if (!layer) continue;
    if (layer.language) merged.language = layer.language;
    if (layer.subscription_status) merged.subscription_status = layer.subscription_status;
    if (layer.trial_ends_at) merged.trial_ends_at = layer.trial_ends_at;
  }
  return fromRecord(id, merged);
}

export async function loadProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const userId = data.user.id;
  const cached = readCache(userId);
  const meta = (data.user.user_metadata || {}) as Record<string, unknown>;

  const { data: row } = await supabase
    .from("profiles")
    .select("id, language, subscription_status, trial_ends_at")
    .eq("id", userId)
    .maybeSingle();

  const profile = mergeProfile(
    userId,
    cached,
    meta,
    (row as Record<string, unknown> | null) || null
  );
  writeCache(profile);
  return profile;
}

async function persistProfile(userId: string, patch: Partial<Profile>): Promise<Profile> {
  const current = (await loadProfile()) || emptyProfile(userId);
  const next: Profile = {
    ...current,
    ...patch,
    id: userId,
  };

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      language: next.language,
      subscription_status: next.subscription_status,
      trial_ends_at: next.trial_ends_at,
    });

  if (error) {
    // Table may not exist yet — keep going via metadata + cache.
    console.warn("[watchamoo] profiles upsert skipped:", error.message);
  }

  const { data: userData } = await supabase.auth.getUser();
  const meta = (userData.user?.user_metadata || {}) as Record<string, unknown>;
  const { error: metaError } = await supabase.auth.updateUser({
    data: {
      ...meta,
      language: next.language,
      subscription_status: next.subscription_status,
      trial_ends_at: next.trial_ends_at,
    },
  });
  if (metaError) throw new Error(metaError.message);

  writeCache(next);
  return next;
}

export async function saveLanguage(language: LanguageId): Promise<Profile> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sign in to choose a language.");
  return persistProfile(data.user.id, { language });
}

export async function startFreeTrial(): Promise<Profile> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sign in to start a trial.");

  const existing = await loadProfile();
  if (existing && hasActiveAccess(existing)) return existing;

  const ends = new Date();
  ends.setDate(ends.getDate() + TRIAL_DAYS);
  return persistProfile(data.user.id, {
    subscription_status: "trialing",
    trial_ends_at: ends.toISOString(),
  });
}
