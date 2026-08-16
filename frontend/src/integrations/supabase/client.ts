import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uuogkevymtifhlbadntv.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseAnonKey && typeof window !== "undefined") {
  console.warn(
    "[watchamoo] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Set it in frontend/.env.local"
  );
}

/**
 * Browser Supabase client (matches your working integrations/supabase/client pattern).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey || "missing-anon-key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function authRedirectTo() {
  if (typeof window === "undefined") return undefined;
  // After email confirmation, Supabase redirects here then we send users to Discover
  return `${window.location.origin}/auth/callback`;
}
