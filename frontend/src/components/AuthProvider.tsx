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
  getThemePreference,
  login as loginFn,
  logout as logoutFn,
  requestPasswordReset as requestResetFn,
  resendOtp as resendOtpFn,
  resetPassword as resetPasswordFn,
  Session,
  sessionFromUser,
  setThemePreference,
  signup as signupFn,
  verifyOtp as verifyOtpFn,
} from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const refreshSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSessionState(sessionFromUser(data.session?.user));
  }, []);

  useEffect(() => {
    const stored = getThemePreference();
    setTheme(stored);
    document.documentElement.classList.toggle("dark", stored === "dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    let mounted = true;

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSessionState(sessionFromUser(data.session?.user));
      })
      .catch((err) => {
        console.error("[watchamoo] getSession failed", err);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSessionState(sessionFromUser(next?.user));
      setReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      setThemePreference(next);
      document.documentElement.classList.toggle("dark", next === "dark");
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
      signup: async (input) => {
        const result = await signupFn(input);
        if (result.ok && result.loggedIn) await refreshSession();
        return result;
      },
      login: async (input) => {
        const result = await loginFn(input);
        if (result.ok && !result.needsVerification) await refreshSession();
        return result;
      },
      verifyOtp: verifyOtpFn,
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
