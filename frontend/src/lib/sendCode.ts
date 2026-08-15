export type SendCodeType = "verification" | "reset";

export async function sendCodeToEmail(input: {
  email: string;
  code: string;
  type: SendCodeType;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || "Could not send email. Please try again." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not send email. Please try again." };
  }
}
