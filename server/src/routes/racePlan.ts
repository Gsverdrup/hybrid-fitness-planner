import { Router } from "express";
import { generateMarathonPlan } from "../services/racePlanGenerator";
import { FitnessProfile } from "../domain/fitnessProfile";
import { FitnessProfileSchema } from "../domain/fitnessProfileSchema";
import { z } from "zod";

const router = Router();

router.post("/", (req, res) => {
    const parsed = FitnessProfileSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json(parsed.error.format());
    }

    const profile = parsed.data as FitnessProfile;

    try {
        const plan = generateMarathonPlan(profile);
        res.json(plan);
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
});

export default router;