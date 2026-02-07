import { z } from "zod";
import type { FitnessProfile } from "./fitnessProfile";

export const FitnessProfileSchema = z.object({
  age: z.number().int().min(13).max(100),

  sex: z.enum(["male", "female"]),

  runningLevel: z.enum(["beginner", "intermediate", "advanced"]),

  startingWeeklyMileage: z.number().min(0).max(200),

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

  peakLongRunLength: z.number().min(0).max(30).optional(),

  trainingLengthWeeks: z.number().int().min(12).max(20),

  weeksUntilRace: z.number().int().min(0).max(20).optional(),

  weekType: z.enum(["B", "D", "T"]).optional(),

  peakMileage: z.number().min(0).max(80).optional(),

  longRunLength: z.number().min(0).max(30).optional(),

  providedRaceTime: z.object({
    distanceKm: z.number().min(0.1).max(42.195),
    timeMinutes: z.number().min(1).max(24 * 60),
  }).optional(),

  paceChart: z.object({
    race1Mile: z.number().min(1).max(20),
    race5k: z.number().min(1).max(20),
    race10k: z.number().min(1).max(20),
    raceHalfMarathon: z.number().min(1).max(20),
    raceMarathon: z.number().min(1).max(20),
    easyRun: z.number().min(1).max(20),
    thresholdRun: z.number().min(1).max(20),
    intervalRun: z.number().min(1).max(20),
  }).optional(),
}) satisfies z.ZodType<FitnessProfile>;
