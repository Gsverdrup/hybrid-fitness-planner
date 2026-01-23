import { FitnessProfile } from "../domain/fitnessProfile";
import { DailyPlan, WeeklyPlan, RunWorkout, LiftType } from "../domain/weeklyPlan";
import e from "express";

export function generateWeeklyPlan(
  profile: FitnessProfile
): WeeklyPlan {
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

  const milesPerWorkout = workoutDayCount > 0 ? Number((workoutMiles / workoutDayCount).toFixed(1)) : 0;
  const milesPerEasy = easyDayCount > 0 ? Number((totalEasyMiles / easyDayCount).toFixed(1)) : 0;

  // 3. Assign Run Workouts
  let remainingWorkouts = workoutDayCount;
  let remainingEasy = easyDayCount;

  // Place Long Run
  days[profile.longRunDay].workouts.push({
    type: "run",
    runType: "long",
    miles: longRunMiles,
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


  // 4. Assign lifts
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
