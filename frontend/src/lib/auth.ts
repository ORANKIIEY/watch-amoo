export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  verified: boolean;
  otp?: string;
  otpExpires?: number;
  resetToken?: string;
  resetExpires?: number;
  createdAt: string;
};

export type Session = {
  userId: string;
  email: string;
  name: string;
};

export type SupportTicket = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
};

export type DiscoveryLog = {
  id: string;
  query: string;
  language: string | null;
  theme: string | null;
  ageRange: string | null;
  matchCount: number;
  matchedIds: string[];
  createdAt: string;
  userEmail?: string;
};

const USERS_KEY = "watchamoo_users";
const SESSION_KEY = "watchamoo_session";
const SUPPORT_KEY = "watchamoo_support";
const LOGS_KEY = "watchamoo_discovery_logs";
const THEME_KEY = "watchamoo_theme";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function otpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function getUsers(): User[] {
  return read<User[]>(USERS_KEY, []);
}

export function getSession(): Session | null {
  return read<Session | null>(SESSION_KEY, null);
}

export function setSession(session: Session | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  write(SESSION_KEY, session);
}

export function signup(input: {
  name: string;
  email: string;
  password: string;
}): { ok: true; otp: string; user: User } | { ok: false; error: string } {
  const users = getUsers();
  const email = input.email.trim().toLowerCase();
  if (!input.name.trim() || !email || !input.password) {
    return { ok: false, error: "Please fill in all fields." };
  }
  if (input.password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  if (users.some((u) => u.email === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }
  const otp = otpCode();
  const user: User = {
    id: uid("user"),
    name: input.name.trim(),
    email,
    password: input.password,
    verified: false,
    otp,
    otpExpires: Date.now() + 15 * 60 * 1000,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  write(USERS_KEY, users);
  return { ok: true, otp, user };
}

export function login(input: {
  email: string;
  password: string;
}): { ok: true; needsVerification?: boolean; otp?: string } | { ok: false; error: string } {
  const users = getUsers();
  const email = input.email.trim().toLowerCase();
  const user = users.find((u) => u.email === email);
  if (!user || user.password !== input.password) {
    return { ok: false, error: "Invalid email or password." };
  }
  if (!user.verified) {
    const otp = otpCode();
    user.otp = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000;
    write(USERS_KEY, users);
    return { ok: true, needsVerification: true, otp };
  }
  setSession({ userId: user.id, email: user.email, name: user.name });
  return { ok: true };
}

export function verifyOtp(
  email: string,
  code: string
): { ok: true } | { ok: false; error: string } {
  const users = getUsers();
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  if (!user) return { ok: false, error: "Account not found." };
  if (!user.otp || !user.otpExpires || Date.now() > user.otpExpires) {
    return { ok: false, error: "OTP expired. Please request a new one." };
  }
  if (user.otp !== code.trim()) {
    return { ok: false, error: "Incorrect OTP. Try again." };
  }
  user.verified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  write(USERS_KEY, users);
  setSession({ userId: user.id, email: user.email, name: user.name });
  return { ok: true };
}

export function resendOtp(
  email: string
): { ok: true; otp: string } | { ok: false; error: string } {
  const users = getUsers();
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  if (!user) return { ok: false, error: "Account not found." };
  const otp = otpCode();
  user.otp = otp;
  user.otpExpires = Date.now() + 15 * 60 * 1000;
  write(USERS_KEY, users);
  return { ok: true, otp };
}

export function requestPasswordReset(
  email: string
): { ok: true; token: string } | { ok: false; error: string } {
  const users = getUsers();
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  if (!user) {
    // Don't leak whether email exists — still return success shape for UX,
    // but for demo we show when missing.
    return { ok: false, error: "No account found with that email." };
  }
  const token = otpCode();
  user.resetToken = token;
  user.resetExpires = Date.now() + 15 * 60 * 1000;
  write(USERS_KEY, users);
  return { ok: true, token };
}

export function resetPassword(input: {
  email: string;
  token: string;
  password: string;
}): { ok: true } | { ok: false; error: string } {
  const users = getUsers();
  const user = users.find((u) => u.email === input.email.trim().toLowerCase());
  if (!user) return { ok: false, error: "Account not found." };
  if (!user.resetToken || !user.resetExpires || Date.now() > user.resetExpires) {
    return { ok: false, error: "Reset code expired. Request a new one." };
  }
  if (user.resetToken !== input.token.trim()) {
    return { ok: false, error: "Invalid reset code." };
  }
  if (input.password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  user.password = input.password;
  user.resetToken = undefined;
  user.resetExpires = undefined;
  write(USERS_KEY, users);
  return { ok: true };
}

export function changePassword(input: {
  current: string;
  next: string;
}): { ok: true } | { ok: false; error: string } {
  const session = getSession();
  if (!session) return { ok: false, error: "Not signed in." };
  const users = getUsers();
  const user = users.find((u) => u.id === session.userId);
  if (!user) return { ok: false, error: "Account not found." };
  if (user.password !== input.current) {
    return { ok: false, error: "Current password is incorrect." };
  }
  if (input.next.length < 6) {
    return { ok: false, error: "New password must be at least 6 characters." };
  }
  user.password = input.next;
  write(USERS_KEY, users);
  return { ok: true };
}

export function logout() {
  setSession(null);
}

export function submitSupport(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): { ok: true } | { ok: false; error: string } {
  if (!input.name.trim() || !input.email.trim() || !input.subject.trim() || !input.message.trim()) {
    return { ok: false, error: "Please complete all fields." };
  }
  const tickets = read<SupportTicket[]>(SUPPORT_KEY, []);
  tickets.unshift({
    id: uid("ticket"),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    subject: input.subject.trim(),
    message: input.message.trim(),
    createdAt: new Date().toISOString(),
  });
  write(SUPPORT_KEY, tickets);
  return { ok: true };
}

export function logDiscovery(entry: Omit<DiscoveryLog, "id" | "createdAt">) {
  const logs = read<DiscoveryLog[]>(LOGS_KEY, []);
  logs.unshift({
    ...entry,
    id: uid("log"),
    createdAt: new Date().toISOString(),
  });
  write(LOGS_KEY, logs.slice(0, 200));
}

export function getDiscoveryLogs(): DiscoveryLog[] {
  return read<DiscoveryLog[]>(LOGS_KEY, []);
}

export function getThemePreference(): "light" | "dark" {
  return read<"light" | "dark">(THEME_KEY, "light");
}

export function setThemePreference(theme: "light" | "dark") {
  write(THEME_KEY, theme);
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}
