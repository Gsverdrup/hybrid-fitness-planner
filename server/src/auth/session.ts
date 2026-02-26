import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

const SESSION_COOKIE = "hf_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionPayload = {
  userId: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required.");
  }
  return secret;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: SESSION_TTL_SECONDS });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export function extractSessionToken(req: Request): string | null {
  const cookieToken = req.cookies?.[getSessionCookieName()];
  if (typeof cookieToken === "string" && cookieToken.trim()) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader !== "string") {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  const trimmedToken = token.trim();
  return trimmedToken.length > 0 ? trimmedToken : null;
}
