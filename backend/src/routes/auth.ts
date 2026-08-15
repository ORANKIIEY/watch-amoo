import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { sendAuthCodeEmail } from "../lib/email.js";
import { prisma } from "../lib/prisma.js";
import {
  generateOtpCode,
  generateSessionToken,
  hashOtp,
  hashPassword,
  LOCK_MS,
  MAX_FAILED_LOGINS,
  OTP_TTL_MS,
  SESSION_TTL_MS,
  validatePassword,
  verifyOtp,
  verifyPassword,
} from "../lib/security.js";
import {
  AuthedRequest,
  optionalAuth,
  requireAuth,
  sessionCookieName,
} from "../lib/session.js";

export const authRouter = Router();

const sendCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many code requests. Try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many attempts. Try again later." },
});

function setSessionCookie(res: import("express").Response, token: string, expiresAt: Date) {
  res.cookie(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

async function createSession(userId: string) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({
    data: { userId, token, expiresAt },
  });
  return { token, expiresAt };
}

async function issueOtp(userId: string, type: "verification" | "reset") {
  await prisma.otpCode.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });
  const code = generateOtpCode();
  const codeHash = await hashOtp(code);
  await prisma.otpCode.create({
    data: {
      userId,
      codeHash,
      type,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  return code;
}

const signupSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

authRouter.post("/signup", authLimiter, async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Please fill in a valid name, email, and password." });
  }

  const passwordError = validatePassword(parsed.data.password);
  if (passwordError) return res.status(400).json({ ok: false, error: passwordError });

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ ok: false, error: "An account with this email already exists." });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      verified: false,
    },
  });

  try {
    const code = await issueOtp(user.id, "verification");
    await sendAuthCodeEmail({ to: email, code, type: "verification" });
  } catch (err) {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
    const message = err instanceof Error ? err.message : "Could not send verification email.";
    return res.status(500).json({ ok: false, error: message });
  }

  return res.json({
    ok: true,
    email,
    message: "Account created. Check your email for a verification code.",
  });
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid email or password." });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ ok: false, error: "Invalid email or password." });
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(423).json({
      ok: false,
      error: "Account temporarily locked after too many failed attempts. Try again later.",
    });
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    const failedLogins = user.failedLogins + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins,
        lockedUntil: failedLogins >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_MS) : null,
      },
    });
    return res.status(401).json({ ok: false, error: "Invalid email or password." });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null },
  });

  if (!user.verified) {
    try {
      const code = await issueOtp(user.id, "verification");
      await sendAuthCodeEmail({ to: email, code, type: "verification" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send verification email.";
      return res.status(500).json({ ok: false, error: message });
    }
    return res.json({
      ok: true,
      needsVerification: true,
      email,
      message: "Please verify your email. We sent a new code.",
    });
  }

  const { token, expiresAt } = await createSession(user.id);
  setSessionCookie(res, token, expiresAt);
  return res.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

authRouter.post("/logout", async (req, res) => {
  const token = req.cookies?.[sessionCookieName()] as string | undefined;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  res.clearCookie(sessionCookieName(), { path: "/" });
  return res.json({ ok: true });
});

authRouter.get("/me", optionalAuth, async (req: AuthedRequest, res) => {
  if (!req.user) return res.json({ ok: true, user: null });
  return res.json({
    ok: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      verified: req.user.verified,
    },
  });
});

const verifySchema = z.object({
  email: z.string().trim().email(),
  code: z.string().regex(/^\d{6}$/),
});

authRouter.post("/verify", authLimiter, async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Enter a valid email and 6-digit code." });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ ok: false, error: "Invalid verification code." });

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      type: "verification",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || !(await verifyOtp(parsed.data.code, otp.codeHash))) {
    return res.status(400).json({ ok: false, error: "Invalid or expired verification code." });
  }

  await prisma.$transaction([
    prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: user.id }, data: { verified: true } }),
  ]);

  const { token, expiresAt } = await createSession(user.id);
  setSessionCookie(res, token, expiresAt);
  return res.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

authRouter.post("/resend-code", sendCodeLimiter, async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  if (!email) return res.status(400).json({ ok: false, error: "Email is required." });

  const user = await prisma.user.findUnique({ where: { email } });
  // Do not leak account existence for resend either when possible —
  // but for verify flow the user already knows they signed up.
  if (!user || user.verified) {
    return res.json({ ok: true, message: "If that account needs verification, a code was sent." });
  }

  try {
    const code = await issueOtp(user.id, "verification");
    await sendAuthCodeEmail({ to: email, code, type: "verification" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send email.";
    return res.status(500).json({ ok: false, error: message });
  }

  return res.json({ ok: true, message: "A new verification code was sent." });
});

authRouter.post("/forgot-password", sendCodeLimiter, async (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  // Always same response — no email-existence leak
  const generic = {
    ok: true,
    message: "If an account exists for that email, a reset code was sent.",
  };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.json(generic);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json(generic);

  try {
    const code = await issueOtp(user.id, "reset");
    await sendAuthCodeEmail({ to: email, code, type: "reset" });
  } catch {
    // Still generic — don't reveal email delivery details to attackers
    return res.json(generic);
  }

  return res.json(generic);
});

const resetSchema = z.object({
  email: z.string().trim().email(),
  code: z.string().regex(/^\d{6}$/),
  password: z.string().min(8).max(128),
});

authRouter.post("/reset-password", authLimiter, async (req, res) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Enter email, 6-digit code, and a new password." });
  }

  const passwordError = validatePassword(parsed.data.password);
  if (passwordError) return res.status(400).json({ ok: false, error: passwordError });

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ ok: false, error: "Invalid or expired reset code." });

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      type: "reset",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || !(await verifyOtp(parsed.data.code, otp.codeHash))) {
    return res.status(400).json({ ok: false, error: "Invalid or expired reset code." });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, failedLogins: 0, lockedUntil: null, verified: true },
    }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);

  return res.json({ ok: true, message: "Password updated. You can sign in now." });
});

const changePasswordSchema = z.object({
  current: z.string().min(1),
  next: z.string().min(8).max(128),
});

authRouter.post("/change-password", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Enter your current and new password." });
  }
  const passwordError = validatePassword(parsed.data.next);
  if (passwordError) return res.status(400).json({ ok: false, error: passwordError });

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(401).json({ ok: false, error: "Not signed in." });

  const ok = await verifyPassword(parsed.data.current, user.passwordHash);
  if (!ok) return res.status(400).json({ ok: false, error: "Current password is incorrect." });

  const passwordHash = await hashPassword(parsed.data.next);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return res.json({ ok: true, message: "Password updated." });
});

/** Deprecated client-supplied code path — reject explicitly. */
authRouter.post("/send-code", sendCodeLimiter, async (_req, res) => {
  return res.status(410).json({
    ok: false,
    error: "Client-supplied codes are no longer accepted. Use /signup, /login, /resend-code, or /forgot-password.",
  });
});
