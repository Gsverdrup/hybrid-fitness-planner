import { Router, Request, Response } from "express";
import { generateMarathonPlan, generateHalfMarathonPlan, generate10kPlan, generate5kPlan } from "../services/racePlanGenerator";
import { FitnessProfile } from "../domain/fitnessProfile";
import { FitnessProfileSchema } from "../domain/fitnessProfileSchema";

const router = Router();

function handlePlan(
  generator: (profile: FitnessProfile) => unknown
) {
  return (req: Request, res: Response) => {
    const parsed = FitnessProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error.format());
    }

    try {
      const plan = generator(parsed.data);
      res.json(plan);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };
}

router.post("/marathon", handlePlan(generateMarathonPlan));
router.post("/half", handlePlan(generateHalfMarathonPlan));
router.post("/10k", handlePlan(generate10kPlan));
router.post("/5k", handlePlan(generate5kPlan));

export default router;
