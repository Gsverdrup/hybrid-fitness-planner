export type RunType = "easy" | "workout" | "long";
export type LiftType = "push" | "pull" | "legs" | "upper";
export type Exercise = {
  name: string;
  sets: number;
  reps: number;
  unit?: "reps" | "seconds" | "meters";
};

export interface RunWorkout {
  type: "run";
  runType: RunType;
  miles: number;
  paceMinPerMile?: number; 
  name?: string;
  segments?: RunSegment[];
}

export interface LiftWorkout {
  type: "lift";
  liftType: LiftType;
  exercises?: Exercise[];
}

export type Workout = RunWorkout | LiftWorkout;

export interface DailyPlan {
  day: number; // 0–6
  workouts: Workout[];
}

export interface WeeklyPlan {
  days: DailyPlan[];
  weekType?: "B" | "D" | "T";
}

export type RunSegment = {
  distanceMiles: number;
  pace: number;
  description?: string;
};
