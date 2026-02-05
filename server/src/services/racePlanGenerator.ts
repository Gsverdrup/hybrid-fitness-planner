import { generateWeeklyPlan, FitnessProfileError } from "./planGenerator";
import { FitnessProfile, weekType } from "../domain/fitnessProfile";
import { WeeklyPlan } from "../domain/weeklyPlan";

export function generateMarathonPlan(profile: FitnessProfile): WeeklyPlan[] {
    // Validation
    if (profile.startingWeeklyMileage > 40) {
        throw new FitnessProfileError("Starting weekly mileage exceeds the maximum allowed for marathon plans (40 miles).");
    }

    if (profile.trainingLengthWeeks < 12 || profile.trainingLengthWeeks > 20) {
        throw new FitnessProfileError("Marathon training plans must be between 12 and 20 weeks.");
    }

    if (profile.startingWeeklyMileage < 15 && profile.trainingLengthWeeks < 16) {
        throw new FitnessProfileError("For marathon plans shorter than 16 weeks, starting weekly mileage must be at least 15 miles.");
    }

    const weekPatternsByWeeks: Record<number, string> = {
        12: "BBBDBBBDBBTT",
        13: "BBBBDBBBDBBTT",
        14: "BBBDBBBDBBBBTT",
        15: "BBBBDBBBDBBBBTT",
        16: "BBBBDBBBBDBBBBTT",
        17: "BBBBDBBBBDBBBBBTT",
        18: "BBBBDBBBDBBBDBBBBTT",
        19: "BBBBDBBBDBBBBDBBBBTT",
        20: "BBBBDBBBDBBBBDBBBBBTT",
    };
    const weekPattern = weekPatternsByWeeks[profile.trainingLengthWeeks];

    // Calculate number of week types
    const buildWeeks = (weekPattern.match(/B/g) || []).length;
    const deloadWeeks = (weekPattern.match(/D/g) || []).length;
    const taperWeeks = (weekPattern.match(/T/g) || []).length;

    // Ensure minimum starting mileage
    if (profile.startingWeeklyMileage < 15) {
        profile.startingWeeklyMileage = 15;
    }

    // Calculate target peak mileage 
    const targetPeakMileage = calculateTargetPeakMileage(
        profile.startingWeeklyMileage,
        profile.trainingLengthWeeks,
        profile.runningLevel
    );

    // Set deload factor based on runner level
    const deloadFactor = profile.runningLevel === "beginner" ? 0.75 :
                        profile.runningLevel === "intermediate" ? 0.80 : 0.85;

    // Pre-calculate all weekly mileages and long runs (working backwards)
    const weeklyMileages: number[] = [];
    const longRunLengths: number[] = [];
    
    let lastBuildWeekMileage = targetPeakMileage;
    let buildWeekIndex = buildWeeks - 1; // Start from last build week

    // Work backwards through the plan
    for (let week = profile.trainingLengthWeeks - 1; week >= 0; week--) {
        const weekType: weekType = weekPattern.charAt(week) as weekType;
        const weeksUntilRace = profile.trainingLengthWeeks - week;
        
        let weeklyMileage: number;
        let longRun: number;

        if (weeksUntilRace === 1) {
            // Race week: Very light, 12-18 miles (25% of peak), no long run
            weeklyMileage = Math.max(12, Math.min(18, lastBuildWeekMileage * 0.25));
            longRun = 0;
        } else if (weeksUntilRace === 2) {
            // 2 weeks out taper 
            weeklyMileage = lastBuildWeekMileage * 0.60;
            longRun = Math.min(12, weeklyMileage * 0.40); // 10-12 mile final long run
        } else if (weekType === 'B') {
            // Build week
            if (buildWeekIndex === buildWeeks - 1) {
                // Last build week before taper - use target peak
                weeklyMileage = targetPeakMileage;
            } else {
                // Calculate mileage based on progression from start to peak
                const progressRatio = buildWeekIndex / (buildWeeks - 1);
                weeklyMileage = profile.startingWeeklyMileage + 
                    (targetPeakMileage - profile.startingWeeklyMileage) * progressRatio;
            }
            
            // Calculate long run for this build week
            longRun = calculateLongRun(weeklyMileage, weeksUntilRace);
            
            lastBuildWeekMileage = weeklyMileage;
            buildWeekIndex--;
            
        } else if (weekType === 'D') {
            // Deload week 
            weeklyMileage = lastBuildWeekMileage * deloadFactor;
            longRun = weeklyMileage * 0.25; // Shorter long run on deload
            
        } else if (weekType === 'T') {
            // Generic taper week (shouldn't hit this with special handling above)
            weeklyMileage = lastBuildWeekMileage * 0.70;
            longRun = Math.min(10, weeklyMileage * 0.40);
        } else {
            weeklyMileage = profile.startingWeeklyMileage;
            longRun = weeklyMileage * 0.30;
        }

        // Round to nearest 0.5
        weeklyMileage = Math.round(weeklyMileage * 2) / 2;
        longRun = Math.round(longRun * 2) / 2;

        weeklyMileages.unshift(weeklyMileage);
        longRunLengths.unshift(longRun);
    }

    // Generate plan forward (now that we have all the numbers)
    const racePlan: WeeklyPlan[] = [];
    
    for (let week = 0; week < profile.trainingLengthWeeks; week++) {
        const weekType: weekType = weekPattern.charAt(week) as weekType;
        profile.weekType = weekType;
        profile.weeksUntilRace = profile.trainingLengthWeeks - week;
        profile.currentWeeklyMileage = weeklyMileages[week];
        profile.longRunLength = longRunLengths[week];

        const curWeek: WeeklyPlan = generateWeeklyPlan(profile);
        racePlan.push(curWeek);
    }

    return racePlan;
}

function calculateLongRun(weeklyMileage: number, weeksUntilRace: number): number {
    // Start with ratio-based calculation
    let longRun: number;
    
    if (weeklyMileage < 25) {
        longRun = weeklyMileage * 0.40;
    } else if (weeklyMileage < 35) {
        longRun = weeklyMileage * 0.35;
    } else if (weeklyMileage < 45) {
        longRun = weeklyMileage * 0.32;
    } else {
        longRun = weeklyMileage * 0.30;
    }

    // Enforce minimums based on weeks until race
    if (weeksUntilRace === 3) {
        longRun = Math.max(longRun, 20);
    } else if (weeksUntilRace === 4) {
        longRun = Math.max(longRun, 18);
    } else if (weeksUntilRace >= 5 && weeksUntilRace <= 8) {
        const minLong = 14 + (8 - weeksUntilRace);
        longRun = Math.max(longRun, minLong);
    } else if (weeksUntilRace >= 9 && weeksUntilRace <= 12) {
        const minLong = 10 + (12 - weeksUntilRace);
        longRun = Math.max(longRun, minLong);
    }

    // Cap at 20 miles max
    longRun = Math.min(longRun, 20);

    return longRun;
}

function calculateTargetPeakMileage(
    startingMileage: number,
    trainingWeeks: number,
    level: "beginner" | "intermediate" | "advanced"
): number {
    let basePeak: number;
    
    if (startingMileage < 20) {
        basePeak = trainingWeeks >= 18 ? 45 :
                   trainingWeeks >= 16 ? 42 :
                   trainingWeeks >= 14 ? 38 :
                   35;
    } else if (startingMileage < 30) {
        basePeak = trainingWeeks >= 18 ? 50 :
                   trainingWeeks >= 16 ? 48 :
                   trainingWeeks >= 14 ? 45 :
                   42;
    } else if (startingMileage < 35) {
        basePeak = trainingWeeks >= 16 ? 52 :
                   trainingWeeks >= 14 ? 50 :
                   48;
    } else {
        basePeak = trainingWeeks >= 14 ? 55 :
                   52;
    }

    // Adjust for runner level
    const levelMultiplier = level === "beginner" ? 0.92 :
                           level === "intermediate" ? 1.0 : 1.08;

    let targetPeak = basePeak * levelMultiplier;

    // Ensure minimum for 18-20 mile long runs
    const minPeakFor20MileLong = 50;
    const minPeakFor18MileLong = 45;
    
    if (trainingWeeks >= 16 && startingMileage >= 20) {
        targetPeak = Math.max(targetPeak, minPeakFor20MileLong);
    } else if (trainingWeeks >= 14 && startingMileage >= 15) {
        targetPeak = Math.max(targetPeak, minPeakFor18MileLong);
    }

    // Cap based on starting mileage
    const maxSafePeak = Math.min(60, startingMileage * 2.5);
    targetPeak = Math.min(targetPeak, maxSafePeak);

    // Never below starting
    targetPeak = Math.max(targetPeak, startingMileage);

    return Math.round(targetPeak * 2) / 2;
}