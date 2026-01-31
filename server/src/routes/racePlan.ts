import { Router } from "express";
import { generateMarathonPlan } from "../services/racePlanGenerator";
import { FitnessProfile } from "../domain/fitnessProfile";
import { FitnessProfileSchema } from "../domain/fitnessProfileSchema";
import { z } from "zod";

const router = Router();

const MarathonPlanRequestSchema = z.object({
    profile: FitnessProfileSchema,
    numWeeks: z.number().int().min(8).max(20)
});

router.post("/", (req, res) => {
    const parsed = MarathonPlanRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json(parsed.error.format());
    }

    const { profile, numWeeks } = parsed.data as { profile: FitnessProfile; numWeeks: number };

    try {
        const plan = generateMarathonPlan(profile, numWeeks);
        res.json(plan);
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
});

export default router;