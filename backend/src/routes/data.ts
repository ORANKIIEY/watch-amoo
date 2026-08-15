import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AuthedRequest, optionalAuth, requireAuth } from "../lib/session.js";

export const videosRouter = Router();
export const supportRouter = Router();
export const discoveryRouter = Router();

videosRouter.get("/", async (_req, res) => {
  const videos = await prisma.video.findMany({ orderBy: { language: "asc" } });
  return res.json({ ok: true, videos });
});

videosRouter.get("/:id", async (req, res) => {
  const video = await prisma.video.findUnique({ where: { id: req.params.id } });
  if (!video) return res.status(404).json({ ok: false, error: "Video not found." });
  return res.json({ ok: true, video });
});

supportRouter.post("/", optionalAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email(),
    subject: z.string().trim().min(1).max(200),
    message: z.string().trim().min(1).max(5000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Please complete all fields." });
  }

  await prisma.supportTicket.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      subject: parsed.data.subject,
      message: parsed.data.message,
      userId: req.user?.id,
    },
  });

  return res.json({ ok: true, message: "Thanks — your message was received." });
});

discoveryRouter.post("/log", optionalAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    query: z.string().trim().min(1).max(500),
    language: z.string().nullable().optional(),
    theme: z.string().nullable().optional(),
    ageRange: z.string().nullable().optional(),
    matchCount: z.number().int().min(0),
    matchedIds: z.array(z.string()).max(50),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid discovery log." });
  }

  await prisma.discoveryLog.create({
    data: {
      query: parsed.data.query,
      language: parsed.data.language ?? null,
      theme: parsed.data.theme ?? null,
      ageRange: parsed.data.ageRange ?? null,
      matchCount: parsed.data.matchCount,
      matchedIds: JSON.stringify(parsed.data.matchedIds),
      userId: req.user?.id,
    },
  });

  return res.json({ ok: true });
});

discoveryRouter.get("/insights", requireAuth, async (req: AuthedRequest, res) => {
  const logs = await prisma.discoveryLog.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const total = logs.length;
  const matched = logs.filter((l) => l.matchCount > 0).length;
  return res.json({
    ok: true,
    total,
    matchedPct: total ? Math.round((matched / total) * 100) : 0,
  });
});
