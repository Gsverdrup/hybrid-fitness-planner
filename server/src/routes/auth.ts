import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { clearSessionCookie, setSessionCookie, signSession } from "../auth/session";
import { requireAuth } from "../middleware/requireAuth";
import { createUser, findUserByEmail, findUserById } from "../repositories/userRepository";

const router = Router();

const signupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ name, email, passwordHash });
    const token = signSession({ userId: user.id });
    setSessionCookie(res, token);

    return res.status(201).json({ user });
  } catch (error) {
    return res.status(500).json({ error: "Unable to create account.", details: (error as Error).message });
  }
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }

  const { email, password } = parsed.data;

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signSession({ userId: user.id });
    setSessionCookie(res, token);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Unable to sign in.", details: (error as Error).message });
  }
});

router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.status(204).send();
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await findUserById(req.userId as string);

    if (!user) {
      clearSessionCookie(res);
      return res.status(401).json({ error: "Session is no longer valid." });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: "Unable to load user.", details: (error as Error).message });
  }
});

export default router;
