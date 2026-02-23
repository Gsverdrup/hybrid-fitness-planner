import { z } from "zod";
import type { FitnessProfile } from "../domain/fitnessProfile";

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
    primaryChestExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    secondaryChestExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    frontDeltExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    lateralDeltExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    tricepExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    latExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    midBackExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    rearDeltExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    bicepExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    compoundLegExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    quadExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    hamstringExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    gluteExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    calfExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    antiExtensionCoreExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    antiRotationCoreExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    antiLateralFlexionCoreExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
    trunkFlexionCoreExercises: z.array(
      z.object({
        name: z.string(),
        sets: z.number().int().min(1).max(10),
        reps: z.number().int().min(1).max(20),
        unit: z.enum(["reps", "seconds", "meters"]).optional(),
      })      ).optional(),
  }).optional() 
}) satisfies z.ZodType<FitnessProfile>;
