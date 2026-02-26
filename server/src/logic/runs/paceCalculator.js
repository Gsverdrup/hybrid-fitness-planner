import { FitnessProfileError } from "../plans/planGenerator";
import { generateRunSegments } from "./runDetailGenerator";
const MILE_IN_KM = 1.60934;
export function applyPacesToPlan(racePlan, profile) {
    populatePaceChart(profile);
    if (!profile.paceChart) {
        throw new FitnessProfileError("Pace chart must be populated after calling populatePaceChart.");
    }
    // Calculate improvement factor based on profile to adjust paces for workout days
    const totalImprovement = calculatePaceImprovementDelta(profile);
    // Female runners often see greater improvement in longer threshold efforts 
    // and less improvement in shorter interval efforts
    const thresholdResponsiveness = profile.sex === "female" ? 1.05 : 1.0;
    const intervalResponsiveness = profile.sex === "female" ? 0.95 : 1.0;
    // Spread improvement across build weeks
    const buildWeeks = racePlan.filter(week => week.weekType === "B").length;
    const improvementPerBuildWeek = buildWeeks > 0 ? totalImprovement / buildWeeks : 0;
    let buildWeekIndex = 0;
    let workoutRotation = ["classic-tempo", "400m", "cruise-tempo", "800m", "progressive-tempo", "ladder"];
    let workoutIndex = 0;
    let longRunRotation = ["easy", "fast-finish", "marathon-pace"];
    let longRunIndex = 0;
    for (let weekIdx = 0; weekIdx < racePlan.length; weekIdx++) {
        const weekPlan = racePlan[weekIdx];
        const weeklyMultiplier = 1 + improvementPerBuildWeek * buildWeekIndex;
        // Compute weekly pace multipliers
        const thresholdMultiplier = weeklyMultiplier * thresholdResponsiveness;
        const intervalMultiplier = weeklyMultiplier * intervalResponsiveness;
        let runDays = weekPlan.days.filter(day => day.workouts.some(w => w.type === "run"));
        for (const day of runDays) {
            let run = day.workouts.find(w => w.type === "run");
            if (!run)
                continue;
            // Race week: All runs are easy pace
            if (weekIdx === racePlan.length - 1) {
                run.paceMinPerMile = profile.paceChart.easyRun;
                continue;
            }
            if (run.runType === "easy") {
                run.paceMinPerMile = profile.paceChart.easyRun;
                generateRunSegments(profile, run);
            }
            else if (run.runType === "workout") {
                // Alternate between tempo and interval paces for workout days
                if (workoutRotation[workoutIndex % workoutRotation.length] === "classic-tempo"
                    || workoutRotation[workoutIndex % workoutRotation.length] === "cruise-tempo"
                    || workoutRotation[workoutIndex % workoutRotation.length] === "progressive-tempo") {
                    run.paceMinPerMile = profile.paceChart.thresholdRun / thresholdMultiplier;
                    generateRunSegments(profile, run, workoutRotation[workoutIndex % workoutRotation.length]);
                }
                else {
                    run.paceMinPerMile = profile.paceChart.intervalRun / intervalMultiplier;
                    generateRunSegments(profile, run, workoutRotation[workoutIndex % workoutRotation.length]);
                }
                workoutIndex++;
            }
            else if (run.runType === "long") {
                // Long runs are done at easy pace, but advanced runners can run these faster
                const longRunPace = profile.runningLevel === "advanced"
                    ? profile.paceChart.easyRun * 0.97 // Advanced: 3% faster than easy
                    : profile.paceChart.easyRun;
                run.paceMinPerMile = longRunPace;
                generateRunSegments(profile, run, undefined, longRunRotation[longRunIndex % longRunRotation.length]);
                longRunIndex++;
            }
            else {
                throw new FitnessProfileError(`Unknown run type: ${run.runType}`);
            }
        }
        // Only progress fitness during build weeks
        if (weekPlan.weekType === "B") {
            buildWeekIndex++;
        }
    }
}
export function populatePaceChart(profile) {
    if (!profile.providedRaceTime) {
        throw new FitnessProfileError("Provided race time is required to populate pace chart.");
    }
    // Use 5k as the anchor distance for the pace chart
    const pace5k = calculateRacePace(profile, 5);
    // Ensure easy run isn't faster than marathon pace
    const easyFrom5k = pace5k * 1.25;
    const easyFromMarathon = calculateRacePace(profile, 42.195) + 0.5;
    profile.paceChart = {
        race1Mile: calculateRacePace(profile, MILE_IN_KM),
        race5k: calculateRacePace(profile, 5),
        race10k: calculateRacePace(profile, 10),
        raceHalfMarathon: calculateRacePace(profile, 13.1094 * MILE_IN_KM),
        raceMarathon: calculateRacePace(profile, 42.195 * MILE_IN_KM),
        easyRun: Math.max(easyFrom5k, easyFromMarathon),
        thresholdRun: pace5k + 0.25, // 15 seconds per mile slower than 5k pace
        intervalRun: pace5k - 0.15, // 9 seconds per mile faster than 5k pace
    };
}
function calculateRacePace(profile, outputDistanceKm) {
    // Returns pace in minutes per mile for the given distance based on the provided race
    if (profile.providedRaceTime === undefined) {
        throw new FitnessProfileError("Provided race time is required to calculate race pace.");
    }
    if (profile.providedRaceTime.distanceKm <= 0) {
        throw new FitnessProfileError("Distance must be greater than zero.");
    }
    if (profile.providedRaceTime.timeMinutes <= 0) {
        throw new FitnessProfileError("Time must be greater than zero.");
    }
    const inputDistanceKm = profile.providedRaceTime.distanceKm;
    const inputTimeMinutes = profile.providedRaceTime.timeMinutes;
    const distanceRatio = outputDistanceKm / inputDistanceKm;
    // Choose exponent based on distance ratio, not goal
    let exponent = 1.06; // Standard Riegel
    if (distanceRatio > 4) {
        // Predicting much longer (e.g., 5k → marathon)
        exponent = 1.08;
    }
    else if (distanceRatio > 2) {
        // Moderate jump (e.g., 10k → marathon)
        exponent = 1.07;
    }
    else if (distanceRatio < 0.25) {
        // Predicting much shorter (e.g., marathon → 5k)
        exponent = 1.05;
    }
    // Riegel's formula: T2 = T1 * (D2 / D1)^exponent
    let predictedTime = inputTimeMinutes * Math.pow(distanceRatio, exponent);
    const paceMinPerMile = predictedTime / (outputDistanceKm / MILE_IN_KM); // Convert km to miles
    return paceMinPerMile;
}
function calculatePaceImprovementDelta(profile) {
    let improvementFactor;
    // Based on runner's experience level
    switch (profile.runningLevel) {
        case "beginner":
            improvementFactor = 0.08;
            break;
        case "intermediate":
            improvementFactor = 0.04;
            break;
        case "advanced":
            improvementFactor = 0.02;
            break;
        default:
            improvementFactor = 0.02;
    }
    // Adjust based on current weekly mileage
    if (profile.startingWeeklyMileage >= 45) {
        improvementFactor *= 0.8;
    }
    else if (profile.startingWeeklyMileage >= 30) {
        improvementFactor *= 0.9;
    }
    else if (profile.startingWeeklyMileage >= 20) {
        improvementFactor *= 1.0;
    }
    else {
        improvementFactor *= 1.1;
    }
    // Adjust based on length of plan
    if (profile.trainingLengthWeeks >= 20) {
        improvementFactor *= 1.03;
    }
    else if (profile.trainingLengthWeeks >= 18) {
        improvementFactor *= 1.00;
    }
    else if (profile.trainingLengthWeeks >= 16) {
        improvementFactor *= 0.97;
    }
    else if (profile.trainingLengthWeeks >= 14) {
        improvementFactor *= 0.88;
    }
    else if (profile.trainingLengthWeeks >= 12) {
        improvementFactor *= 0.75;
    }
    else if (profile.trainingLengthWeeks >= 10) {
        improvementFactor *= 0.60;
    }
    else {
        improvementFactor *= 0.45;
    }
    // Adjust based on training days per week
    if (profile.runDaysPerWeek <= 3) {
        improvementFactor *= 0.85;
    }
    else if (profile.runDaysPerWeek >= 6) {
        improvementFactor *= 1.05;
    }
    else {
        improvementFactor *= 1.0;
    }
    // Adjust based on age, older runners typically see less improvement from training
    if (profile.age < 30) {
        improvementFactor *= 1.0;
    }
    else if (profile.age < 40) {
        improvementFactor *= 0.95;
    }
    else if (profile.age < 50) {
        improvementFactor *= 0.90;
    }
    else if (profile.age < 60) {
        improvementFactor *= 0.85;
    }
    else {
        improvementFactor *= 0.80;
    }
    // Cap improvement factor at 8%
    improvementFactor = Math.min(improvementFactor, 0.08);
    return improvementFactor;
}
