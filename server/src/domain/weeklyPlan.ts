export type RunType = "easy" | "workout" | "long";
export type LiftType = "push" | "pull" | "legs" | "full-body" | "upper";

export interface RunWorkout {
  type: "run";
  runType: RunType;
  miles: number;
}

export interface LiftWorkout {
  type: "lift";
  liftType: LiftType;
}

export type Workout = RunWorkout | LiftWorkout;

export interface DailyPlan {
  day: number; // 0–6
  workouts: Workout[];
}

export interface WeeklyPlan {
  days: DailyPlan[];
}
