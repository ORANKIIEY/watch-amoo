"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  changePassword as changePasswordFn,
  fetchMe,
  getThemePreference,
  login as loginFn,
  logout as logoutFn,
  requestPasswordReset as requestResetFn,
  resendOtp as resendOtpFn,
  resetPassword as resetPasswordFn,
  Session,
  setThemePreference,
  signup as signupFn,
  verifyOtp as verifyOtpFn,
} from "@/lib/auth";

type AuthContextValue = {
  session: Session | null;
  ready: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  signup: typeof signupFn;
  login: typeof loginFn;
  verifyOtp: typeof verifyOtpFn;
  resendOtp: typeof resendOtpFn;
  requestPasswordReset: typeof requestResetFn;
  resetPassword: typeof resetPasswordFn;
  changePassword: typeof changePasswordFn;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof window === "undefined" ? "light" : getThemePreference()
  );

  const refreshSession = useCallback(async () => {
    const me = await fetchMe();
    setSessionState(me);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    refreshSession().finally(() => setReady(true));
  }, [refreshSession]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      setThemePreference(next);
      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    await logoutFn();
    setSessionState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      ready,
      theme,
      toggleTheme,
      signup: signupFn,
      login: async (input) => {
        const result = await loginFn(input);
        if (result.ok && !result.needsVerification) await refreshSession();
        return result;
      },
      verifyOtp: async (email, code) => {
        const result = await verifyOtpFn(email, code);
        if (result.ok) await refreshSession();
        return result;
      },
      resendOtp: resendOtpFn,
      requestPasswordReset: requestResetFn,
      resetPassword: resetPasswordFn,
      changePassword: changePasswordFn,
      logout,
      refreshSession,
    }),
    [session, ready, theme, toggleTheme, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
