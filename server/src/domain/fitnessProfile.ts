import { paceChart } from "./paceChart";
import { Exercise } from "./weeklyPlan";

export type RunningLevel = "beginner" | "intermediate" | "advanced";
export type Goal = "general" | "5k" | "10k" | "half-marathon" | "marathon" | "strength";
export type Sex = "male" | "female";
export type weekType = "B" | "D" | "T";

export interface FitnessProfile {
  age: number;
  sex: Sex;
  runningLevel: RunningLevel;
  startingWeeklyMileage: number;
  currentWeeklyMileage: number;
  runDaysPerWeek: number;
  liftDaysPerWeek: number;
  longRunDay: number;
  runDays: number[];
  liftDays: number[];
  goal: Goal;
  peakLongRunLength?: number;
  trainingLengthWeeks: number;
  weeksUntilRace?: number;
  weekType?: weekType;
  peakMileage?: number;
  longRunLength?: number;
  providedRaceTime?: {
    distanceKm: number;
    timeMinutes: number;
  };
  paceChart?: paceChart;
  preferredLiftExercises?: {
    primaryChestExercises?: Exercise[];
    secondaryChestExercises?: Exercise[];
    frontDeltExercises?: Exercise[];
    lateralDeltExercises?: Exercise[];
    tricepExercises?: Exercise[];
    latExercises?: Exercise[];
    midBackExercises?: Exercise[];
    rearDeltExercises?: Exercise[];
    bicepExercises?: Exercise[];
    compoundLegExercises?: Exercise[];
    quadExercises?: Exercise[];
    hamstringExercises?: Exercise[];
    gluteExercises?: Exercise[];
    calfExercises?: Exercise[];
    antiExtensionCoreExercises?: Exercise[]; 
    antiRotationCoreExercises?: Exercise[];
    antiLateralFlexionCoreExercises?: Exercise[];
    trunkFlexionCoreExercises?: Exercise[];
  };
}