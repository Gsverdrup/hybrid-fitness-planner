import { Router } from "express";
import { generateMarathonPlan, generateHalfMarathonPlan, generate10kPlan, generate5kPlan } from "../logic/plans/racePlanGenerator";
import { FitnessProfileSchema } from "../validation/fitnessProfileSchema";
const router = Router();
function handlePlan(generator) {
    return (req, res) => {
        const parsed = FitnessProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json(parsed.error.format());
        }
        try {
            const plan = generator(parsed.data);
            res.json(plan);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    };
}
router.post("/marathon", handlePlan(generateMarathonPlan));
router.post("/half", handlePlan(generateHalfMarathonPlan));
router.post("/10k", handlePlan(generate10kPlan));
router.post("/5k", handlePlan(generate5kPlan));
export default router;
