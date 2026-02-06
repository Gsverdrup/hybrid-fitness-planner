import { Router } from "express";
import { generateWeeklyPlan } from "../services/planGenerator";
import { FitnessProfileSchema } from "../domain/fitnessProfileSchema";

const router = Router();

router.post("/", (req, res) => {
  const parsed = FitnessProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json(parsed.error.format());
  }

  const plan = generateWeeklyPlan(parsed.data);
  res.json(plan);
});

export default router;
