import { generateWeeklyPlan, FitnessProfileError } from "./planGenerator";
import { FitnessProfile, weekType } from "../../domain/fitnessProfile";
import { WeeklyPlan } from "../../domain/weeklyPlan";
import { applyPacesToPlan } from "../runs/paceCalculator";

// ------------------------------------------------------------
// MARATHON PLAN GENERATOR
// ------------------------------------------------------------
export function generateMarathonPlan(profile: FitnessProfile): WeeklyPlan[] {
    // Validation
    if (profile.startingWeeklyMileage > 40) {
        throw new FitnessProfileError("Starting weekly mileage exceeds the maximum allowed for marathon plans (40 miles).");
    }

    if (profile.trainingLengthWeeks < 12 || profile.trainingLengthWeeks > 20) {
        throw new FitnessProfileError("Marathon training plans must be between 12 and 20 weeks.");
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
    const targetPeakMileage = calculateTargetPeakMileageMarathon(
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
            longRun = calculateMarathonLongRun(weeklyMileage, weeksUntilRace);
            
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

        let curWeek: WeeklyPlan = generateWeeklyPlan(profile);
        curWeek.weekType = weekType;
        racePlan.push(curWeek);
    }

    // Add paces to the plan
    applyPacesToPlan(racePlan, profile);

    return racePlan;
}

function calculateMarathonLongRun(weeklyMileage: number, weeksUntilRace: number): number {
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

function calculateTargetPeakMileageMarathon(
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

// ------------------------------------------------------------
// HALF-MARATHON PLAN GENERATOR
// ------------------------------------------------------------
export function generateHalfMarathonPlan(profile: FitnessProfile): WeeklyPlan[] {
    // Validation
    if (profile.startingWeeklyMileage > 45) {
        throw new FitnessProfileError("Starting weekly mileage exceeds maximum for half marathon plans (45 miles).");
    }

    if (profile.trainingLengthWeeks < 10 || profile.trainingLengthWeeks > 16) {
        throw new FitnessProfileError("Half marathon training plans must be between 10 and 16 weeks.");
    }

    // Week patterns - similar to marathon but shorter
    const weekPatternsByWeeks: Record<number, string> = {
        10: "BBBDBBBDTT",
        11: "BBBBDBBBBTT",
        12: "BBBDBBBDBBTT",
        13: "BBBBDBBBDBBTT",
        14: "BBBDBBBDBBBBTT",
        15: "BBBBDBBBDBBBTT",
        16: "BBBBDBBBBDBBBBTT",
    };
    const weekPattern = weekPatternsByWeeks[profile.trainingLengthWeeks];

    const buildWeeks = (weekPattern.match(/B/g) || []).length;

    if (profile.startingWeeklyMileage < 12) {
        profile.startingWeeklyMileage = 12;
    }

    const targetPeakMileage = calculateTargetPeakHalfMarathon(
        profile.startingWeeklyMileage,
        profile.trainingLengthWeeks,
        profile.runningLevel
    );

    const deloadFactor = profile.runningLevel === "beginner" ? 0.75 :
                        profile.runningLevel === "intermediate" ? 0.80 : 0.85;

    const weeklyMileages: number[] = [];
    const longRunLengths: number[] = [];
    
    let lastBuildWeekMileage = targetPeakMileage;
    let buildWeekIndex = buildWeeks - 1;

    // Work backwards
    for (let week = profile.trainingLengthWeeks - 1; week >= 0; week--) {
        const weekType: weekType = weekPattern.charAt(week) as weekType;
        const weeksUntilRace = profile.trainingLengthWeeks - week;
        
        let weeklyMileage: number;
        let longRun: number;

        // Race week
        if (weeksUntilRace === 1) {
            weeklyMileage = Math.max(10, lastBuildWeekMileage * 0.30);
            longRun = 0;
            
        // Week before race (2 weeks out)
        } else if (weeksUntilRace === 2) {
            weeklyMileage = lastBuildWeekMileage * 0.60;
            longRun = Math.min(10, weeklyMileage * 0.40);
            
        } else if (weekType === 'B') {
            if (buildWeekIndex === buildWeeks - 1) {
                weeklyMileage = targetPeakMileage;
            } else {
                const progressRatio = buildWeekIndex / (buildWeeks - 1);
                weeklyMileage = profile.startingWeeklyMileage + 
                    (targetPeakMileage - profile.startingWeeklyMileage) * progressRatio;
            }
            
            longRun = calculateHalfMarathonLongRun(weeklyMileage, weeksUntilRace);
            
            lastBuildWeekMileage = weeklyMileage;
            buildWeekIndex--;
            
        } else if (weekType === 'D') {
            weeklyMileage = lastBuildWeekMileage * deloadFactor;
            longRun = weeklyMileage * 0.25;
            
        } else if (weekType === 'T') {
            // Generic taper (shouldn't hit with special handling above)
            weeklyMileage = lastBuildWeekMileage * 0.70;
            longRun = Math.min(8, weeklyMileage * 0.35);
        } else {
            weeklyMileage = profile.startingWeeklyMileage;
            longRun = weeklyMileage * 0.30;
        }

        weeklyMileage = Math.round(weeklyMileage * 2) / 2;
        longRun = Math.round(longRun * 2) / 2;

        weeklyMileages.unshift(weeklyMileage);
        longRunLengths.unshift(longRun);
    }

    // Generate plan forward
    const racePlan: WeeklyPlan[] = [];
    
    for (let week = 0; week < profile.trainingLengthWeeks; week++) {
        const weekType: weekType = weekPattern.charAt(week) as weekType;
        profile.weekType = weekType;
        profile.weeksUntilRace = profile.trainingLengthWeeks - week;
        profile.currentWeeklyMileage = weeklyMileages[week];
        profile.longRunLength = longRunLengths[week];

        let curWeek: WeeklyPlan = generateWeeklyPlan(profile);
        curWeek.weekType = weekType;
        racePlan.push(curWeek);
    }

    // Add paces to the plan
    applyPacesToPlan(racePlan, profile);

    return racePlan;
}

function calculateHalfMarathonLongRun(weeklyMileage: number, weeksUntilRace: number): number {
    // Half marathon long runs: 30-35% of weekly mileage
    // Peak at 10-13 miles (don't need to run full race distance in training)
    let longRun: number;
    
    if (weeklyMileage < 25) {
        longRun = weeklyMileage * 0.35;
    } else if (weeklyMileage < 35) {
        longRun = weeklyMileage * 0.32;
    } else {
        longRun = weeklyMileage * 0.30;
    }

    // Progressive minimums for half marathon
    if (weeksUntilRace === 3) {
        longRun = Math.max(longRun, 12); // Peak long run 3 weeks out
    } else if (weeksUntilRace === 4) {
        longRun = Math.max(longRun, 11);
    } else if (weeksUntilRace >= 5 && weeksUntilRace <= 7) {
        const minLong = 8 + (7 - weeksUntilRace); // 8, 9, 10 miles
        longRun = Math.max(longRun, minLong);
    } else if (weeksUntilRace >= 8 && weeksUntilRace <= 10) {
        const minLong = 6 + (10 - weeksUntilRace); // 6, 7, 8 miles
        longRun = Math.max(longRun, minLong);
    }

    // Cap at 13 miles (no need to run full 13.1 in training)
    longRun = Math.min(longRun, 13);

    return longRun;
}

function calculateTargetPeakHalfMarathon(
    startingMileage: number,
    trainingWeeks: number,
    level: "beginner" | "intermediate" | "advanced"
): number {
    let basePeak: number;
    
    // Half marathon needs moderate volume
    if (startingMileage < 15) {
        basePeak = trainingWeeks >= 14 ? 32 :
                   trainingWeeks >= 12 ? 30 :
                   28;
    } else if (startingMileage < 25) {
        basePeak = trainingWeeks >= 14 ? 40 :
                   trainingWeeks >= 12 ? 38 :
                   35;
    } else if (startingMileage < 35) {
        basePeak = trainingWeeks >= 14 ? 45 :
                   trainingWeeks >= 12 ? 43 :
                   40;
    } else {
        basePeak = trainingWeeks >= 12 ? 50 :
                   48;
    }

    const levelMultiplier = level === "beginner" ? 0.92 :
                           level === "intermediate" ? 1.0 : 1.10;

    let targetPeak = basePeak * levelMultiplier;

    // Ensure minimum for 12-13 mile long runs
    if (trainingWeeks >= 12 && startingMileage >= 15) {
        targetPeak = Math.max(targetPeak, 38); // Need ~38 miles for 12-mile long run
    }

    const maxSafePeak = Math.min(55, startingMileage * 2.3);
    targetPeak = Math.min(targetPeak, maxSafePeak);

    targetPeak = Math.max(targetPeak, startingMileage);

    return Math.round(targetPeak * 2) / 2;
}

// ------------------------------------------------------------
// 10K PLAN GENERATOR
// ------------------------------------------------------------
export function generate10kPlan(profile: FitnessProfile): WeeklyPlan[] {
    // Validation
    if (profile.startingWeeklyMileage > 50) {
        throw new FitnessProfileError("Starting weekly mileage exceeds maximum for 10k plans (50 miles).");
    }

    if (profile.trainingLengthWeeks < 8 || profile.trainingLengthWeeks > 14) {
        throw new FitnessProfileError("10k training plans must be between 8 and 14 weeks.");
    }

    // Week patterns
    const weekPatternsByWeeks: Record<number, string> = {
        8: "BBBDBBBT",
        9: "BBBBDBBBT",
        10: "BBBDBBBDBT",
        11: "BBBBDBBBDBT",
        12: "BBBBDBBBBDBT",
        13: "BBBDBBBDBBBBT",
        14: "BBBBDBBBBDBBBT",
    };
    const weekPattern = weekPatternsByWeeks[profile.trainingLengthWeeks];

    const buildWeeks = (weekPattern.match(/B/g) || []).length;

    if (profile.startingWeeklyMileage < 12) {
        profile.startingWeeklyMileage = 12;
    }

    const targetPeakMileage = calculateTargetPeak10k(
        profile.startingWeeklyMileage,
        profile.trainingLengthWeeks,
        profile.runningLevel
    );

    const deloadFactor = profile.runningLevel === "beginner" ? 0.70 :
                        profile.runningLevel === "intermediate" ? 0.75 : 0.80;

    const weeklyMileages: number[] = [];
    const longRunLengths: number[] = [];
    
    let lastBuildWeekMileage = targetPeakMileage;
    let buildWeekIndex = buildWeeks - 1;

    // Work backwards
    for (let week = profile.trainingLengthWeeks - 1; week >= 0; week--) {
        const weekType: weekType = weekPattern.charAt(week) as weekType;
        const weeksUntilRace = profile.trainingLengthWeeks - week;
        
        let weeklyMileage: number;
        let longRun: number;

        if (weeksUntilRace === 1) {
            // Race week: lighter than 5k, heavier than marathon (10k is middle distance)
            weeklyMileage = Math.max(10, lastBuildWeekMileage * 0.35);
            longRun = 0;
            
        } else if (weekType === 'B') {
            if (buildWeekIndex === buildWeeks - 1) {
                weeklyMileage = targetPeakMileage;
            } else {
                const progressRatio = buildWeekIndex / (buildWeeks - 1);
                weeklyMileage = profile.startingWeeklyMileage + 
                    (targetPeakMileage - profile.startingWeeklyMileage) * progressRatio;
            }
            
            longRun = calculate10kLongRun(weeklyMileage, weeksUntilRace);
            
            lastBuildWeekMileage = weeklyMileage;
            buildWeekIndex--;
            
        } else if (weekType === 'D') {
            weeklyMileage = lastBuildWeekMileage * deloadFactor;
            longRun = weeklyMileage * 0.25;
            
        } else if (weekType === 'T') {
            weeklyMileage = lastBuildWeekMileage * 0.60;
            longRun = Math.min(8, weeklyMileage * 0.35);
        } else {
            weeklyMileage = profile.startingWeeklyMileage;
            longRun = weeklyMileage * 0.30;
        }

        weeklyMileage = Math.round(weeklyMileage * 2) / 2;
        longRun = Math.round(longRun * 2) / 2;

        weeklyMileages.unshift(weeklyMileage);
        longRunLengths.unshift(longRun);
    }

    // Generate plan forward
    const racePlan: WeeklyPlan[] = [];
    
    for (let week = 0; week < profile.trainingLengthWeeks; week++) {
        const weekType: weekType = weekPattern.charAt(week) as weekType;
        profile.weekType = weekType;
        profile.weeksUntilRace = profile.trainingLengthWeeks - week;
        profile.currentWeeklyMileage = weeklyMileages[week];
        profile.longRunLength = longRunLengths[week];

        let curWeek: WeeklyPlan = generateWeeklyPlan(profile);
        curWeek.weekType = weekType;
        racePlan.push(curWeek);
    }

    // Add paces to the plan
    applyPacesToPlan(racePlan, profile);

    return racePlan;
}

function calculate10kLongRun(weeklyMileage: number, weeksUntilRace: number): number {
    // 10k long runs: 30-35% of weekly mileage
    let longRun: number;
    
    if (weeklyMileage < 20) {
        longRun = weeklyMileage * 0.35;
    } else if (weeklyMileage < 30) {
        longRun = weeklyMileage * 0.32;
    } else {
        longRun = weeklyMileage * 0.30;
    }

    // Progressive minimums
    if (weeksUntilRace >= 2 && weeksUntilRace <= 4) {
        const minLong = 8 + (4 - weeksUntilRace); // 8, 9, 10 miles
        longRun = Math.max(longRun, minLong);
    } else if (weeksUntilRace >= 5 && weeksUntilRace <= 8) {
        const minLong = 6 + (8 - weeksUntilRace); // 6, 7, 8, 9 miles
        longRun = Math.max(longRun, minLong);
    }

    // Cap at 13 miles (10k doesn't need marathon-length long runs)
    longRun = Math.min(longRun, 13);

    return longRun;
}

function calculateTargetPeak10k(
    startingMileage: number,
    trainingWeeks: number,
    level: "beginner" | "intermediate" | "advanced"
): number {
    let basePeak: number;
    
    if (startingMileage < 15) {
        basePeak = trainingWeeks >= 12 ? 28 :
                   trainingWeeks >= 10 ? 25 :
                   22;
    } else if (startingMileage < 25) {
        basePeak = trainingWeeks >= 12 ? 38 :
                   trainingWeeks >= 10 ? 35 :
                   32;
    } else if (startingMileage < 35) {
        basePeak = trainingWeeks >= 12 ? 45 :
                   trainingWeeks >= 10 ? 42 :
                   38;
    } else {
        basePeak = trainingWeeks >= 10 ? 50 :
                   48;
    }

    const levelMultiplier = level === "beginner" ? 0.90 :
                           level === "intermediate" ? 1.0 : 1.12;

    let targetPeak = basePeak * levelMultiplier;

    const maxSafePeak = Math.min(55, startingMileage * 2.2);
    targetPeak = Math.min(targetPeak, maxSafePeak);

    targetPeak = Math.max(targetPeak, startingMileage);

    return Math.round(targetPeak * 2) / 2;
}

// ------------------------------------------------------------
// 5K PLAN GENERATOR
// ------------------------------------------------------------
export function generate5kPlan(profile: FitnessProfile): WeeklyPlan[] {
    // Validation
    if (profile.startingWeeklyMileage > 50) {
        throw new FitnessProfileError("Starting weekly mileage exceeds maximum for 5k plans (50 miles).");
    }

    if (profile.trainingLengthWeeks < 8 || profile.trainingLengthWeeks > 12) {
        throw new FitnessProfileError("5k training plans must be between 8 and 12 weeks.");
    }

    // Week patterns - more frequent workouts for speed development
    const weekPatternsByWeeks: Record<number, string> = {
        8: "BBBDBBBT",      // Quick plan: 5 build, 1 deload, 2 build, 1 taper
        9: "BBBBDBBBT",     // 6 build, 1 deload, 2 build, 1 taper
        10: "BBBDBBBDBT",   // 7 build, 2 deload, 1 build, 1 taper
        11: "BBBBDBBBBDT",  // 8 build, 1 deload, 4 build, 1 deload, 1 taper
        12: "BBBBDBBBDBBT", // 8 build, 2 deload, 2 build, 1 taper
    };
    const weekPattern = weekPatternsByWeeks[profile.trainingLengthWeeks];

    const buildWeeks = (weekPattern.match(/B/g) || []).length;

    // Ensure minimum starting mileage
    if (profile.startingWeeklyMileage < 10) {
        profile.startingWeeklyMileage = 10;
    }

    // Calculate target peak (5k doesn't need super high volume)
    const targetPeakMileage = calculateTargetPeak5k(
        profile.startingWeeklyMileage,
        profile.trainingLengthWeeks,
        profile.runningLevel
    );

    // Set deload factor
    const deloadFactor = profile.runningLevel === "beginner" ? 0.70 :
                        profile.runningLevel === "intermediate" ? 0.75 : 0.80;

    // Pre-calculate all weekly mileages and long runs (working backwards)
    const weeklyMileages: number[] = [];
    const longRunLengths: number[] = [];
    
    let lastBuildWeekMileage = targetPeakMileage;
    let buildWeekIndex = buildWeeks - 1;

    // Work backwards through the plan
    for (let week = profile.trainingLengthWeeks - 1; week >= 0; week--) {
        const weekType: weekType = weekPattern.charAt(week) as weekType;
        const weeksUntilRace = profile.trainingLengthWeeks - week;
        
        let weeklyMileage: number;
        let longRun: number;

        // Race week special handling
        if (weeksUntilRace === 1) {
            // Race week: very light, mostly easy runs with one short shakeout
            weeklyMileage = Math.max(8, lastBuildWeekMileage * 0.40);
            longRun = 0; // No long run in race week
            
        } else if (weekType === 'B') {
            // Build week
            if (buildWeekIndex === buildWeeks - 1) {
                weeklyMileage = targetPeakMileage;
            } else {
                const progressRatio = buildWeekIndex / (buildWeeks - 1);
                weeklyMileage = profile.startingWeeklyMileage + 
                    (targetPeakMileage - profile.startingWeeklyMileage) * progressRatio;
            }
            
            // Long runs for 5k are shorter (25-30% of weekly mileage)
            longRun = calculate5kLongRun(weeklyMileage, weeksUntilRace);
            
            lastBuildWeekMileage = weeklyMileage;
            buildWeekIndex--;
            
        } else if (weekType === 'D') {
            // Deload week
            weeklyMileage = lastBuildWeekMileage * deloadFactor;
            longRun = weeklyMileage * 0.25;
            
        } else if (weekType === 'T') {
            // Shouldn't hit this (covered by race week), but fallback
            weeklyMileage = lastBuildWeekMileage * 0.60;
            longRun = Math.min(6, weeklyMileage * 0.30);
        } else {
            weeklyMileage = profile.startingWeeklyMileage;
            longRun = weeklyMileage * 0.25;
        }

        weeklyMileage = Math.round(weeklyMileage * 2) / 2;
        longRun = Math.round(longRun * 2) / 2;

        weeklyMileages.unshift(weeklyMileage);
        longRunLengths.unshift(longRun);
    }

    // Generate plan forward
    const racePlan: WeeklyPlan[] = [];
    
    for (let week = 0; week < profile.trainingLengthWeeks; week++) {
        const weekType: weekType = weekPattern.charAt(week) as weekType;
        profile.weekType = weekType;
        profile.weeksUntilRace = profile.trainingLengthWeeks - week;
        profile.currentWeeklyMileage = weeklyMileages[week];
        profile.longRunLength = longRunLengths[week];

        let curWeek: WeeklyPlan = generateWeeklyPlan(profile);
        curWeek.weekType = weekType;
        racePlan.push(curWeek);
    }

    // Add paces to the plan
    applyPacesToPlan(racePlan, profile);

    return racePlan;
}

function calculate5kLongRun(weeklyMileage: number, weeksUntilRace: number): number {
    // 5k long runs are shorter - focus is on speed, not endurance
    let longRun: number;
    
    // Base on 25-30% of weekly mileage
    if (weeklyMileage < 20) {
        longRun = weeklyMileage * 0.30;
    } else if (weeklyMileage < 35) {
        longRun = weeklyMileage * 0.27;
    } else {
        longRun = weeklyMileage * 0.25;
    }

    // Progressive minimums (much lower than marathon)
    if (weeksUntilRace >= 2 && weeksUntilRace <= 4) {
        const minLong = 6 + (4 - weeksUntilRace); // 6, 7, 8 miles
        longRun = Math.max(longRun, minLong);
    } else if (weeksUntilRace >= 5 && weeksUntilRace <= 8) {
        const minLong = 4 + (8 - weeksUntilRace); // 4, 5, 6, 7 miles
        longRun = Math.max(longRun, minLong);
    }

    // Cap at 10 miles (5k doesn't need longer)
    longRun = Math.min(longRun, 10);

    return longRun;
}

function calculateTargetPeak5k(
    startingMileage: number,
    trainingWeeks: number,
    level: "beginner" | "intermediate" | "advanced"
): number {
    let basePeak: number;
    
    // 5k peak mileage is lower - focus on quality over quantity
    if (startingMileage < 15) {
        basePeak = trainingWeeks >= 12 ? 25 :
                   trainingWeeks >= 10 ? 22 :
                   20;
    } else if (startingMileage < 25) {
        basePeak = trainingWeeks >= 12 ? 35 :
                   trainingWeeks >= 10 ? 32 :
                   28;
    } else if (startingMileage < 35) {
        basePeak = trainingWeeks >= 12 ? 42 :
                   trainingWeeks >= 10 ? 38 :
                   35;
    } else {
        basePeak = trainingWeeks >= 10 ? 48 :
                   45;
    }

    // Level adjustments
    const levelMultiplier = level === "beginner" ? 0.90 :
                           level === "intermediate" ? 1.0 : 1.15;

    let targetPeak = basePeak * levelMultiplier;

    // Cap based on starting mileage (don't more than double)
    const maxSafePeak = Math.min(50, startingMileage * 2.0);
    targetPeak = Math.min(targetPeak, maxSafePeak);

    // Never below starting
    targetPeak = Math.max(targetPeak, startingMileage);

    return Math.round(targetPeak * 2) / 2;
}