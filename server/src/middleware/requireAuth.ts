import type { NextFunction, Request, Response } from "express";
import { getSessionCookieName, verifySession } from "../auth/session";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const rawToken = req.cookies?.[getSessionCookieName()];

  if (typeof rawToken !== "string" || !rawToken) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const payload = verifySession(rawToken);

  if (!payload?.userId) {
    res.status(401).json({ error: "Invalid or expired session." });
    return;
  }

  req.userId = payload.userId;
  next();
}
