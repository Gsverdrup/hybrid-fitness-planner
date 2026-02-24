import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import {
  createSavedPlan,
  getCurrentSavedPlan,
  getSavedPlanHistory,
  type PlanGoal,
  type PlanType,
} from "../repositories/planRepository";
import { FitnessProfileSchema } from "../validation/fitnessProfileSchema";

const router = Router();

const savePlanSchema = z.object({
  goal: z.enum(["5k", "10k", "half-marathon", "marathon"]),
  planType: z.enum(["race", "weekly"]).default("race"),
  profileSnapshot: FitnessProfileSchema,
  plan: z.unknown(),
});

const goalSchema = z.enum(["5k", "10k", "half-marathon", "marathon"]);

router.use(requireAuth);

router.post("/", async (req, res) => {
  const parsed = savePlanSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }

  const payload = parsed.data;

  try {
    const saved = await createSavedPlan({
      userId: req.userId as string,
      goal: payload.goal as PlanGoal,
      planType: payload.planType as PlanType,
      profileSnapshot: payload.profileSnapshot,
      planJson: payload.plan,
    });

    return res.status(201).json({ plan: saved });
  } catch (error) {
    return res.status(500).json({ error: "Unable to save plan.", details: (error as Error).message });
  }
});

router.get("/current", async (req, res) => {
  const rawGoal = req.query.goal;
  const parsedGoal = typeof rawGoal === "string" && rawGoal.length > 0 ? goalSchema.safeParse(rawGoal) : null;

  if (parsedGoal && !parsedGoal.success) {
    return res.status(400).json({ error: "Invalid goal query parameter." });
  }

  try {
    const plan = await getCurrentSavedPlan(req.userId as string, parsedGoal?.success ? parsedGoal.data : undefined);

    if (!plan) {
      return res.status(404).json({ error: "No saved plan found." });
    }

    return res.json({ plan });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch current plan.", details: (error as Error).message });
  }
});

router.get("/history", async (req, res) => {
  const rawGoal = req.query.goal;
  const rawLimit = req.query.limit;

  const parsedGoal = typeof rawGoal === "string" && rawGoal.length > 0 ? goalSchema.safeParse(rawGoal) : null;

  if (parsedGoal && !parsedGoal.success) {
    return res.status(400).json({ error: "Invalid goal query parameter." });
  }

  const limit =
    typeof rawLimit === "string" && rawLimit.length > 0 && !Number.isNaN(Number(rawLimit))
      ? Number(rawLimit)
      : undefined;

  try {
    const plans = await getSavedPlanHistory({
      userId: req.userId as string,
      goal: parsedGoal?.success ? parsedGoal.data : undefined,
      limit,
    });

    return res.json({ plans });
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch plan history.", details: (error as Error).message });
  }
});

export default router;
