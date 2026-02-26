import { z } from "zod";
import type { FitnessProfile } from "../domain/fitnessProfile";

const PreferredLiftExerciseSchema = z.object({
  name: z.string(),
  sets: z.number().int().min(1).max(10),
  reps: z.number().int().min(1),
  unit: z.enum(["reps", "seconds", "meters"]).optional(),
}).superRefine((exercise, ctx) => {
  const maxByUnit = {
    reps: 20,
    seconds: 600,
    meters: 500,
  } as const;

  const resolvedUnit = exercise.unit ?? "reps";
  const maxValue = maxByUnit[resolvedUnit];

  if (exercise.reps > maxValue) {
    ctx.addIssue({
      code: "custom",
      path: ["reps"],
      message: `Too big: expected ${resolvedUnit} to be <=${maxValue}`,
    });
  }
});

export const FitnessProfileSchema = z.object({
  age: z.number().int().min(13).max(100),

  sex: z.enum(["male", "female"]),

  runningLevel: z.enum(["beginner", "intermediate", "advanced"]),

  startingWeeklyMileage: z.number().min(0).max(200),

  currentWeeklyMileage: z.number().min(0).max(200),

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
    "5k",
    "10k",
    "half-marathon",
    "marathon",
  ]),

  peakLongRunLength: z.number().min(0).max(30).optional(),

  trainingLengthWeeks: z.number().int().min(8).max(20),

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
  preferredLiftExercises: z.object({
    primaryChestExercises: z.array(PreferredLiftExerciseSchema).optional(),
    secondaryChestExercises: z.array(PreferredLiftExerciseSchema).optional(),
    frontDeltExercises: z.array(PreferredLiftExerciseSchema).optional(),
    lateralDeltExercises: z.array(PreferredLiftExerciseSchema).optional(),
    tricepExercises: z.array(PreferredLiftExerciseSchema).optional(),
    latExercises: z.array(PreferredLiftExerciseSchema).optional(),
    midBackExercises: z.array(PreferredLiftExerciseSchema).optional(),
    rearDeltExercises: z.array(PreferredLiftExerciseSchema).optional(),
    bicepExercises: z.array(PreferredLiftExerciseSchema).optional(),
    compoundLegExercises: z.array(PreferredLiftExerciseSchema).optional(),
    quadExercises: z.array(PreferredLiftExerciseSchema).optional(),
    hamstringExercises: z.array(PreferredLiftExerciseSchema).optional(),
    gluteExercises: z.array(PreferredLiftExerciseSchema).optional(),
    calfExercises: z.array(PreferredLiftExerciseSchema).optional(),
    antiExtensionCoreExercises: z.array(PreferredLiftExerciseSchema).optional(),
    antiRotationCoreExercises: z.array(PreferredLiftExerciseSchema).optional(),
    antiLateralFlexionCoreExercises: z.array(PreferredLiftExerciseSchema).optional(),
    trunkFlexionCoreExercises: z.array(PreferredLiftExerciseSchema).optional(),
  }).optional() 
}) satisfies z.ZodType<FitnessProfile>;
