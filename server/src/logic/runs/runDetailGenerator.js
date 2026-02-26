import { FitnessProfileError, roundToNearestQuarter } from "../plans/planGenerator";
export function generateRunSegments(profile, run, workoutType, longRunType) {
    const paceChart = profile.paceChart;
    if (!paceChart)
        return;
    const totalMiles = run.miles;
    const warmupMiles = Math.min(1, roundToNearestQuarter(totalMiles * 0.2));
    const cooldownMiles = Math.min(1, roundToNearestQuarter(totalMiles * 0.2));
    const mainMiles = Math.max(0, totalMiles - warmupMiles - cooldownMiles);
    // Easy run
    if (run.runType === "easy") {
        run.name = "Easy Run";
        run.segments = [
            { distanceMiles: run.miles, pace: paceChart.easyRun, description: "Easy run" }
        ];
        return;
    }
    // Long run
    if (run.runType === "long" && longRunType) {
        run.name = "Long Run";
        // Beginner runners do all long runs at easy pace
        if (profile.runningLevel === "beginner") {
            run.segments = [
                { distanceMiles: totalMiles, pace: paceChart.easyRun, description: "Easy long run" }
            ];
            return;
        }
        if (longRunType === "easy") {
            run.segments = [
                { distanceMiles: run.miles, pace: paceChart.easyRun, description: "Easy long run" }
            ];
        }
        else if (longRunType === "fast-finish") {
            run.segments = [
                { distanceMiles: roundToNearestQuarter(run.miles * 0.75), pace: paceChart.easyRun, description: "First 75% at easy pace" },
                { distanceMiles: roundToNearestQuarter(run.miles * 0.25), pace: paceChart.thresholdRun, description: "Final 25% at tempo pace" }
            ];
        }
        else if (longRunType === "marathon-pace") {
            run.segments = [
                { distanceMiles: roundToNearestQuarter(run.miles * 0.35), pace: paceChart.easyRun, description: "First part at easy pace" },
                { distanceMiles: roundToNearestQuarter(run.miles * 0.30), pace: paceChart.raceMarathon, description: "Marathon-pace long run" },
                { distanceMiles: roundToNearestQuarter(run.miles * 0.35), pace: paceChart.easyRun, description: "Finish at easy pace" }
            ];
        }
        return;
    }
    // Workout run
    if (run.runType === "workout" && workoutType) {
        if (workoutType === "classic-tempo") {
            run.name = "Classic Tempo";
            run.segments = [
                { distanceMiles: warmupMiles, pace: paceChart.easyRun, description: "Warm-up" },
                { distanceMiles: roundToNearestQuarter(mainMiles), pace: paceChart.thresholdRun, description: "Tempo effort" },
                { distanceMiles: cooldownMiles, pace: paceChart.easyRun, description: "Cool-down" }
            ];
        }
        else if (workoutType === "cruise-tempo") {
            run.name = "Cruise Tempo";
            run.segments = [
                { distanceMiles: warmupMiles, pace: paceChart.easyRun, description: "Warm-up" },
                { distanceMiles: roundToNearestQuarter(mainMiles * 0.25), pace: paceChart.thresholdRun, description: "Tempo effort" },
                { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                { distanceMiles: roundToNearestQuarter(mainMiles * 0.25), pace: paceChart.thresholdRun, description: "Tempo effort" },
                { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                { distanceMiles: roundToNearestQuarter(mainMiles * 0.25), pace: paceChart.thresholdRun, description: "Tempo effort" },
                { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                { distanceMiles: roundToNearestQuarter(mainMiles * 0.25), pace: paceChart.thresholdRun, description: "Tempo effort" },
                { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                { distanceMiles: roundToNearestQuarter(mainMiles * 0.25), pace: paceChart.thresholdRun, description: "Tempo effort" },
                { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                { distanceMiles: cooldownMiles, pace: paceChart.easyRun, description: "Cool-down" }
            ];
        }
        else if (workoutType === "progressive-tempo") {
            run.name = "Progressive Tempo";
            run.segments = [
                { distanceMiles: warmupMiles, pace: paceChart.easyRun, description: "Warm-up" },
                { distanceMiles: roundToNearestQuarter(mainMiles / 3), pace: paceChart.thresholdRun + 0.25, description: "First third (slightly slower)" },
                { distanceMiles: roundToNearestQuarter(mainMiles / 3), pace: paceChart.thresholdRun, description: "Second third (faster)" },
                { distanceMiles: roundToNearestQuarter(mainMiles / 3), pace: paceChart.thresholdRun - 0.25, description: "Final third (fastest)" },
                { distanceMiles: cooldownMiles, pace: paceChart.easyRun, description: "Cool-down" }
            ];
        }
        else if (workoutType === "400m") {
            run.name = "400m Intervals";
            run.segments = [
                { distanceMiles: warmupMiles, pace: paceChart.easyRun, description: "Warm-up" }
            ];
            let remainingMiles = mainMiles;
            while (remainingMiles >= 0.25) {
                run.segments.push({ distanceMiles: 0.25, pace: paceChart.intervalRun, description: "400m interval" }, { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" });
                remainingMiles -= 0.25;
            }
            run.segments.push({ distanceMiles: cooldownMiles + remainingMiles, pace: paceChart.easyRun, description: "Cool-down" });
        }
        else if (workoutType === "800m") {
            run.name = "800m Intervals";
            run.segments = [
                { distanceMiles: warmupMiles, pace: paceChart.easyRun, description: "Warm-up" }
            ];
            let remainingMiles = mainMiles;
            while (remainingMiles >= 0.50) {
                run.segments.push({ distanceMiles: 0.50, pace: paceChart.intervalRun, description: "800m interval" }, { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" });
                remainingMiles -= 0.50;
            }
            run.segments.push({ distanceMiles: cooldownMiles + remainingMiles, pace: paceChart.easyRun, description: "Cool-down" });
        }
        else if (workoutType === "ladder") {
            run.name = "Ladder Intervals";
            if (mainMiles >= 4) {
                run.segments = [
                    { distanceMiles: warmupMiles, pace: paceChart.easyRun, description: "Warm-up" },
                    { distanceMiles: 0.25, pace: paceChart.intervalRun, description: "400m interval" },
                    { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                    { distanceMiles: 0.5, pace: paceChart.intervalRun, description: "800m interval" },
                    { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                    { distanceMiles: 0.75, pace: paceChart.intervalRun, description: "1200m interval" },
                    { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                    { distanceMiles: 1, pace: paceChart.intervalRun, description: "1600m interval" },
                    { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                    { distanceMiles: 0.75, pace: paceChart.intervalRun, description: "1200m interval" },
                    { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                    { distanceMiles: 0.5, pace: paceChart.intervalRun, description: "800m interval" },
                    { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                    { distanceMiles: 0.25, pace: paceChart.intervalRun, description: "400m interval" },
                    { distanceMiles: cooldownMiles + (mainMiles - 2.25), pace: paceChart.easyRun, description: "Cool-down" }
                ];
            }
            else if (mainMiles >= 3) {
                run.segments = [
                    { distanceMiles: warmupMiles, pace: paceChart.easyRun, description: "Warm-up" },
                    { distanceMiles: 0.25, pace: paceChart.intervalRun, description: "400m interval" },
                    { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                    { distanceMiles: 0.5, pace: paceChart.intervalRun, description: "800m interval" },
                    { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                    { distanceMiles: 0.75, pace: paceChart.intervalRun, description: "1200m interval" },
                    { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                    { distanceMiles: 0.75, pace: paceChart.intervalRun, description: "1200m interval" },
                    { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                    { distanceMiles: 0.5, pace: paceChart.intervalRun, description: "800m interval" },
                    { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                    { distanceMiles: 0.25, pace: paceChart.intervalRun, description: "400m interval" },
                    { distanceMiles: cooldownMiles + (mainMiles - 2.25), pace: paceChart.easyRun, description: "Cool-down" }
                ];
            }
            else if (mainMiles >= 2.25) {
                run.segments = [
                    { distanceMiles: warmupMiles, pace: paceChart.easyRun, description: "Warm-up" },
                    { distanceMiles: 0.25, pace: paceChart.intervalRun, description: "400m interval" },
                    { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                    { distanceMiles: 0.5, pace: paceChart.intervalRun, description: "800m interval" },
                    { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                    { distanceMiles: 0.75, pace: paceChart.intervalRun, description: "1200m interval" },
                    { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                    { distanceMiles: 0.5, pace: paceChart.intervalRun, description: "800m interval" },
                    { distanceMiles: 0, pace: paceChart.easyRun, description: "1-min jog/rest" },
                    { distanceMiles: 0.25, pace: paceChart.intervalRun, description: "400m interval" },
                    { distanceMiles: cooldownMiles + (mainMiles - 2.25), pace: paceChart.easyRun, description: "Cool-down" }
                ];
            }
            else {
                // Default to 800m intervals if not enough mileage for full ladder
                workoutType = "800m";
                run.name = "800m Intervals";
                generateRunSegments(profile, run, workoutType);
            }
        }
        return;
    }
    throw new FitnessProfileError(`Cannot generate run segments for run type: ${run.runType} with workout type: ${workoutType} and long run type: ${longRunType}`);
}
