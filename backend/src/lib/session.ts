import type { Request, Response, NextFunction } from "express";
import { prisma } from "./prisma.js";

export type AuthedRequest = Request & {
  user?: { id: string; email: string; name: string; verified: boolean };
};

const COOKIE_NAME = "watchamoo_session";

export function sessionCookieName() {
  return COOKIE_NAME;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) {
    return res.status(401).json({ ok: false, error: "Not signed in." });
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    res.clearCookie(COOKIE_NAME);
    return res.status(401).json({ ok: false, error: "Session expired. Please sign in again." });
  }

  req.user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    verified: session.user.verified,
  };
  return next();
}

export async function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) return next();

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (session && session.expiresAt >= new Date()) {
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      verified: session.user.verified,
    };
  }
  return next();
}
