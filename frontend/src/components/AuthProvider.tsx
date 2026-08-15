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
  getSession,
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
  logout: () => void;
  refreshSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const refreshSession = useCallback(() => {
    setSessionState(getSession());
  }, []);

  useEffect(() => {
    const preferred = getThemePreference();
    setTheme(preferred);
    document.documentElement.classList.toggle("dark", preferred === "dark");
    refreshSession();
    setReady(true);
  }, [refreshSession]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      setThemePreference(next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    logoutFn();
    setSessionState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      ready,
      theme,
      toggleTheme,
      signup: (input) => {
        const result = signupFn(input);
        return result;
      },
      login: (input) => {
        const result = loginFn(input);
        if (result.ok && !result.needsVerification) refreshSession();
        return result;
      },
      verifyOtp: (email, code) => {
        const result = verifyOtpFn(email, code);
        if (result.ok) refreshSession();
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
