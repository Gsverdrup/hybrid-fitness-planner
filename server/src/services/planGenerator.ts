import { FitnessProfile } from "../domain/fitnessProfile";
import { DailyPlan, WeeklyPlan, RunWorkout, LiftType } from "../domain/weeklyPlan";

// --------------------------------
// Public API
// --------------------------------
export function generateWeeklyPlan(profile: FitnessProfile): WeeklyPlan {
  // Validate profile
  validateProfile(profile);

  // Initialize empty week
  const days: DailyPlan[] = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    workouts: [],
  }));

  // Determine plan type
  const hasRunning = profile.runDaysPerWeek > 0;
  const hasLifting = profile.liftDaysPerWeek > 0;

  // Generate running plan if applicable
  if (hasRunning) {
    assignRunWorkouts(days, profile);
  }

  // Generate lifting plan if applicable
  if (hasLifting) {
    assignLiftWorkouts(days, profile);
  }

  return { days };
}

// --------------------------------
// Generators
// --------------------------------
function assignRunWorkouts(days: DailyPlan[], profile: FitnessProfile): void {
  // 1. Calculate Mileage Distribution
  const GOAL_RATIOS: Record<string, { long: number; easy: number }> = {
    "general": { long: 0.25, easy: 0.55 },
    "5k": { long: 0.25, easy: 0.50 },
    "10k": { long: 0.30, easy: 0.55 },
    "half-marathon": { long: 0.30, easy: 0.55 },
    "marathon": { long: 0.40, easy: 0.40 },
    "strength": { long: 0.15, easy: 0.75 },
  };

  let ratio = GOAL_RATIOS[profile.goal] || GOAL_RATIOS["general"];
  if (profile.runDaysPerWeek <= 3 && profile.goal !== "strength") {
    ratio = { long: 0.40, easy: 0.60 };
  }

  // Dynamic ratios for marathon based on current weekly mileage
  if (profile.goal === "marathon") {
    const weeklyMiles = profile.currentWeeklyMileage;
    if (weeklyMiles < 25) {
      ratio = { long: 0.40, easy: 0.40 };
    } else if (weeklyMiles < 35) {
      ratio = { long: 0.35, easy: 0.45 };
    } else if (weeklyMiles < 45) {
      ratio = { long: 0.32, easy: 0.48 };
    } else {
      ratio = { long: 0.28, easy: 0.52 };
    }
  }

  // Use pre-calculated long run if provided 
  let longRunMiles: number;
  
  if (profile.longRunLength !== undefined) {
    // Plan has pre-calculated the exact long run distance
    longRunMiles = profile.longRunLength;

    // Race week check
    if (longRunMiles === 0 && profile.weeksUntilRace === 1) {
      
      // All miles this week should be easy runs (no hard workouts in race week)
      const easyDayCount = profile.runDaysPerWeek;
      const milesPerEasy = roundToNearestQuarter(profile.currentWeeklyMileage / easyDayCount);
      
      // Distribute easy runs across all run days
      for (const day of profile.runDays) {
        days[day].workouts.push({
          type: "run",
          runType: "easy",
          miles: milesPerEasy
        });
      }
      
      return; // Exit early because we're done with this week
    }
  } else {
    // Calculate from ratio (for non-race or single-week plans)
    longRunMiles = profile.currentWeeklyMileage * ratio.long;
    
    // Apply minimums based on goal and weeks until race
    if (profile.weeksUntilRace !== undefined) {
      // Marathon minimums
      if (profile.goal === "marathon") {
        if (profile.weeksUntilRace === 3) {
          longRunMiles = Math.max(longRunMiles, 20);
        } else if (profile.weeksUntilRace === 4) {
          longRunMiles = Math.max(longRunMiles, 18);
        } else if (profile.weeksUntilRace >= 5 && profile.weeksUntilRace <= 8) {
          const minLong = 14 + (8 - profile.weeksUntilRace);
          longRunMiles = Math.max(longRunMiles, minLong);
        } else if (profile.weeksUntilRace >= 9 && profile.weeksUntilRace <= 12) {
          const minLong = 10 + (12 - profile.weeksUntilRace);
          longRunMiles = Math.max(longRunMiles, minLong);
        }
        longRunMiles = Math.min(longRunMiles, 20); // Cap at 20 miles
      }
      
      // Half marathon minimums
      else if (profile.goal === "half-marathon") {
        if (profile.weeksUntilRace === 3) {
          longRunMiles = Math.max(longRunMiles, 12);
        } else if (profile.weeksUntilRace === 4) {
          longRunMiles = Math.max(longRunMiles, 11);
        } else if (profile.weeksUntilRace >= 5 && profile.weeksUntilRace <= 7) {
          const minLong = 8 + (7 - profile.weeksUntilRace);
          longRunMiles = Math.max(longRunMiles, minLong);
        }
        longRunMiles = Math.min(longRunMiles, 13); // Cap at 13 miles
      }
      
      // 10k minimums
      else if (profile.goal === "10k") {
        if (profile.weeksUntilRace >= 2 && profile.weeksUntilRace <= 4) {
          const minLong = 8 + (4 - profile.weeksUntilRace);
          longRunMiles = Math.max(longRunMiles, minLong);
        }
        longRunMiles = Math.min(longRunMiles, 13); // Cap at 13 miles
      }
      
      // 5k minimums
      else if (profile.goal === "5k") {
        if (profile.weeksUntilRace >= 2 && profile.weeksUntilRace <= 4) {
          const minLong = 6 + (4 - profile.weeksUntilRace);
          longRunMiles = Math.max(longRunMiles, minLong);
        }
        longRunMiles = Math.min(longRunMiles, 10); // Cap at 10 miles
      }
    }
    
    // On build weeks, enforce minimum 1-mile increase from previous peak
    if (profile.weekType === "B" && profile.peakLongRunLength !== undefined) {
      longRunMiles = Math.max(longRunMiles, profile.peakLongRunLength + 1);
    }
  }
  
  // Round after ensuring minimum increase
  longRunMiles = Math.round(longRunMiles);

  // Update peak long run length only on build weeks
  if (profile.weekType === "B") {
    profile.peakLongRunLength = Math.max(profile.peakLongRunLength || 0, longRunMiles);
  }

  let workoutMiles = Math.round(profile.currentWeeklyMileage * (1 - ratio.long - ratio.easy));

  // Adjust for level
  let adjustment: number = Math.round(workoutMiles * 0.1); 
  if (profile.runningLevel == "beginner") { 
    workoutMiles -= Math.round(adjustment); 
  } else if (profile.runningLevel == "advanced") { 
    workoutMiles += Math.round(adjustment); 
  }
  workoutMiles = Math.max(0, workoutMiles);
  
  // Easy miles takes the remainder to ensure total mileage is exact
  let totalEasyMiles = profile.currentWeeklyMileage - longRunMiles - workoutMiles;

  // 2. Determine Day Counts
  let workoutDayCount: number; 
  if (profile.runDaysPerWeek >= 5) { 
    workoutDayCount = 2; 
  } else if (profile.runDaysPerWeek === 4) { 
    workoutDayCount = 1; 
  } else {
    workoutDayCount = 0;
  }
  let easyDayCount = Math.max(0, profile.runDaysPerWeek - workoutDayCount - 1);

  let milesPerWorkout = workoutDayCount > 0 ? roundToNearestQuarter(workoutMiles / workoutDayCount) : 0;
  let milesPerEasy = easyDayCount > 0 ? roundToNearestQuarter(totalEasyMiles / easyDayCount) : 0;

  // 3. Cap workout and easy miles to avoid over-assignment
  if (profile.goal == "general" || profile.goal == "strength") {
    if (milesPerWorkout > profile.currentWeeklyMileage * 0.15) {
      // Cap workout miles and reassign excess to easy runs
      const excess = milesPerWorkout - roundToNearestQuarter(profile.currentWeeklyMileage * 0.15);
      milesPerWorkout = roundToNearestQuarter(profile.currentWeeklyMileage * 0.15);
      totalEasyMiles += excess * workoutDayCount;
      milesPerEasy = easyDayCount > 0 ? roundToNearestQuarter(totalEasyMiles / easyDayCount) : 0;
    }
    if (milesPerEasy > profile.currentWeeklyMileage * 0.15 && profile.runDaysPerWeek >= 4) {
      // Cap easy miles
      milesPerEasy = roundToNearestQuarter(profile.currentWeeklyMileage * 0.15);
    }
  }
  if (profile.goal == "5k" || profile.goal == "10k") {
    if (milesPerWorkout > profile.currentWeeklyMileage * 0.18) {
      // Cap workout miles and reassign excess to easy runs
      const excess = milesPerWorkout - roundToNearestQuarter(profile.currentWeeklyMileage * 0.18);
      milesPerWorkout = roundToNearestQuarter(profile.currentWeeklyMileage * 0.18);
      totalEasyMiles += excess * workoutDayCount;
      milesPerEasy = easyDayCount > 0 ? roundToNearestQuarter(totalEasyMiles / easyDayCount) : 0;
    }
    if (milesPerEasy > profile.currentWeeklyMileage * 0.18 && profile.runDaysPerWeek >= 4) {
      // Cap easy miles
      milesPerEasy = roundToNearestQuarter(profile.currentWeeklyMileage * 0.18);
    }
  }
  if (profile.goal == "half-marathon" || profile.goal == "marathon") {
    if (milesPerWorkout > profile.currentWeeklyMileage * 0.20) {
      // Cap workout miles and reassign excess to easy runs
      const excess = milesPerWorkout - roundToNearestQuarter(profile.currentWeeklyMileage * 0.20);
      milesPerWorkout = roundToNearestQuarter(profile.currentWeeklyMileage * 0.20);
      totalEasyMiles += excess * workoutDayCount;
      milesPerEasy = easyDayCount > 0 ? roundToNearestQuarter(totalEasyMiles / easyDayCount) : 0;
    }
    if (milesPerEasy > profile.currentWeeklyMileage * 0.20 && profile.runDaysPerWeek >= 4) {
      // Cap easy miles
      milesPerEasy = roundToNearestQuarter(profile.currentWeeklyMileage * 0.20);
    }
  }

  // Enforce minimum easy run length at higher mileage
  if (profile.currentWeeklyMileage >= 50 && easyDayCount > 0) {
    const avgDaily = profile.currentWeeklyMileage / profile.runDaysPerWeek;
    const minEasy = roundToNearestQuarter(avgDaily * 0.6);

    if (milesPerEasy < minEasy) {
      milesPerEasy = minEasy;
    }
  }


  // 4. Assign Run Workouts
  let remainingWorkouts = workoutDayCount;
  let remainingEasy = easyDayCount;

  // Place Long Run
  if (profile.goal !== "strength") {
    days[profile.longRunDay].workouts.push({
      type: "run",
      runType: "long",
      miles: roundToNearestQuarter(longRunMiles),
    });
  } else {
    // For strength goal, assign an workout with remaining mileage
    days[profile.longRunDay].workouts.push({
      type: "run",
      runType: "workout",
      miles: roundToNearestQuarter(workoutMiles/(workoutDayCount > 0 ? workoutDayCount : 1)),
    });
  }

  // Distribute other runs
  let currentDay = (profile.longRunDay + 1) % 7;
  let lastDayWasWorkout = false;

  let safety = 0;
  while (currentDay !== profile.longRunDay && safety < 7) {
    if (profile.runDays.includes(currentDay)) {
      const isDayAfterLong = currentDay === (profile.longRunDay + 1) % 7;
      const isDayBeforeLong = ((currentDay + 1) % 7) === profile.longRunDay;

      // Force an easy run if:
      // 1. It's the day after a long run
      // 2. It's the day before a long run (taper rule)
      // 3. The day before was a hard workout (spacing rule)
      // 4. We simply have no workouts left to give
      if ((remainingEasy > 0 && isDayAfterLong) || (remainingEasy > 0 && isDayBeforeLong) || (remainingEasy > 0 && lastDayWasWorkout) || (remainingWorkouts === 0)) {     
        days[currentDay].workouts.push({ type: "run", runType: "easy", miles: milesPerEasy });
        remainingEasy--;
        lastDayWasWorkout = false; 
      } else if (remainingWorkouts > 0) {
        days[currentDay].workouts.push({ type: "run", runType: "workout", miles: milesPerWorkout });
        remainingWorkouts--;
        lastDayWasWorkout = true; 
      }
    } else {
      lastDayWasWorkout = false;
    }
    currentDay = (currentDay + 1) % 7;
    safety++;
  }
}

function assignLiftWorkouts(days: DailyPlan[], profile: FitnessProfile): void {
  const hasLongRun = profile.goal !== "strength";

  let totalLiftDays = profile.liftDaysPerWeek;

  // Only subtract if a long run exists AND overlaps a lift day
  const liftDaysIncludesLongRun =
    hasLongRun && profile.liftDays.includes(profile.longRunDay);

  if (liftDaysIncludesLongRun) {
    totalLiftDays -= 1;
  }

  const maxLowerDays =
    profile.goal === "marathon" ? 2 :
    totalLiftDays >= 4 ? Math.floor(totalLiftDays / 2) : 1;

  let liftsAssigned = 0;
  let lowerAssigned = 0;
  let lastLiftTypeByDay: Record<number, LiftType | null> = {};

  // Find all eligible lift days
  const eligibleLiftDays = profile.liftDays
    .filter(d => !hasLongRun || d !== profile.longRunDay)
    .sort((a, b) => {
      if (!hasLongRun) return a - b;

      // Sort to start from day after long run
      const aDistance = (a - profile.longRunDay + 7) % 7;
      const bDistance = (b - profile.longRunDay + 7) % 7;
      return aDistance - bDistance;
    });

  // PHASE 1: Assign all leg days first
  for (const currentDay of eligibleLiftDays) {
    if (lowerAssigned >= maxLowerDays) break;
    if (liftsAssigned >= totalLiftDays) break;

    const dayBeforeLong =
      hasLongRun &&
      days[(currentDay + 1) % 7]?.workouts.some(
        w => w.type === "run" && w.runType === "long"
      );

    const dayBeforeWorkout =
      days[(currentDay + 1) % 7]?.workouts.some(
        w => w.type === "run" && w.runType === "workout"
      );

    const yesterdayLift = lastLiftTypeByDay[(currentDay + 6) % 7] ?? null;
    const twoDaysAgoLift = lastLiftTypeByDay[(currentDay + 5) % 7] ?? null;

    const canAssignLower =
      !dayBeforeLong &&
      !dayBeforeWorkout &&
      yesterdayLift !== "legs" &&
      twoDaysAgoLift !== "legs";

    if (canAssignLower) {
      days[currentDay].workouts.push({
        type: "lift",
        liftType: "legs",
      });
      lastLiftTypeByDay[currentDay] = "legs";
      lowerAssigned++;
      liftsAssigned++;
    }
  }

  // PHASE 2: Assign push/pull for remaining days
  const upperRotation: LiftType[] = ["push", "pull"];
  let upperIndex = 0;

  for (const currentDay of eligibleLiftDays) {
    if (liftsAssigned >= totalLiftDays) break;

    // Skip if this day already has a lift
    if (lastLiftTypeByDay[currentDay]) continue;

    const yesterdayLift = lastLiftTypeByDay[(currentDay + 6) % 7] ?? null;

    const candidate = upperRotation[upperIndex % upperRotation.length];
    let assignedLift: LiftType;

    // Avoid back-to-back same lift type
    if (candidate === yesterdayLift) {
      assignedLift = upperRotation[(upperIndex + 1) % upperRotation.length];
      upperIndex += 2;
    } else {
      assignedLift = candidate;
      upperIndex++;
    }

    days[currentDay].workouts.push({
      type: "lift",
      liftType: assignedLift,
    });
    lastLiftTypeByDay[currentDay] = assignedLift;
    liftsAssigned++;
  }

  // PHASE 3: Convert push/pull to upper if imbalanced
  const pushCount = days.reduce(
    (sum, d) =>
      sum + d.workouts.filter(w => w.type === "lift" && w.liftType === "push").length,
    0
  );

  const pullCount = days.reduce(
    (sum, d) =>
      sum + d.workouts.filter(w => w.type === "lift" && w.liftType === "pull").length,
    0
  );

  // Convert to upper if one side is missing entirely
  if (pushCount === 0 && pullCount > 0) {
    days.forEach(d => {
      d.workouts = d.workouts.map(w =>
        w.type === "lift" && w.liftType === "pull"
          ? { type: "lift", liftType: "upper" }
          : w
      );
    });
  } else if (pullCount === 0 && pushCount > 0) {
    days.forEach(d => {
      d.workouts = d.workouts.map(w =>
        w.type === "lift" && w.liftType === "push"
          ? { type: "lift", liftType: "upper" }
          : w
      );
    });
  }
}

// --------------------------------
// Validation
// --------------------------------
function validateProfile(profile: FitnessProfile): void {
  // Must have at least one type of workout
  if (profile.runDaysPerWeek === 0 && profile.liftDaysPerWeek === 0) {
    throw new FitnessProfileError("Must have at least one run day or lift day per week.");
  }

  // Validate day arrays
  if (profile.runDaysPerWeek > 0) {
    validateDayArray(profile.runDays, "Run days");
  }
  if (profile.liftDaysPerWeek > 0) {
    validateDayArray(profile.liftDays, "Lift days");
  }

  // Running-specific validations
  if (profile.runDaysPerWeek > 0) {
    // Check for zero mileage
    if (profile.currentWeeklyMileage <= 0) {
      throw new FitnessProfileError("Weekly mileage must be greater than zero when running days are scheduled.");
    }

    // Enforce minimum run days based on goal
    if (profile.goal !== "strength" && profile.runDaysPerWeek < 4) {
      throw new FitnessProfileError("For running-focused goals, at least 4 run days per week are required.");
    }

    // Enforce minimum run days based on weekly mileage
    if (profile.currentWeeklyMileage >= 50 && profile.runDaysPerWeek < 5) {
      throw new FitnessProfileError("For weekly mileage of 50 or more, at least 5 run days per week are required.");
    }
    if (profile.currentWeeklyMileage >= 65 && profile.runDaysPerWeek < 6) {
      throw new FitnessProfileError("For weekly mileage of 65 or more, at least 6 run days per week are required.");
    }

    // Validate that long run day is within run days for non-strength goals
    if (profile.goal !== "strength" && !profile.runDays.includes(profile.longRunDay)) {
      throw new FitnessProfileError("Long run day must be one of the selected run days.");
    }

    // Validate that number of selected run days matches runDaysPerWeek
    if (profile.runDays.length !== profile.runDaysPerWeek) {
      throw new FitnessProfileError("Number of selected run days does not match run days per week.");
    }

    // Don't allow lift on long run day for running-focused goals
    if (profile.liftDaysPerWeek > 0 && profile.goal !== "strength" && profile.goal !== "general" && profile.liftDays.includes(profile.longRunDay)) {
      throw new FitnessProfileError("Lift days cannot include the long run day for running-focused goals.");
    }
  }

  // Lifting-specific validations
  if (profile.liftDaysPerWeek > 0) {
    // Enforce minimum lift days if strength goal
    if (profile.goal === "strength" && profile.liftDaysPerWeek < 3) {
      throw new FitnessProfileError("For strength goal, at least 3 lift days per week are required.");
    }

    // Enforce maximum lift days based on goal
    if (profile.runDaysPerWeek > 0 && profile.goal !== "strength" && profile.goal !== "general" && profile.liftDaysPerWeek > 4) {
      throw new FitnessProfileError("For running-focused goals, no more than 4 lift days per week are allowed.");
    }
    if ((profile.goal === "half-marathon" || profile.goal === "marathon") && profile.runDaysPerWeek > 0) {
      if (profile.currentWeeklyMileage >= 50 && profile.liftDaysPerWeek > 3) {
        throw new FitnessProfileError("For half-marathon/marathon goals with weekly mileage of 50 or more, no more than 3 lift days per week are allowed.");
      }
      if (profile.currentWeeklyMileage >= 65 && profile.liftDaysPerWeek > 2) {
        throw new FitnessProfileError("For half-marathon/marathon goals with weekly mileage of 65 or more, no more than 2 lift days per week are allowed.");
      }
    }

    // Validate that number of selected lift days matches liftDaysPerWeek
    if (profile.liftDays.length !== profile.liftDaysPerWeek) {
      throw new FitnessProfileError("Number of selected lift days does not match lift days per week.");
    }
  }

  // Enforce maximum run days and maximum lift days to be less than 7
  if (profile.runDaysPerWeek > 6) {
    throw new FitnessProfileError("Total of run days per week cannot exceed 6.");
  }
  if (profile.liftDaysPerWeek > 6) {
    throw new FitnessProfileError("Total of lift days per week cannot exceed 6.");
  }
}

function validateDayArray(days: number[], label: string): void {
  // Check for duplicates and valid range
  const unique = new Set(days);
  if (unique.size !== days.length) {
    throw new FitnessProfileError(`${label} must not contain duplicate days.`);
  }
  for (const d of days) {
    if (d < 0 || d > 6) {
      throw new FitnessProfileError(`${label} must contain values between 0 and 6.`);
    }
  }
}

// --------------------------------
// Utilities
// --------------------------------
export function roundToNearestQuarter(num: number): number {
  return Math.round(num * 4) / 4;
}

export class FitnessProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FitnessProfileError";
  }
}