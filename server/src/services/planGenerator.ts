import { FitnessProfile } from "../domain/fitnessProfile";
import { DailyPlan, WeeklyPlan, RunWorkout, LiftType } from "../domain/weeklyPlan";

export function generateWeeklyPlan(
  profile: FitnessProfile
): WeeklyPlan {
  // Check for zero mileage
  if (profile.currentWeeklyMileage <= 0) {
    throw new FitnessProfileError("Weekly mileage must be greater than zero to generate a plan.");
  }

  // Enforce minimum run days based on weekly mileage
  if (profile.currentWeeklyMileage >= 40 && profile.runDaysPerWeek < 5) {
    throw new FitnessProfileError("For weekly mileage of 40 or more, at least 5 run days per week are required.");
  }
  if (profile.currentWeeklyMileage >= 55 && profile.runDaysPerWeek < 6) {
    throw new FitnessProfileError("For weekly mileage of 55 or more, at least 6 run days per week are required.");
  }

  // Enforce minimum lift days if strength goal
  if (profile.goal === "strength" && profile.liftDaysPerWeek < 3) {
    throw new FitnessProfileError("For strength goal, at least 3 lift days per week are required.");
  }

  // Initialize empty week
  const days: DailyPlan[] = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    workouts: [],
  }));


  // 1. Calculate Mileage Distribution
  const GOAL_RATIOS: Record<string, { long: number; easy: number }> = {
    "general": { long: 0.25, easy: 0.55 },
    "5k": { long: 0.25, easy: 0.50 },
    "10k": { long: 0.30, easy: 0.55 },
    "half-marathon": { long: 0.30, easy: 0.55 },
    "marathon": { long: 0.30, easy: 0.60 },
    "strength": { long: 0.15, easy: 0.75 },
  };

  const ratio = GOAL_RATIOS[profile.goal] || GOAL_RATIOS["general"];
  
  let longRunMiles = Math.round(profile.currentWeeklyMileage * ratio.long);
  let workoutMiles = Math.round(profile.currentWeeklyMileage * (1 - ratio.long - ratio.easy));

  // Adjust for level
  let adjustment: number = Math.round(workoutMiles * 0.1); 
  if (profile.runningLevel == "beginner") { 
    workoutMiles -= Math.round(adjustment); 
  } else if (profile.runningLevel == "advanced") { 
    workoutMiles += Math.round(adjustment); 
  }
  
  // Easy miles takes the remainder to ensure total mileage is exact
  let totalEasyMiles = profile.currentWeeklyMileage - longRunMiles - workoutMiles;

  // 2. Determine Day Counts
  let workoutDayCount: number; 
  if (profile.runDaysPerWeek >= 5) { 
    workoutDayCount = 2; 
  } else { 
    workoutDayCount = 1; 
  }
  const easyDayCount = Math.max(0, profile.runDaysPerWeek - workoutDayCount - 1);

  let milesPerWorkout = workoutDayCount > 0 ? roundToNearestQuarter(workoutMiles / workoutDayCount) : 0;
  let milesPerEasy = easyDayCount > 0 ? roundToNearestQuarter(totalEasyMiles / easyDayCount) : 0;

  // 3. Cap workout and easy miles to avoid over-assignment
  if (profile.runningLevel == "beginner" || profile.goal == "general" || profile.goal == "strength") {
    if (milesPerWorkout > profile.currentWeeklyMileage * 0.15) {
      // Cap workout miles and reassign excess to easy runs
      const excess = milesPerWorkout - roundToNearestQuarter(profile.currentWeeklyMileage * 0.15);
      milesPerWorkout = roundToNearestQuarter(profile.currentWeeklyMileage * 0.15);
      totalEasyMiles += excess * workoutDayCount;
      milesPerEasy = easyDayCount > 0 ? roundToNearestQuarter(totalEasyMiles / easyDayCount) : 0;
    }
    if (milesPerEasy > profile.currentWeeklyMileage * 0.15) {
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
    if (milesPerEasy > profile.currentWeeklyMileage * 0.18) {
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
    if (milesPerEasy > profile.currentWeeklyMileage * 0.20) {
      // Cap easy miles
      milesPerEasy = roundToNearestQuarter(profile.currentWeeklyMileage * 0.20);
    }
  }

  // Clamp miles per easy run to be less than long run miles
  if (milesPerEasy >= longRunMiles) {
    milesPerEasy = roundToNearestQuarter(longRunMiles * 0.75);
    totalEasyMiles = milesPerEasy * easyDayCount;
  }


  // 4. Assign Run Workouts
  let remainingWorkouts = workoutDayCount;
  let remainingEasy = easyDayCount;

  // Place Long Run
  days[profile.longRunDay].workouts.push({
    type: "run",
    runType: "long",
    miles: roundToNearestQuarter(longRunMiles),
  });

  // Distribute other runs
  let currentDay = (profile.longRunDay + 1) % 7;
  let lastDayWasWorkout = false;

  while (currentDay !== profile.longRunDay) {
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
    }
    currentDay = (currentDay + 1) % 7;
  }


  // 5. Assign lifts
  const liftDays = [...profile.liftDays];
  const totalLiftDays = profile.liftDaysPerWeek;

  // Track what we've assigned to maintain split balance
  let lowerDaysAssigned = 0;
  let upperSequenceIndex = 0; 

  for (const dayIdx of liftDays) {
    const hasWorkoutRun = days[dayIdx].workouts.some(w => w.type === "run" && w.runType === "workout");
    const hasLongRun = days[dayIdx].workouts.some(w => w.type === "run" && w.runType === "long");
    
    let assignedLift: LiftType = "full-body";

    // Priority 1: Match Lower Body with Workout Runs
    if (hasWorkoutRun && totalLiftDays >= 4) {
      assignedLift = "lower";
      lowerDaysAssigned++;
    } 
    // Priority 2: Handle High-Frequency Splits (6 Days)
    else if (totalLiftDays >= 6) {
      // PPL logic but avoiding 'lower' on non-workout/long-run days if possible
      const pplSequence: LiftType[] = ["push", "pull"]; 
      assignedLift = pplSequence[upperSequenceIndex % pplSequence.length];
      upperSequenceIndex++;
    }
    // Priority 3: Handle Standard Splits (4-5 Days)
    else if (totalLiftDays >= 4) {
      // If we haven't assigned enough lower body days yet (usually 2 for a 4-day split)
      const needsLower = lowerDaysAssigned < Math.floor(totalLiftDays / 2);
      
      if (needsLower && !hasLongRun) {
        assignedLift = "lower";
        lowerDaysAssigned++;
      } else {
        assignedLift = "upper";
      }
    }
    // Priority 4: Low Frequency
    else {
      assignedLift = "full-body";
    }

    // Safety check: Avoid lower body lifts on long run days
    if (assignedLift === "lower" && hasLongRun) {
      assignedLift = "upper";
    }

    days[dayIdx].workouts.push({
      type: "lift",
      liftType: assignedLift,
    });
  }

  return { days };
}

function roundToNearestQuarter(num: number): number {
  return Math.round(num * 4) / 4;
}

class FitnessProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FitnessProfileError";
  }
}