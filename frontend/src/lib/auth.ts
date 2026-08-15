/**
 * Browser API client — talks to Express via same-origin Next rewrites (/api → :4000).
 * Session is an HttpOnly cookie; never store passwords/OTPs in localStorage.
 */

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
}): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const result = await api<{ email: string }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!result.ok) return result;
  return { ok: true, email: result.data.email };
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<
  | { ok: true; needsVerification?: boolean; email?: string; user?: ApiUser }
  | { ok: false; error: string }
> {
  const result = await api<{
    needsVerification?: boolean;
    email?: string;
    user?: ApiUser;
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!result.ok) return result;
  return {
    ok: true,
    needsVerification: result.data.needsVerification,
    email: result.data.email,
    user: result.data.user,
  };
}

export async function logout(): Promise<void> {
  await api("/api/auth/logout", { method: "POST" });
}

export async function fetchMe(): Promise<Session | null> {
  const result = await api<{ user: ApiUser | null }>("/api/auth/me");
  if (!result.ok || !result.data.user) return null;
  const u = result.data.user;
  return { userId: u.id, email: u.email, name: u.name };
}

export async function verifyOtp(
  email: string,
  code: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await api("/api/auth/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
  if (!result.ok) return result;
  return { ok: true };
}

export async function resendOtp(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await api("/api/auth/resend-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!result.ok) return result;
  return { ok: true };
}

export async function requestPasswordReset(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await api("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!result.ok) return result;
  return { ok: true };
}

export async function resetPassword(input: {
  email: string;
  token: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await api("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      code: input.token,
      password: input.password,
    }),
  });
  if (!result.ok) return result;
  return { ok: true };
}

export async function changePassword(input: {
  current: string;
  next: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await api("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!result.ok) return result;
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
}> {
  const result = await api<{ total: number; matchedPct: number }>("/api/discovery/insights");
  if (!result.ok) return { total: 0, matchedPct: 0 };
  return { total: result.data.total, matchedPct: result.data.matchedPct };
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
