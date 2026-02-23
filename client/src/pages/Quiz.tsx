import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./QuizPage.css";

type Goal = "5k" | "10k" | "half" | "marathon";
type Sex = "male" | "female";
type FitnessLevel = "beginner" | "intermediate" | "advanced";
type TrainingDays = 3 | 4 | 5 | 6;

type Exercise = {
  name: string;
  sets: number;
  reps: number;
  unit?: "reps" | "seconds" | "meters";
};

type ExerciseCategory = {
  key: string;
  label: string;
  exercises: Exercise[];
};

type QuizAnswers = {
  goal?: Goal;
  age?: number;
  sex?: Sex;
  fitnessLevel?: FitnessLevel;
  weeklyMileage?: number;
  raceDistanceKm?: number;
  raceTimeHours?: number;
  raceTimeMinutes?: number;
  raceTimeSeconds?: number;
  daysPerWeek?: TrainingDays;
  runDays?: number[];
  longRunDay?: number;
  hasLiftPlan?: "yes" | "no";
  liftDaysPerWeek?: number;
  liftDays?: number[];
  preferredLiftExercises?: Record<string, Exercise>;
  trainingLengthWeeks?: number;
};

type ChoiceValue = string | number;

type ChoiceOption = {
  value: ChoiceValue;
  label: string;
  sub?: string;
};

type Step = {
  id: keyof QuizAnswers;
  question: string;
  hint: string;
  type: "choice" | "number" | "date" | "trainingLengthWeeks";
  options?: ChoiceOption[];
  min?: number;
  max?: number;
  placeholder?: string;
};

const DAY_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  {
    key: "primaryChestExercises",
    label: "Chest (Primary)",
    exercises: [
      { name: "Incline Dumbbell Bench Press", sets: 4, reps: 8 },
      { name: "Barbell Bench Press", sets: 4, reps: 8 },
      { name: "Incline Barbell Bench Press", sets: 4, reps: 8 },
      { name: "Dumbbell Bench Press", sets: 4, reps: 8 },
      { name: "Machine Chest Press", sets: 4, reps: 8 },
    ],
  },
  {
    key: "secondaryChestExercises",
    label: "Chest (Secondary)",
    exercises: [
      { name: "Cable Chest Flyes", sets: 3, reps: 12 },
      { name: "Dumbbell Chest Flyes", sets: 3, reps: 12 },
      { name: "Machine Chest Flyes", sets: 3, reps: 12 },
      { name: "Push-Ups", sets: 3, reps: 20 },
    ],
  },
  {
    key: "frontDeltExercises",
    label: "Shoulders (Front Delt)",
    exercises: [
      { name: "Dumbbell Shoulder Press", sets: 3, reps: 10 },
      { name: "Standing Overhead Press", sets: 4, reps: 8 },
      { name: "Front Delt Raises", sets: 3, reps: 12 },
    ],
  },
  {
    key: "lateralDeltExercises",
    label: "Shoulders (Side Delt)",
    exercises: [
      { name: "Cable Lateral Raises", sets: 3, reps: 10 },
      { name: "Dumbbell Lateral Raises", sets: 3, reps: 12 },
    ],
  },
  {
    key: "tricepExercises",
    label: "Triceps",
    exercises: [
      { name: "Tricep Pushdowns", sets: 3, reps: 10 },
      { name: "Tricep Dips", sets: 4, reps: 8 },
      { name: "Overhead Tricep Extension", sets: 3, reps: 10 },
      { name: "Skull Crushers", sets: 3, reps: 10 }
    ],
  },
  {
    key: "latExercises",
    label: "Lats",
    exercises: [
      { name: "Lat Pulldowns", sets: 4, reps: 8 },
      { name: "Single-Arm Lat Pulldowns", sets: 4, reps: 8 },
      { name: "Pull-Ups", sets: 4, reps: 8 },
      { name: "Lat Pullovers", sets: 3, reps: 10 }
    ],
  },
  {
    key: "midBackExercises",
    label: "Mid Back",
    exercises: [
      { name: "Barbell Rows", sets: 4, reps: 8 },
      { name: "Dumbbell Rows", sets: 4, reps: 8 },
      { name: "Seated Cable Rows", sets: 4, reps: 8 },
      { name: "Chest-Supported Rows", sets: 4, reps: 8 }
    ],
  },
  {
    key: "rearDeltExercises",
    label: "Shoulders (Rear Delt)",
    exercises: [
      { name: "Cable Rear Delt Flyes", sets: 3, reps: 12 },
      { name: "Machine Rear Delt Flyes", sets: 3, reps: 12 },
      { name: "Face Pulls", sets: 3, reps: 10 }
    ],
  },
  {
    key: "bicepExercises",
    label: "Biceps",
    exercises: [
      { name: "Dumbbell Curls", sets: 3, reps: 10 },
      { name: "Barbell Curls", sets: 3, reps: 10 },
      { name: "Cable Curls", sets: 3, reps: 10 },
      { name: "Preacher Curls", sets: 3, reps: 10 }
    ],
  },
  {
    key: "compoundLegExercises",
    label: "Legs (Compound)",
    exercises: [
      { name: "Back Squats", sets: 4, reps: 8 },
      { name: "Leg Press", sets: 4, reps: 8 },
      { name: "Hack Squats", sets: 4, reps: 8 },
      { name: "Bulgarian Split Squats", sets: 4, reps: 8 },
      { name: "Goblet Squats", sets: 4, reps: 8 }
    ],
  },
  {
    key: "quadExercises",
    label: "Quads",
    exercises: [
      { name: "Leg Extensions", sets: 3, reps: 10 },
      { name: "Step-Ups", sets: 3, reps: 10 },
      { name: "Lunges", sets: 3, reps: 10 }
    ],
  },
  {
    key: "hamstringExercises",
    label: "Hamstrings",
    exercises: [
      { name: "Romanian Deadlifts", sets: 3, reps: 10 },
      { name: "Hamstring Curls", sets: 3, reps: 10 },
      { name: "Good Mornings", sets: 3, reps: 10 }
    ],
  },
  {
    key: "gluteExercises",
    label: "Glutes",
    exercises: [
      { name: "Hip Thrusts", sets: 3, reps: 10 },
      { name: "Glute Bridges", sets: 3, reps: 12 },
      { name: "Hip Abductions", sets: 3, reps: 15 },
    ],
  },
  {
    key: "calfExercises",
    label: "Calves",
    exercises: [
      { name: "Standing Calf Raises", sets: 3, reps: 15 },
      { name: "Seated Calf Raises", sets: 3, reps: 15 }
    ]
  },
  {
    key: "antiExtensionCoreExercises",
    label: "Core (Anti-Extension)",
    exercises: [
      { name: "Plank", sets: 3, reps: 30, unit: "seconds" }, 
      { name: "Ab Wheel Rollout", sets: 3, reps: 8 },
      { name: "Stability Ball Rollout", sets: 3, reps: 10 },
      { name: "Dead Bug", sets: 3, reps: 10 }
    ],
  },
  {
    key: "antiRotationCoreExercises",
    label: "Core (Anti-Rotation)",
    exercises: [
      { name: "Pallof Press", sets: 3, reps: 12 },
      { name: "Cable Chop (Isometric)", sets: 3, reps: 10 },
      { name: "Band Anti-Rotation Hold", sets: 3, reps: 20, unit: "seconds" }
    ]
  },
  {
    key: "antiLateralFlexionCoreExercises",
    label: "Core (Anti-Lateral Flexion)",
    exercises: [
      { name: "Side Plank", sets: 3, reps: 30, unit: "seconds" },
      { name: "Suitcase Carry", sets: 3, reps: 40, unit: "meters" },
      { name: "Single-Arm Farmer Carry", sets: 3, reps: 30, unit: "seconds" }
    ]
  },
  {
    key: "trunkFlexionCoreExercises",
    label: "Core (Trunk Flexion)",
    exercises: [
      { name: "Hanging Leg Raises", sets: 3, reps: 10 },
      { name: "Cable Crunch", sets: 3, reps: 12 },
      { name: "Ab Crunch", sets: 3, reps: 15 }
    ]
  }
];

const STEPS: Step[] = [
  {
    id: "goal",
    question: "What's your race goal?",
    hint: "We'll build your plan around this distance.",
    type: "choice",
    options: [
      { value: "5k", label: "5K", sub: "3.1 miles" },
      { value: "10k", label: "10K", sub: "6.2 miles" },
      { value: "half", label: "Half Marathon", sub: "13.1 miles" },
      { value: "marathon", label: "Marathon", sub: "26.2 miles" },
    ],
  },
  {
    id: "trainingLengthWeeks",
    question: "How many weeks until your race?",
    hint: "Select a training length for your plan.",
    type: "trainingLengthWeeks",
  },
  {
    id: "age",
    question: "How old are you?",
    hint: "We use this to calibrate training intensity.",
    type: "choice",
    options: Array.from({ length: 88 }, (_, i) => ({
      value: String(13 + i),
      label: String(13 + i),
    })),
  },
  {
    id: "sex",
    question: "What's your biological sex?",
    hint: "Helps us apply the right physiology baselines.",
    type: "choice",
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
    ],
  },
  {
    id: "fitnessLevel",
    question: "How would you describe your current fitness?",
    hint: "Be honest — we'll calibrate accordingly.",
    type: "choice",
    options: [
      { value: "beginner", label: "Beginner", sub: "Rarely run or just starting" },
      { value: "intermediate", label: "Intermediate", sub: "Running a few times a week" },
      {
        value: "advanced",
        label: "Advanced",
        sub: "Consistent runner with race experience",
      },
    ],
  },
  {
    id: "weeklyMileage",
    question: "How many miles do you run per week right now?",
    hint: "Approximate is fine.",
    type: "choice",
    options: Array.from({ length: 51 }, (_, i) => ({
      value: String(i),
      label: String(i),
    })),
  },
  {
    id: "raceDistanceKm",
    question: "What is your most recent race result?",
    hint: "Enter your race distance and finish time.",
    type: "choice",
  },
  {
    id: "runDays",
    question: "Set your running schedule",
    hint: "Choose weekly run days, then pick your long run day.",
    type: "choice",
  },
  {
    id: "hasLiftPlan",
    question: "Would you like to include a lifting plan?",
    hint: "Add strength sessions alongside your running plan.",
    type: "choice",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "liftDays",
    question: "Set your lifting schedule",
    hint: "Choose weekly lift days.",
    type: "choice",
  },
  {
    id: "preferredLiftExercises",
    question: "Select your preferred exercises (optional)",
    hint: "Choose exercises you'd like to include. We'll add these to your lifting plan.",
    type: "choice",
  },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

const ENDPOINT_MAP: Record<Goal, string> = {
  "5k": "/race-plan/5k",
  "10k": "/race-plan/10k",
  half: "/race-plan/half",
  marathon: "/race-plan/marathon",
};

const GOAL_TO_SERVER_GOAL: Record<Goal, "5k" | "10k" | "half-marathon" | "marathon"> = {
  "5k": "5k",
  "10k": "10k",
  half: "half-marathon",
  marathon: "marathon",
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getValidWeeksForGoal(goal?: Goal): [number, number] {
  switch (goal) {
    case "5k":
      return [8, 12];
    case "10k":
      return [8, 14];
    case "half":
      return [10, 16];
    case "marathon":
      return [12, 20];
    default:
      return [8, 20];
  }
}

function getMaxStartingMileageForGoal(goal?: Goal): number {
  switch (goal) {
    case "marathon":
      return 40;
    case "half":
      return 45;
    case "5k":
    case "10k":
    default:
      return 50;
  }
}

function calculateTargetPeak5k(
  startingMileage: number,
  trainingWeeks: number,
  level: FitnessLevel
): number {
  let basePeak: number;

  if (startingMileage < 15) {
    basePeak = trainingWeeks >= 12 ? 25 : trainingWeeks >= 10 ? 22 : 20;
  } else if (startingMileage < 25) {
    basePeak = trainingWeeks >= 12 ? 35 : trainingWeeks >= 10 ? 32 : 28;
  } else if (startingMileage < 35) {
    basePeak = trainingWeeks >= 12 ? 42 : trainingWeeks >= 10 ? 38 : 35;
  } else {
    basePeak = trainingWeeks >= 10 ? 48 : 45;
  }

  const levelMultiplier = level === "beginner" ? 0.9 : level === "intermediate" ? 1.0 : 1.15;
  let targetPeak = basePeak * levelMultiplier;

  const maxSafePeak = Math.min(50, startingMileage * 2.0);
  targetPeak = Math.min(targetPeak, maxSafePeak);
  targetPeak = Math.max(targetPeak, startingMileage);

  return Math.round(targetPeak * 2) / 2;
}

function calculateTargetPeak10k(
  startingMileage: number,
  trainingWeeks: number,
  level: FitnessLevel
): number {
  let basePeak: number;

  if (startingMileage < 15) {
    basePeak = trainingWeeks >= 12 ? 28 : trainingWeeks >= 10 ? 25 : 22;
  } else if (startingMileage < 25) {
    basePeak = trainingWeeks >= 12 ? 38 : trainingWeeks >= 10 ? 35 : 32;
  } else if (startingMileage < 35) {
    basePeak = trainingWeeks >= 12 ? 45 : trainingWeeks >= 10 ? 42 : 38;
  } else {
    basePeak = trainingWeeks >= 10 ? 50 : 48;
  }

  const levelMultiplier = level === "beginner" ? 0.9 : level === "intermediate" ? 1.0 : 1.12;
  let targetPeak = basePeak * levelMultiplier;

  const maxSafePeak = Math.min(55, startingMileage * 2.2);
  targetPeak = Math.min(targetPeak, maxSafePeak);
  targetPeak = Math.max(targetPeak, startingMileage);

  return Math.round(targetPeak * 2) / 2;
}

function calculateTargetPeakHalfMarathon(
  startingMileage: number,
  trainingWeeks: number,
  level: FitnessLevel
): number {
  let basePeak: number;

  if (startingMileage < 15) {
    basePeak = trainingWeeks >= 14 ? 32 : trainingWeeks >= 12 ? 30 : 28;
  } else if (startingMileage < 25) {
    basePeak = trainingWeeks >= 14 ? 40 : trainingWeeks >= 12 ? 38 : 35;
  } else if (startingMileage < 35) {
    basePeak = trainingWeeks >= 14 ? 45 : trainingWeeks >= 12 ? 43 : 40;
  } else {
    basePeak = trainingWeeks >= 12 ? 50 : 48;
  }

  const levelMultiplier = level === "beginner" ? 0.92 : level === "intermediate" ? 1.0 : 1.1;
  let targetPeak = basePeak * levelMultiplier;

  if (trainingWeeks >= 12 && startingMileage >= 15) {
    targetPeak = Math.max(targetPeak, 38);
  }

  const maxSafePeak = Math.min(55, startingMileage * 2.3);
  targetPeak = Math.min(targetPeak, maxSafePeak);
  targetPeak = Math.max(targetPeak, startingMileage);

  return Math.round(targetPeak * 2) / 2;
}

function calculateTargetPeakMarathon(
  startingMileage: number,
  trainingWeeks: number,
  level: FitnessLevel
): number {
  let basePeak: number;

  if (startingMileage < 20) {
    basePeak = trainingWeeks >= 18 ? 45 : trainingWeeks >= 16 ? 42 : trainingWeeks >= 14 ? 38 : 35;
  } else if (startingMileage < 30) {
    basePeak = trainingWeeks >= 18 ? 50 : trainingWeeks >= 16 ? 48 : trainingWeeks >= 14 ? 45 : 42;
  } else if (startingMileage < 35) {
    basePeak = trainingWeeks >= 16 ? 52 : trainingWeeks >= 14 ? 50 : 48;
  } else {
    basePeak = trainingWeeks >= 14 ? 55 : 52;
  }

  const levelMultiplier = level === "beginner" ? 0.92 : level === "intermediate" ? 1.0 : 1.08;
  let targetPeak = basePeak * levelMultiplier;

  if (trainingWeeks >= 16 && startingMileage >= 20) {
    targetPeak = Math.max(targetPeak, 50);
  } else if (trainingWeeks >= 14 && startingMileage >= 15) {
    targetPeak = Math.max(targetPeak, 45);
  }

  const maxSafePeak = Math.min(60, startingMileage * 2.5);
  targetPeak = Math.min(targetPeak, maxSafePeak);
  targetPeak = Math.max(targetPeak, startingMileage);

  return Math.round(targetPeak * 2) / 2;
}

function getProjectedPeakMileage(
  goal?: Goal,
  startingWeeklyMileage?: number,
  trainingLengthWeeks?: number,
  runningLevel?: FitnessLevel
): number | null {
  if (!goal || typeof startingWeeklyMileage !== "number" || typeof trainingLengthWeeks !== "number") {
    return null;
  }

  const level = runningLevel ?? "intermediate";

  if (goal === "5k") {
    const adjustedStart = Math.max(10, startingWeeklyMileage);
    return calculateTargetPeak5k(adjustedStart, trainingLengthWeeks, level);
  }

  if (goal === "10k") {
    const adjustedStart = Math.max(12, startingWeeklyMileage);
    return calculateTargetPeak10k(adjustedStart, trainingLengthWeeks, level);
  }

  if (goal === "half") {
    const adjustedStart = Math.max(12, startingWeeklyMileage);
    return calculateTargetPeakHalfMarathon(adjustedStart, trainingLengthWeeks, level);
  }

  const adjustedStart = Math.max(15, startingWeeklyMileage);
  return calculateTargetPeakMarathon(adjustedStart, trainingLengthWeeks, level);
}

function getAllowedRunDayOptions(projectedPeakMileage: number | null): TrainingDays[] {
  if (projectedPeakMileage === null) return [4, 5, 6];
  if (projectedPeakMileage >= 65) return [6];
  if (projectedPeakMileage >= 50) return [5, 6];
  return [4, 5, 6];
}

function estimateRaceTime(goal: Goal, level: FitnessLevel | undefined): { distanceKm: number; timeMinutes: number } {
  const raceDistanceByGoal: Record<Goal, number> = {
    "5k": 5,
    "10k": 10,
    half: 21.097,
    marathon: 42.195,
  };

  const raceTimeByGoalAndLevel: Record<Goal, Record<FitnessLevel, number>> = {
    "5k": { beginner: 33, intermediate: 26, advanced: 21 },
    "10k": { beginner: 68, intermediate: 53, advanced: 44 },
    half: { beginner: 145, intermediate: 115, advanced: 95 },
    marathon: { beginner: 310, intermediate: 250, advanced: 210 },
  };

  const resolvedLevel = level ?? "intermediate";
  return {
    distanceKm: raceDistanceByGoal[goal],
    timeMinutes: raceTimeByGoalAndLevel[goal][resolvedLevel],
  };
}

function getRaceTimeRangeMinutes(raceDistanceKm: number): [number, number] | null {
  // Returns [minMinutes, maxMinutes] for each distance
  // Min is based on world records (conservative), max is reasonable amateur times
  if (raceDistanceKm <= 1.7) {
    // 1 Mile: WR ~3:43, reasonable max ~10 min
    return [3.5, 10];
  }
  if (raceDistanceKm <= 5.5) {
    // 5K: WR ~12:35, reasonable max ~60 min
    return [12, 60];
  }
  if (raceDistanceKm <= 10.5) {
    // 10K: WR ~26:24, reasonable max ~120 min
    return [26, 120];
  }
  if (raceDistanceKm <= 21.5) {
    // Half Marathon: WR ~58:01, reasonable max ~240 min (4 hours)
    return [57, 240];
  }
  if (raceDistanceKm <= 42.5) {
    // Marathon: WR ~2:01:09 (121 min), reasonable max ~480 min (8 hours)
    return [120, 480];
  }
  return null;
}

function formatTimeRange(minMinutes: number, maxMinutes: number): string {
  const formatTime = (mins: number) => {
    const totalSeconds = Math.round(mins * 60);
    if (totalSeconds < 3600) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}:${String(minutes).padStart(2, "0")}`;
  };

  return `${formatTime(minMinutes)} – ${formatTime(maxMinutes)}`;
}

function parseRaceTimeToMinutes(hours?: number, minutes?: number, seconds?: number): number | null {
  const resolvedHours = hours ?? 0;
  const resolvedMinutes = minutes ?? 0;
  const resolvedSeconds = seconds ?? 0;

  if (
    resolvedHours < 0 ||
    resolvedMinutes < 0 ||
    resolvedSeconds < 0 ||
    resolvedMinutes >= 60 ||
    resolvedSeconds >= 60
  ) {
    return null;
  }

  return resolvedHours * 60 + resolvedMinutes + resolvedSeconds / 60;
}

async function parseResponseSafely(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export default function QuizPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleSteps = STEPS.filter((stepDef) => {
    if (stepDef.id === "liftDays") {
      return answers.hasLiftPlan === "yes";
    }
    if (stepDef.id === "preferredLiftExercises") {
      return answers.hasLiftPlan === "yes";
    }
    return true;
  });

  const current = visibleSteps[step];
  const progress = (step / Math.max(visibleSteps.length - 1, 1)) * 100;
  const currentValue = answers[current.id];
  const scalarInputValue =
    typeof currentValue === "string" || typeof currentValue === "number" ? currentValue : "";
  const requiredRunDays = Number(answers.daysPerWeek) || 0;
  const requiredLiftDays = Number(answers.liftDaysPerWeek) || 0;
  const maxStartingMileage = getMaxStartingMileageForGoal(answers.goal);
  const projectedPeakMileage = getProjectedPeakMileage(
    answers.goal,
    answers.weeklyMileage,
    answers.trainingLengthWeeks,
    answers.fitnessLevel
  );
  const allowedRunDayOptions = getAllowedRunDayOptions(projectedPeakMileage);
  const raceDistanceKm = Number(answers.raceDistanceKm);
  const raceTimeMinutes = parseRaceTimeToMinutes(answers.raceTimeHours, answers.raceTimeMinutes, answers.raceTimeSeconds);
  const raceTimeRangeMinutes = raceDistanceKm > 0 ? getRaceTimeRangeMinutes(raceDistanceKm) : null;
  const raceTimeError = raceDistanceKm > 0 && raceTimeMinutes !== null && raceTimeRangeMinutes
    ? (raceTimeMinutes < raceTimeRangeMinutes[0] ? `Time is faster than reasonable (min: ${formatTimeRange(raceTimeRangeMinutes[0], raceTimeRangeMinutes[0]).split(" – ")[0]})` : null) ||
      (raceTimeMinutes > raceTimeRangeMinutes[1] ? `Time is slower than reasonable (max: ${formatTimeRange(raceTimeRangeMinutes[1], raceTimeRangeMinutes[1]).split(" – ")[1]})` : null)
    : null;
  const selectedRunDays = Array.isArray(answers.runDays) ? answers.runDays : [];
  const selectedLiftDays = Array.isArray(answers.liftDays) ? answers.liftDays : [];
  const selectedLongRunDay = typeof answers.longRunDay === "number" ? answers.longRunDay : undefined;

  useEffect(() => {
    setAnswers((prev) => {
      const allowedOptions = getAllowedRunDayOptions(
        getProjectedPeakMileage(prev.goal, prev.weeklyMileage, prev.trainingLengthWeeks, prev.fitnessLevel)
      );

      if (!prev.daysPerWeek || allowedOptions.includes(prev.daysPerWeek)) {
        return prev;
      }

      const nextDaysPerWeek = allowedOptions[0];
      const existingRunDays = Array.isArray(prev.runDays) ? prev.runDays : [];
      const trimmedRunDays = existingRunDays.slice(0, nextDaysPerWeek);
      const nextLongRunDay = trimmedRunDays.includes(prev.longRunDay ?? -1)
        ? prev.longRunDay
        : trimmedRunDays[trimmedRunDays.length - 1];

      return {
        ...prev,
        daysPerWeek: nextDaysPerWeek,
        runDays: trimmedRunDays,
        longRunDay: nextLongRunDay,
      };
    });
  }, [answers.goal, answers.weeklyMileage, answers.trainingLengthWeeks, answers.fitnessLevel]);

  function setValue(val: ChoiceValue | string) {
    setAnswers((prev) => {
      if (current.id === "goal") {
        const nextGoal = val as Goal;
        const nextMaxMileage = getMaxStartingMileageForGoal(nextGoal);
        const existingMileage = typeof prev.weeklyMileage === "number" ? prev.weeklyMileage : undefined;
        const existingWeeks = typeof prev.trainingLengthWeeks === "number" ? prev.trainingLengthWeeks : undefined;
        const [minWeeks, maxWeeks] = getValidWeeksForGoal(nextGoal);

        return {
          ...prev,
          goal: nextGoal,
          weeklyMileage:
            existingMileage !== undefined && existingMileage > nextMaxMileage
              ? undefined
              : existingMileage,
          trainingLengthWeeks:
            existingWeeks !== undefined && (existingWeeks < minWeeks || existingWeeks > maxWeeks)
              ? undefined
              : existingWeeks,
        };
      }

      if (current.id === "hasLiftPlan") {
        const hasLiftPlan = val as "yes" | "no";
        return {
          ...prev,
          hasLiftPlan,
          liftDaysPerWeek: hasLiftPlan === "yes" ? prev.liftDaysPerWeek : undefined,
          liftDays: hasLiftPlan === "yes" ? prev.liftDays : [],
        };
      }

      if (current.id === "trainingLengthWeeks") {
        return { ...prev, [current.id]: Number(val) };
      }

      if (current.id === "age" || current.id === "weeklyMileage") {
        return { ...prev, [current.id]: Number(val) };
      }

      return { ...prev, [current.id]: val };
    });
  }

  function setRunDaysPerWeek(count: TrainingDays) {
    setAnswers((prev) => {
      const existingRunDays = Array.isArray(prev.runDays) ? prev.runDays : [];
      const trimmedRunDays = existingRunDays.slice(0, count);
      const nextLongRunDay = trimmedRunDays.includes(prev.longRunDay ?? -1)
        ? prev.longRunDay
        : trimmedRunDays[trimmedRunDays.length - 1];

      return {
        ...prev,
        daysPerWeek: count,
        runDays: trimmedRunDays,
        longRunDay: nextLongRunDay,
      };
    });
  }

  function setLongRunDay(day: number) {
    setAnswers((prev) => ({
      ...prev,
      longRunDay: day,
      liftDays: (Array.isArray(prev.liftDays) ? prev.liftDays : []).filter((d) => d !== day),
    }));
  }

  function setLiftDaysPerWeek(count: number) {
    setAnswers((prev) => {
      const existingLiftDays = Array.isArray(prev.liftDays) ? prev.liftDays : [];
      const trimmedLiftDays = existingLiftDays.slice(0, count);
      return {
        ...prev,
        liftDaysPerWeek: count,
        liftDays: trimmedLiftDays,
      };
    });
  }

  function toggleDaySelection(field: "runDays" | "liftDays", day: number) {
    setAnswers((prev) => {
      const existing = Array.isArray(prev[field]) ? prev[field] : [];
      const isSelected = existing.includes(day);

      if (field === "liftDays" && prev.hasLiftPlan === "yes" && prev.longRunDay === day) {
        return prev;
      }

      if (isSelected) {
        const next = existing.filter((d) => d !== day);
        if (field === "runDays") {
          const nextLongRunDay = next.includes(prev.longRunDay ?? -1)
            ? prev.longRunDay
            : next[next.length - 1];
          return { ...prev, runDays: next, longRunDay: nextLongRunDay };
        }

        return { ...prev, [field]: next };
      }

      if (field === "runDays") {
        const maxRunDays = Number(prev.daysPerWeek) || 0;
        if (existing.length >= maxRunDays) {
          return prev;
        }

        const nextRunDays = [...existing, day].sort((a, b) => a - b);
        const nextLongRunDay = prev.longRunDay ?? nextRunDays[nextRunDays.length - 1];
        return { ...prev, runDays: nextRunDays, longRunDay: nextLongRunDay };
      }

      if (field === "liftDays") {
        const maxLiftDays = Number(prev.liftDaysPerWeek) || 0;
        if (existing.length >= maxLiftDays) {
          return prev;
        }
      }

      return { ...prev, [field]: [...existing, day].sort((a, b) => a - b) };
    });
  }

  function toggleExerciseSelection(categoryKey: string, exercise: Exercise) {
    setAnswers((prev) => {
      const currentExercises = prev.preferredLiftExercises ?? {};
      const currentExercise = currentExercises[categoryKey];
      const isSelected = currentExercise?.name === exercise.name;

      const updated: Record<string, Exercise> = { ...currentExercises };
      if (isSelected) {
        delete updated[categoryKey];
      } else {
        updated[categoryKey] = exercise;
      }

      return {
        ...prev,
        preferredLiftExercises: Object.keys(updated).length === 0 ? undefined : updated,
      };
    });
  }

  const canAdvance = (() => {
    if (current.id === "runDays") {
      return (
        requiredRunDays >= 3 &&
        selectedRunDays.length === requiredRunDays &&
        selectedLongRunDay !== undefined &&
        selectedRunDays.includes(selectedLongRunDay)
      );
    }

    if (current.id === "liftDays") {
      return requiredLiftDays > 0 && selectedLiftDays.length === requiredLiftDays;
    }

    if (current.id === "preferredLiftExercises") {
      return true; // Optional step, always can advance
    }

    if (current.id === "raceDistanceKm") {
      if (raceDistanceKm <= 0 || raceTimeMinutes === null || raceTimeMinutes <= 0) {
        return false;
      }
      const range = getRaceTimeRangeMinutes(raceDistanceKm);
      if (!range) return false;
      const [minTime, maxTime] = range;
      return raceTimeMinutes >= minTime && raceTimeMinutes <= maxTime;
    }

    if (current.id === "trainingLengthWeeks") {
      const [minWeeks, maxWeeks] = getValidWeeksForGoal(answers.goal);
      return (
        typeof currentValue === "number" &&
        currentValue >= minWeeks &&
        currentValue <= maxWeeks
      );
    }

    if (current.id === "weeklyMileage") {
      return typeof currentValue === "number" && currentValue >= 0 && currentValue <= maxStartingMileage;
    }

    if (typeof currentValue === "number") {
      return currentValue >= 0;
    }
    if (typeof currentValue === "string") {
      return currentValue !== undefined && currentValue !== null;
    }
    if (Array.isArray(currentValue)) {
      return currentValue.length > 0;
    }
    return currentValue !== undefined && currentValue !== null;
  })();

  function handleNext() {
    if (step < visibleSteps.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    void submitPlan();
  }

  function handleBack() {
    if (step > 0) {
      setStep((s) => s - 1);
      return;
    }

    navigate("/");
  }

  async function submitPlan() {
    const goal = answers.goal;
    if (!goal) {
      setError("Please choose a race goal.");
      return;
    }

    setLoading(true);
    setError(null);

    const endpoint = ENDPOINT_MAP[goal];
    const runDays = (Array.isArray(answers.runDays) ? answers.runDays : []).sort((a, b) => a - b);
    const runDaysPerWeek = clamp(runDays.length || Number(answers.daysPerWeek) || 4, 1, 6);
    const liftDays = answers.hasLiftPlan === "yes"
      ? (Array.isArray(answers.liftDays) ? answers.liftDays : []).sort((a, b) => a - b)
      : [];
    const liftDaysPerWeek = clamp(Number(answers.liftDaysPerWeek) || liftDays.length, 0, 6);
    const trainingLengthWeeks = answers.trainingLengthWeeks ?? 12;
    const runningLevel = answers.fitnessLevel ?? "intermediate";
    const fallbackRaceTime = estimateRaceTime(goal, runningLevel);

    const payload = {
      age: clamp(Number(answers.age) || 25, 13, 100),
      sex: (answers.sex ?? "male") as Sex,
      runningLevel,
      startingWeeklyMileage: clamp(Number(answers.weeklyMileage) || 15, 0, getMaxStartingMileageForGoal(goal)),
      currentWeeklyMileage: clamp(Number(answers.weeklyMileage) || 15, 0, getMaxStartingMileageForGoal(goal)),
      runDaysPerWeek,
      liftDaysPerWeek,
      longRunDay: answers.longRunDay ?? runDays[runDays.length - 1],
      runDays,
      liftDays,
      goal: GOAL_TO_SERVER_GOAL[goal],
      trainingLengthWeeks,
      providedRaceTime: {
        distanceKm: raceDistanceKm > 0 ? raceDistanceKm : fallbackRaceTime.distanceKm,
        timeMinutes: raceTimeMinutes && raceTimeMinutes > 0 ? raceTimeMinutes : fallbackRaceTime.timeMinutes,
      },
      ...(answers.preferredLiftExercises && {
        preferredLiftExercises: Object.entries(answers.preferredLiftExercises).reduce(
          (acc, [key, exercise]) => ({
            ...acc,
            [key]: [exercise],
          }),
          {}
        ),
      }),
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const parsedBody = await parseResponseSafely(response);

      if (!response.ok) {
        const errorMessage =
          typeof parsedBody === "object" && parsedBody !== null && "error" in parsedBody
            ? String((parsedBody as { error?: string }).error || "")
            : typeof parsedBody === "string"
            ? parsedBody
            : "Failed to generate plan.";

        throw new Error(errorMessage || "Failed to generate plan.");
      }

      if (!parsedBody || typeof parsedBody !== "object") {
        throw new Error("Plan generation returned an unexpected response.");
      }

      const plan = parsedBody as Record<string, unknown>;
      navigate("/plan", { state: { plan, goal } });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate plan.");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="quiz-root loading-screen">
        <div className="loading-inner">
          <div className="loading-ring" />
          <p className="loading-label">Building your plan…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-root">
      <div className="quiz-header">
        <button className="quiz-back" onClick={handleBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="quiz-step-count">
          {step + 1} / {visibleSteps.length}
        </span>
      </div>

      <main className="quiz-body">
        <div className="quiz-card" key={step}>
          <p className="quiz-hint">{current.hint}</p>
          <h2 className="quiz-question">{current.question}</h2>

          {current.id !== "weeklyMileage" && current.id !== "age" && current.type === "choice" && current.options && (
            <div className={`quiz-options ${current.options.length === 2 ? "cols-2" : "cols-auto"}`}>
              {current.options.map((option) => (
                <button
                  key={String(option.value)}
                  className={`quiz-option ${currentValue === option.value ? "selected" : ""}`}
                  onClick={() => setValue(option.value)}
                >
                  <span className="opt-label">{option.label}</span>
                  {option.sub && <span className="opt-sub">{option.sub}</span>}
                </button>
              ))}
            </div>
          )}

          {current.id === "age" && (
            <div className="quiz-input-wrap">
              <select
                className="quiz-input"
                value={answers.age ?? ""}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    age: Number(e.target.value),
                  }))
                }
              >
                <option value="" disabled>
                  Select age
                </option>
                {Array.from({ length: 88 }, (_, i) => {
                  const age = 13 + i;
                  return (
                    <option key={age} value={age}>
                      {age}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {current.id === "weeklyMileage" && (
            <div className="quiz-input-wrap">
              <select
                className="quiz-input"
                value={answers.weeklyMileage ?? ""}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    weeklyMileage: Number(e.target.value),
                  }))
                }
              >
                <option value="" disabled>
                  Select weekly mileage
                </option>
                {Array.from({ length: maxStartingMileage + 1 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
              <p className="quiz-hint" style={{ marginTop: "0.5rem" }}>
                Max for {answers.goal === "half" ? "half marathon" : answers.goal ?? "this goal"}: {maxStartingMileage} mi/week
              </p>
            </div>
          )}

          {current.id === "runDays" && (
            <>
              <div className="schedule-row">
                <div className="schedule-column">
                  <p className="quiz-hint">How many days would you like to run?</p>
                  <div className="quiz-options cols-auto compact-options">
                    {allowedRunDayOptions.map((count) => (
                      <button
                        key={count}
                        className={`quiz-option ${requiredRunDays === count ? "selected" : ""}`}
                        onClick={() => setRunDaysPerWeek(count as TrainingDays)}
                      >
                        <span className="opt-label">{count} days</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="schedule-column">
                  <p className="quiz-hint">Which days would you like to run?</p>
                  <div className="quiz-options cols-auto compact-options">
                    {DAY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        className={`quiz-option ${selectedRunDays.includes(option.value) ? "selected" : ""}`}
                        onClick={() => toggleDaySelection("runDays", option.value)}
                      >
                        <span className="opt-label">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {projectedPeakMileage !== null && (
                <p className="quiz-hint">
                  Projected peak mileage: {projectedPeakMileage.toFixed(1)} mi/week
                </p>
              )}
              <p className="quiz-hint">
                {selectedRunDays.length} / {requiredRunDays} selected
              </p>

              {selectedRunDays.length > 0 && (
                <>
                  <p className="quiz-hint">Which day would you like your long run?</p>
                  <div className="quiz-options cols-auto">
                    {selectedRunDays.map((day) => {
                      const label = DAY_OPTIONS.find((d) => d.value === day)?.label ?? String(day);
                      return (
                        <button
                          key={day}
                          className={`quiz-option ${selectedLongRunDay === day ? "selected" : ""}`}
                          onClick={() => setLongRunDay(day)}
                        >
                          <span className="opt-label">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {current.id === "raceDistanceKm" && (
            <div className="schedule-row">
              <div className="schedule-column">
                <p className="quiz-hint">Race distance</p>
                <div className="quiz-input-wrap compact-options">
                  <select
                    className="quiz-input"
                    value={answers.raceDistanceKm ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        raceDistanceKm: Number(e.target.value),
                      }))
                    }
                  >
                    <option value="" disabled>
                      Select distance
                    </option>
                    <option value={1.609}>1 Mile</option>
                    <option value={5}>5K</option>
                    <option value={10}>10K</option>
                    <option value={21.097}>Half Marathon</option>
                    <option value={42.195}>Marathon</option>
                  </select>
                </div>
              </div>

              <div className="schedule-column">
                <p className="quiz-hint">Finish time</p>
                <div className="quiz-input-wrap compact-options" style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem", opacity: 0.7 }}>Hours</label>
                    <select
                      className="quiz-input"
                      value={answers.raceTimeHours ?? 0}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          raceTimeHours: Number(e.target.value),
                        }))
                      }
                    >
                      {Array.from({ length: 9 }, (_, i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem", opacity: 0.7 }}>Minutes</label>
                    <select
                      className="quiz-input"
                      value={answers.raceTimeMinutes ?? 0}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          raceTimeMinutes: Number(e.target.value),
                        }))
                      }
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.75rem", opacity: 0.7 }}>Seconds</label>
                    <select
                      className="quiz-input"
                      value={answers.raceTimeSeconds ?? 0}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          raceTimeSeconds: Number(e.target.value),
                        }))
                      }
                    >
                      {Array.from({ length: 60 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {raceTimeRangeMinutes && (
                  <div className="quiz-hint" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                    Valid range: {formatTimeRange(raceTimeRangeMinutes[0], raceTimeRangeMinutes[1])}
                  </div>
                )}
                {raceTimeError && (
                  <p className="quiz-error" style={{ marginTop: "0.5rem" }}>{raceTimeError}</p>
                )}
              </div>
            </div>
          )}

          {current.id === "liftDays" && (
            <>
              <div className="schedule-row">
                <div className="schedule-column">
                  <p className="quiz-hint">How many days would you like to lift?</p>
                  <div className="quiz-options cols-auto compact-options">
                    {[1, 2, 3].map((count) => (
                      <button
                        key={count}
                        className={`quiz-option ${requiredLiftDays === count ? "selected" : ""}`}
                        onClick={() => setLiftDaysPerWeek(count)}
                      >
                        <span className="opt-label">{count} day{count > 1 ? "s" : ""}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="schedule-column">
                  <p className="quiz-hint">Which days would you like to lift?</p>
                  <div className="quiz-options cols-auto compact-options">
                    {DAY_OPTIONS.map((option) => {
                      const isLongRunDay = selectedLongRunDay === option.value;
                      return (
                        <button
                          key={option.value}
                          className={`quiz-option ${selectedLiftDays.includes(option.value) ? "selected" : ""} ${isLongRunDay ? "disabled-day" : ""}`}
                          onClick={() => toggleDaySelection("liftDays", option.value)}
                          disabled={isLongRunDay}
                        >
                          <span className="opt-label">{option.label}</span>
                          {isLongRunDay && <span className="day-badge">Long Run</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {selectedLongRunDay !== undefined && (
                <p className="quiz-hint">Long run day is locked and cannot be selected for lifting.</p>
              )}
              <p className="quiz-hint">{selectedLiftDays.length} / {requiredLiftDays} selected</p>
            </>
          )}

          {current.id === "preferredLiftExercises" && (
            <div className="exercise-selection">
              {EXERCISE_CATEGORIES.map((category) => {
                const selectedExercise = answers.preferredLiftExercises?.[category.key];
                
                return (
                  <div key={category.key} className="exercise-category">
                    <div className="category-header">
                      <span className="category-label">
                        {category.label}
                        {selectedExercise && (
                          <span className="category-count">(1 selected)</span>
                        )}
                      </span>
                    </div>
                    <div className="category-exercises">
                      {category.exercises.map((exercise) => {
                        const isSelected = selectedExercise?.name === exercise.name;
                        return (
                          <label key={exercise.name} className="exercise-checkbox">
                            <input
                              type="radio"
                              name={`exercise-${category.key}`}
                              checked={isSelected}
                              onChange={() => toggleExerciseSelection(category.key, exercise)}
                            />
                            <span className="exercise-name">{exercise.name}</span>
                            <span className="exercise-details">
                              {exercise.sets}×{exercise.reps}{exercise.unit ? ` ${exercise.unit}` : ""}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {current.type === "number" && (
            <div className="quiz-input-wrap">
              <input
                className="quiz-input"
                type="number"
                min={current.min}
                max={current.max}
                placeholder={current.placeholder}
                value={scalarInputValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setValue("");
                  } else {
                    const num = Number(val);
                    if (!Number.isNaN(num) && num >= (current.min ?? 0) && num <= (current.max ?? 999)) {
                      setValue(val);
                    }
                  }
                }}
                onKeyDown={(e) => e.key === "Enter" && canAdvance && handleNext()}
                autoFocus
              />
            </div>
          )}

          {current.type === "trainingLengthWeeks" && (
            <div className="quiz-input-wrap">
              <select
                className="quiz-input"
                value={scalarInputValue}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              >
                <option value="" disabled>
                  Select number of weeks
                </option>
                {(() => {
                  const [minWeeks, maxWeeks] = getValidWeeksForGoal(answers.goal);
                  return Array.from({ length: maxWeeks - minWeeks + 1 }, (_, i) => minWeeks + i).map(
                    (weeks) => (
                      <option key={weeks} value={weeks}>
                        {weeks} weeks
                      </option>
                    )
                  );
                })()}
              </select>
            </div>
          )}

          {error && <p className="quiz-error">{error}</p>}

          <button className="quiz-next" onClick={handleNext} disabled={!canAdvance}>
            {step === visibleSteps.length - 1 ? "Generate My Plan" : "Continue"}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}
