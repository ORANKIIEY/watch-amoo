"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Alert } from "@/components/ui";
import {
  hasActiveAccess,
  LANGUAGE_OPTIONS,
  loadProfile,
  saveLanguage,
  type LanguageId,
} from "@/lib/access";

export default function LanguagePage() {
  const router = useRouter();
  const { session, ready } = useAuth();
  const [selected, setSelected] = useState<LanguageId>("sepedi");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login?next=/language");
      return;
    }
    void loadProfile().then((profile) => {
      if (profile?.language) setSelected(profile.language);
    });
  }, [ready, session, router]);

  async function onContinue() {
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      const profile = await saveLanguage(selected);
      router.push(hasActiveAccess(profile) ? "/watch" : "/subscribe");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save language.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !session) return null;

  return (
    <main className="flex flex-col items-center px-6 py-10">
      <h1 className="text-center text-4xl font-black text-foreground md:text-5xl">
        Choose your language
      </h1>

      <div className="mt-10 w-full max-w-md rounded-3xl border border-border/40 bg-card p-8 shadow-lg">
        <p className="mb-6 text-center text-sm font-semibold text-foreground/70">
          Select the language you want to subscribe to
        </p>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="space-y-3">
          {LANGUAGE_OPTIONS.map((language) => {
            const active = selected === language.id;
            return (
              <button
                key={language.id}
                type="button"
                onClick={() => setSelected(language.id)}
                className={`w-full rounded-full border-2 py-5 text-xl font-bold transition ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:border-primary/60 hover:text-primary"
                }`}
              >
                {language.label}
              </button>
            );
          })}
        </div>
        <div className="mt-6 h-px bg-border" />
        <button
          type="button"
          onClick={() => void onContinue()}
          disabled={saving}
          className="mt-6 w-full rounded-full bg-primary py-4 text-lg font-bold text-primary-foreground shadow-md transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </div>
    </main>
  );
}
