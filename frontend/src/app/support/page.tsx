"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AuthCard } from "@/components/ui";
import { submitSupport } from "@/lib/auth";

export default function SupportPage() {
  const { session } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    const result = submitSupport({
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      subject: String(fd.get("subject") || ""),
      message: String(fd.get("message") || ""),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    e.currentTarget.reset();
  }

  return (
    <AuthCard
      title="Support & contact"
      subtitle="Questions about the pilot, content, or your account? Send us a note."
    >
      {error && <Alert tone="error">{error}</Alert>}
      {success && (
        <Alert tone="success">
          Thanks — your message was saved. Our team will follow up (demo stores tickets locally).
        </Alert>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            className="field"
            required
            defaultValue={session?.name || ""}
          />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="field"
            required
            defaultValue={session?.email || ""}
          />
        </div>
        <div>
          <label className="label" htmlFor="subject">
            Subject
          </label>
          <input id="subject" name="subject" className="field" required />
        </div>
        <div>
          <label className="label" htmlFor="message">
            Message
          </label>
          <textarea id="message" name="message" className="field min-h-32 resize-y" required />
        </div>
        <button type="submit" className="btn btn-primary w-full">
          Send message
        </button>
      </form>
    </AuthCard>
  );
}
