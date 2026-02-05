export type RunningLevel = "beginner" | "intermediate" | "advanced";
export type LiftingLevel = "beginner" | "intermediate" | "advanced";
export type Goal = "general" | "5k" | "10k" | "half-marathon" | "marathon" | "strength";
export type Sex = "male" | "female";
export type weekType = "B" | "D" | "T";

export interface FitnessProfile {
  age: number;
  sex: Sex;
  runningLevel: RunningLevel;
  startingWeeklyMileage: number;
  currentWeeklyMileage: number;
  liftingExperience: LiftingLevel;
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
}