export type RunningLevel = "beginner" | "intermediate" | "advanced";
export type LiftingLevel = "beginner" | "intermediate" | "advanced";
export type Goal = "general" | "5k" | "10k" | "half-marathon" | "marathon" | "strength";
export type Sex = "male" | "female";

export interface FitnessProfile {
  age: number;
  sex: Sex;
  runningLevel: RunningLevel;
  currentWeeklyMileage: number;
  liftingExperience: LiftingLevel;
  runDaysPerWeek: number;
  liftDaysPerWeek: number;
  longRunDay: number;
  runDays: number[];
  liftDays: number[];
  goal: Goal;
}