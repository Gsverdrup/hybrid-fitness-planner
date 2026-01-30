import { z } from "zod";
import type { FitnessProfile } from "./fitnessProfile";

export const FitnessProfileSchema = z.object({
  age: z.number().int().min(13).max(100),

  sex: z.enum(["male", "female"]),

  runningLevel: z.enum(["beginner", "intermediate", "advanced"]),

  currentWeeklyMileage: z.number().min(0).max(200),

  liftingExperience: z.enum(["beginner", "intermediate", "advanced"]),

  runDaysPerWeek: z.number().int().min(0).max(6),

  liftDaysPerWeek: z.number().int().min(0).max(6),

  longRunDay: z.number().int().min(0).max(6),

  runDays: z.array(
    z.number().int().min(0).max(6)
  ).min(1).max(7),

  liftDays: z.array(
    z.number().int().min(0).max(6)
  ).max(7),

  goal: z.enum([
    "general",
    "5k",
    "10k",
    "half-marathon",
    "marathon",
    "strength",
  ]),
}) satisfies z.ZodType<FitnessProfile>;
