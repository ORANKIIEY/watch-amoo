/**
 * Auth via Supabase (working flow). Catalog/library still talk to Express /api.
 */

import { authRedirectTo, supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  verified?: boolean;
};

export type Session = {
  userId: string;
  email: string;
  name: string;
};

function displayName(user: User): string {
  const meta = user.user_metadata || {};
  return (
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    user.email?.split("@")[0] ||
    "Caregiver"
  );
}

export function sessionFromUser(user: User | null | undefined): Session | null {
  if (!user?.email) return null;
  return {
    userId: user.id,
    email: user.email,
    name: displayName(user),
  };
}

async function api<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  try {
    const res = await fetch(path, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    const data = (await res.json().catch(() => ({}))) as T & { ok?: boolean; error?: string };
    if (!res.ok || data.ok === false) {
      return {
        ok: false,
        error: data.error || `Request failed (${res.status})`,
        status: res.status,
      };
    }
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Is the backend running?",
    };
  }
}

export async function signup(input: {
  name: string;
  email: string;
  password: string;
}): Promise<
  | { ok: true; email: string; loggedIn?: boolean; needsVerification?: boolean; user?: ApiUser }
  | { ok: false; error: string }
> {
  const email = input.email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: authRedirectTo(),
      data: { name: input.name.trim() },
    },
  });

  if (error) return { ok: false, error: error.message };

  const user = data.user;
  // With email confirmation on, session is null until the link is clicked
  if (!data.session) {
    return {
      ok: true,
      email,
      needsVerification: true,
      user: user
        ? { id: user.id, name: displayName(user), email: user.email || email, verified: false }
        : undefined,
    };
  }

  return {
    ok: true,
    email,
    loggedIn: true,
    user: user
      ? { id: user.id, name: displayName(user), email: user.email || email, verified: true }
      : undefined,
  };
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<
  | {
      ok: true;
      needsVerification?: boolean;
      email?: string;
      user?: ApiUser;
    }
  | { ok: false; error: string }
> {
  const email = input.email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("email not confirmed") || msg.includes("confirm")) {
      return { ok: true, needsVerification: true, email };
    }
    return { ok: false, error: error.message };
  }

  const user = data.user;
  return {
    ok: true,
    user: user
      ? {
          id: user.id,
          name: displayName(user),
          email: user.email || email,
          verified: true,
        }
      : undefined,
  };
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) console.error(error.message);
}

export async function fetchMe(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return sessionFromUser(data.user);
}

/** Supabase uses email link confirmation — no OTP code to submit. */
export async function verifyOtp(
  _email: string,
  _code: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  return {
    ok: false,
    error: "Open the confirmation link we sent to your email to finish signing up.",
  };
}

export async function resendOtp(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: authRedirectTo() },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function requestPasswordReset(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function resetPassword(input: {
  email: string;
  token: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  // After clicking the reset email link, Supabase already has a recovery session.
  // `token` is unused — password update uses the active recovery session.
  void input.email;
  void input.token;
  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function changePassword(input: {
  current: string;
  next: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) return { ok: false, error: "Not signed in." };

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email,
    password: input.current,
  });
  if (reauthError) return { ok: false, error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: input.next });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function submitSupport(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await api("/api/support", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!result.ok) return result;
  return { ok: true };
}

export async function logDiscovery(entry: {
  query: string;
  language: string | null;
  theme: string | null;
  ageRange: string | null;
  matchCount: number;
  matchedIds: string[];
}): Promise<void> {
  await api("/api/discovery/log", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export async function fetchDiscoveryInsights(): Promise<{
  total: number;
  matchedPct: number;
  unmatchedDemand?: number;
}> {
  const result = await api<{ total: number; matchedPct: number; unmatchedDemand?: number }>(
    "/api/discovery/insights"
  );
  if (!result.ok) return { total: 0, matchedPct: 0 };
  return {
    total: result.data.total,
    matchedPct: result.data.matchedPct,
    unmatchedDemand: result.data.unmatchedDemand,
  };
}

export async function toggleFavorite(videoId: string, on: boolean) {
  return api(`/api/library/favorites/${videoId}`, { method: on ? "POST" : "DELETE" });
}

export async function fetchFavorites(): Promise<string[]> {
  const result = await api<{ videoIds: string[] }>("/api/library/favorites");
  if (!result.ok) return [];
  return result.data.videoIds;
}

export async function fetchContinueWatching(): Promise<
  { videoId: string; progressSeconds: number; durationSeconds: number | null }[]
> {
  const result = await api<{
    continueWatching: {
      videoId: string;
      progressSeconds: number;
      durationSeconds: number | null;
    }[];
  }>("/api/library/continue");
  if (!result.ok) return [];
  return result.data.continueWatching;
}

export async function reportWatchProgress(input: {
  videoId: string;
  progressSeconds: number;
  durationSeconds?: number;
  completed?: boolean;
}) {
  return api("/api/library/history", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchParental(): Promise<{ hasPin: boolean; kidsMode: boolean }> {
  const result = await api<{ hasPin: boolean; kidsMode: boolean }>("/api/parental");
  if (!result.ok) return { hasPin: false, kidsMode: false };
  return { hasPin: result.data.hasPin, kidsMode: result.data.kidsMode };
}

export async function setParentalPin(pin: string, currentPin?: string) {
  return api("/api/parental/set-pin", {
    method: "POST",
    body: JSON.stringify({ pin, currentPin }),
  });
}

export async function setKidsMode(enabled: boolean, pin?: string) {
  return api("/api/parental/kids-mode", {
    method: "POST",
    body: JSON.stringify({ enabled, pin }),
  });
}

/** Theme preference stays local (non-secret). */
const THEME_KEY = "watchamoo_theme";

export function getThemePreference(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return raw === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function setThemePreference(theme: "light" | "dark") {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
}
