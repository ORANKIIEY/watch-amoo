import { Router } from "express";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../lib/security.js";
import { prisma } from "../lib/prisma.js";
import { AuthedRequest, requireAuth } from "../lib/session.js";

export const libraryRouter = Router();
export const parentalRouter = Router();

libraryRouter.get("/favorites", requireAuth, async (req: AuthedRequest, res) => {
  const rows = await prisma.favorite.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ ok: true, videoIds: rows.map((r) => r.videoId) });
});

libraryRouter.post("/favorites/:videoId", requireAuth, async (req: AuthedRequest, res) => {
  const videoId = String(req.params.videoId);
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return res.status(404).json({ ok: false, error: "Video not found." });

  await prisma.favorite.upsert({
    where: { userId_videoId: { userId: req.user!.id, videoId } },
    create: { userId: req.user!.id, videoId },
    update: {},
  });
  return res.json({ ok: true });
});

libraryRouter.delete("/favorites/:videoId", requireAuth, async (req: AuthedRequest, res) => {
  await prisma.favorite.deleteMany({
    where: { userId: req.user!.id, videoId: String(req.params.videoId) },
  });
  return res.json({ ok: true });
});

libraryRouter.get("/history", requireAuth, async (req: AuthedRequest, res) => {
  const rows = await prisma.watchHistory.findMany({
    where: { userId: req.user!.id },
    orderBy: { lastWatchedAt: "desc" },
    take: 50,
  });
  return res.json({ ok: true, history: rows });
});

libraryRouter.get("/continue", requireAuth, async (req: AuthedRequest, res) => {
  const rows = await prisma.watchHistory.findMany({
    where: {
      userId: req.user!.id,
      completed: false,
      progressSeconds: { gt: 5 },
    },
    orderBy: { lastWatchedAt: "desc" },
    take: 12,
  });
  return res.json({ ok: true, continueWatching: rows });
});

libraryRouter.post("/history", requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    videoId: z.string().min(1),
    progressSeconds: z.number().int().min(0),
    durationSeconds: z.number().int().positive().optional(),
    completed: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid watch progress." });
  }

  const video = await prisma.video.findUnique({ where: { id: parsed.data.videoId } });
  if (!video) return res.status(404).json({ ok: false, error: "Video not found." });

  const completed =
    parsed.data.completed ??
    (parsed.data.durationSeconds
      ? parsed.data.progressSeconds >= parsed.data.durationSeconds * 0.9
      : false);

  const row = await prisma.watchHistory.upsert({
    where: {
      userId_videoId: { userId: req.user!.id, videoId: parsed.data.videoId },
    },
    create: {
      userId: req.user!.id,
      videoId: parsed.data.videoId,
      progressSeconds: parsed.data.progressSeconds,
      durationSeconds: parsed.data.durationSeconds,
      completed,
      lastWatchedAt: new Date(),
    },
    update: {
      progressSeconds: parsed.data.progressSeconds,
      durationSeconds: parsed.data.durationSeconds ?? undefined,
      completed,
      lastWatchedAt: new Date(),
    },
  });

  return res.json({ ok: true, history: row });
});

parentalRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const pin = await prisma.parentalPin.findUnique({ where: { userId: req.user!.id } });
  return res.json({
    ok: true,
    hasPin: Boolean(pin),
    kidsMode: pin?.kidsMode ?? false,
  });
});

parentalRouter.post("/set-pin", requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    pin: z.string().regex(/^\d{4}$/),
    currentPin: z.string().regex(/^\d{4}$/).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "PIN must be exactly 4 digits." });
  }

  const existing = await prisma.parentalPin.findUnique({ where: { userId: req.user!.id } });
  if (existing) {
    if (!parsed.data.currentPin) {
      return res.status(400).json({ ok: false, error: "Current PIN is required to change it." });
    }
    const ok = await verifyPassword(parsed.data.currentPin, existing.pinHash);
    if (!ok) return res.status(400).json({ ok: false, error: "Current PIN is incorrect." });
  }

  const pinHash = await hashPassword(parsed.data.pin);
  await prisma.parentalPin.upsert({
    where: { userId: req.user!.id },
    create: { userId: req.user!.id, pinHash, kidsMode: false },
    update: { pinHash },
  });
  return res.json({ ok: true });
});

parentalRouter.post("/kids-mode", requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    enabled: z.boolean(),
    pin: z.string().regex(/^\d{4}$/).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid kids mode request." });
  }

  const existing = await prisma.parentalPin.findUnique({ where: { userId: req.user!.id } });
  if (!existing) {
    return res.status(400).json({ ok: false, error: "Set a parental PIN first." });
  }

  // Turning kids mode OFF requires PIN; turning ON does not.
  if (!parsed.data.enabled) {
    if (!parsed.data.pin || !(await verifyPassword(parsed.data.pin, existing.pinHash))) {
      return res.status(400).json({ ok: false, error: "Enter your PIN to exit Kids Mode." });
    }
  }

  await prisma.parentalPin.update({
    where: { userId: req.user!.id },
    data: { kidsMode: parsed.data.enabled },
  });
  return res.json({ ok: true, kidsMode: parsed.data.enabled });
});
