import { generateWeeklyPlan, FitnessProfileError } from "./planGenerator";
import { FitnessProfile } from "../domain/fitnessProfile";
import { WeeklyPlan } from "../domain/weeklyPlan";

export function generateMarathonPlan(profile: FitnessProfile, numWeeks: number): WeeklyPlan[] {
    if (numWeeks < 8 || numWeeks > 20) {
        throw new FitnessProfileError("Marathon training plans must be between 8 and 20 weeks.");
    }
    
    const weekPatternsByWeeks: Record<number, string> = {
        8:  "BBBDBBTT",
        9:  "BBBDBBBTT",
        10: "BBBDBBBBTT",
        11: "BBBBDBBBBTT",
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
    const weekPattern = weekPatternsByWeeks[numWeeks];

    let increaseFactor: number;
    if (numWeeks <= 9) {
        increaseFactor = 1.09;
    } else if (numWeeks <= 11) {
        increaseFactor = 1.08;
    } else if (numWeeks <= 14) {
        increaseFactor = 1.07;
    } else if (numWeeks <= 17) {
        increaseFactor = 1.06;
    } else {
        increaseFactor = 1.05;
    }

    let deloadFactor: number;
    if (profile.runningLevel === "beginner") {
        deloadFactor = 0.75;
    } else if (profile.runningLevel === "intermediate") {
        deloadFactor = 0.80;
    } else {
        deloadFactor = 0.85;
    }

    // Initialize an array to hold the weekly plans
    let racePlan: WeeklyPlan[] = [];

    let curMileage: number = Math.max(10, profile.currentWeeklyMileage);
    let peakMileage: number = curMileage;

    for (let week = 0; week < numWeeks; week++) {
        let weekType: string = weekPattern.charAt(week);

        if (weekType === 'B') {
            if (week !== 0) {
                curMileage = peakMileage * increaseFactor;
            } 
            profile = {...profile, currentWeeklyMileage: curMileage };
            peakMileage = curMileage;
        } else if (weekType === 'D') {
            curMileage = curMileage * deloadFactor;
            profile = {...profile, currentWeeklyMileage: curMileage };
        } else if (weekType === 'T') {
            if (week - numWeeks === -2) {
                profile = {...profile, currentWeeklyMileage: peakMileage * 0.70 };
            } else if (week - numWeeks === -1) {
                profile = {...profile, currentWeeklyMileage: peakMileage * 0.50 };
            }
        }

        let curWeek: WeeklyPlan = generateWeeklyPlan(profile);
        racePlan.push(curWeek);
    }

    return racePlan;
}
