import { Router } from "express";
import { sendAuthCodeEmail, EmailCodeType } from "../lib/email.js";

export const authRouter = Router();

authRouter.post("/send-code", async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const code = String(req.body?.code || "").trim();
    const type: EmailCodeType = req.body?.type === "reset" ? "reset" : "verification";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: "Valid email is required." });
    }
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ ok: false, error: "Invalid code." });
    }

    await sendAuthCodeEmail({ to: email, code, type });
    return res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email.";
    return res.status(500).json({ ok: false, error: message });
  }
});
