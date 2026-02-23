import { Exercise, LiftWorkout } from "../../domain/weeklyPlan";
import { FitnessProfileError } from "../plans/planGenerator";
import { FitnessProfile } from "../../domain/fitnessProfile";

export function generateLiftDetails(profile: FitnessProfile, lift: LiftWorkout): void {
    const preferredExercises = profile.preferredLiftExercises;
    if (lift.liftType === "push") {
        lift.exercises = [
            selectExercise(preferredExercises?.primaryChestExercises, primaryChestExercises),
            selectExercise(preferredExercises?.secondaryChestExercises, secondaryChestExercises),
            selectExercise(preferredExercises?.frontDeltExercises, frontDeltExercises),
            selectExercise(preferredExercises?.lateralDeltExercises, lateralDeltExercises),
            selectExercise(preferredExercises?.tricepExercises, tricepExercises),
            selectExercise(preferredExercises?.antiExtensionCoreExercises, antiExtensionCoreExercises),
        ];
    } else if (lift.liftType === "pull") {
        lift.exercises = [
            selectExercise(preferredExercises?.latExercises, latExercises),
            selectExercise(preferredExercises?.midBackExercises, midBackExercises),
            selectExercise(preferredExercises?.rearDeltExercises, rearDeltExercises),
            selectExercise(preferredExercises?.bicepExercises, bicepExercises),
            selectExercise(preferredExercises?.antiRotationCoreExercises, antiRotationCoreExercises),
        ];
    } else if (lift.liftType === "upper") {
        lift.exercises = [
            selectExercise(preferredExercises?.primaryChestExercises, primaryChestExercises),
            selectExercise(preferredExercises?.lateralDeltExercises, lateralDeltExercises),
            selectExercise(preferredExercises?.tricepExercises, tricepExercises),
            selectExercise(preferredExercises?.latExercises, latExercises),
            selectExercise(preferredExercises?.midBackExercises, midBackExercises),
            selectExercise(preferredExercises?.bicepExercises, bicepExercises),
            selectExercise(preferredExercises?.antiExtensionCoreExercises, antiExtensionCoreExercises),
            selectExercise(preferredExercises?.antiRotationCoreExercises, antiRotationCoreExercises),
        ];
    } else if (lift.liftType === "legs") {
        lift.exercises = [
            selectExercise(preferredExercises?.compoundLegExercises, compoundLegExercises),
            selectExercise(preferredExercises?.quadExercises, quadExercises),
            selectExercise(preferredExercises?.hamstringExercises, hamstringExercises),
            selectExercise(preferredExercises?.gluteExercises, gluteExercises),
            selectExercise(preferredExercises?.calfExercises, calfExercises),
            selectExercise(preferredExercises?.antiLateralFlexionCoreExercises, antiLateralFlexionCoreExercises),
            selectExercise(preferredExercises?.trunkFlexionCoreExercises, trunkFlexionCoreExercises),
        ];
    } else {
        throw new FitnessProfileError(`Unknown lift type: ${lift.liftType}`);
    }
}

function selectExercise(preferredExercises: Exercise[] | undefined, defaultExercises: Exercise[]): Exercise {
    if (preferredExercises && preferredExercises.length > 0) {
        return preferredExercises[0];
    } else {
        return defaultExercises[0];
    }
}

// --------------------------------
// Exercise Libraries
// --------------------------------

// Push Day Exercises
const primaryChestExercises: Exercise[] = [
    { name: "Incline Dumbbell Bench Press", sets: 4, reps: 8 },
    { name: "Barbell Bench Press", sets: 4, reps: 8 },
    { name: "Incline Barbell Bench Press", sets: 4, reps: 8 },
    { name: "Dumbbell Bench Press", sets: 4, reps: 8 },
    { name: "Machine Chest Press", sets: 4, reps: 8 },
];

const secondaryChestExercises: Exercise[] = [
    { name: "Cable Chest Flyes", sets: 3, reps: 12 },
    { name: "Dumbbell Chest Flyes", sets: 3, reps: 12 },
    { name: "Machine Chest Flyes", sets: 3, reps: 12 },
    { name: "Push-Ups", sets: 3, reps: 20 },
];

const frontDeltExercises: Exercise[] = [
    { name: "Dumbbell Shoulder Press", sets: 3, reps: 10 },
    { name: "Standing Overhead Press", sets: 4, reps: 8 },
    { name: "Front Delt Raises", sets: 3, reps: 12 },
];

const lateralDeltExercises: Exercise[] = [
    { name: "Cable Lateral Raises", sets: 3, reps: 10 },
    { name: "Dumbbell Lateral Raises", sets: 3, reps: 12 },
];

const tricepExercises: Exercise[] = [
    { name: "Tricep Pushdowns", sets: 3, reps: 10 },
    { name: "Tricep Dips", sets: 4, reps: 8 },
    { name: "Overhead Tricep Extension", sets: 3, reps: 10 },
    { name: "Skull Crushers", sets: 3, reps: 10 }
];

// Pull Day Exercises
const latExercises: Exercise[] = [
    { name: "Lat Pulldowns", sets: 4, reps: 8 },
    { name: "Single-Arm Lat Pulldowns", sets: 4, reps: 8 },
    { name: "Pull-Ups", sets: 4, reps: 8 },
    { name: "Lat Pullovers", sets: 3, reps: 10 }
];

const midBackExercises: Exercise[] = [
    { name: "Barbell Rows", sets: 4, reps: 8 },
    { name: "Dumbbell Rows", sets: 4, reps: 8 },
    { name: "Seated Cable Rows", sets: 4, reps: 8 },
    { name: "Chest-Supported Rows", sets: 4, reps: 8 }
];

const rearDeltExercises: Exercise[] = [
    { name: "Cable Rear Delt Flyes", sets: 3, reps: 12 },
    { name: "Machine Rear Delt Flyes", sets: 3, reps: 12 },
    { name: "Face Pulls", sets: 3, reps: 10 }
];

const bicepExercises: Exercise[] = [
    { name: "Dumbbell Curls", sets: 3, reps: 10 },
    { name: "Barbell Curls", sets: 3, reps: 10 },
    { name: "Cable Curls", sets: 3, reps: 10 },
    { name: "Preacher Curls", sets: 3, reps: 10 }
];

// Leg Day Exercises
const compoundLegExercises: Exercise[] = [
    { name: "Back Squats", sets: 4, reps: 8 },
    { name: "Leg Press", sets: 4, reps: 8 },
    { name: "Hack Squats", sets: 4, reps: 8 },
    { name: "Bulgarian Split Squats", sets: 4, reps: 8 },
    { name: "Goblet Squats", sets: 4, reps: 8 }
];

const quadExercises: Exercise[] = [
    { name: "Leg Extensions", sets: 3, reps: 10 },
    { name: "Step-Ups", sets: 3, reps: 10 },
    { name: "Lunges", sets: 3, reps: 10 }
];

const hamstringExercises: Exercise[] = [
    { name: "Romanian Deadlifts", sets: 3, reps: 10 },
    { name: "Hamstring Curls", sets: 3, reps: 10 },
    { name: "Good Mornings", sets: 3, reps: 10 }
];

const gluteExercises: Exercise[] = [
    { name: "Hip Thrusts", sets: 3, reps: 10 },
    { name: "Glute Bridges", sets: 3, reps: 12 },
    { name: "Hip Abductions", sets: 3, reps: 15 },
];

const calfExercises: Exercise[] = [
    { name: "Standing Calf Raises", sets: 3, reps: 15 },
    { name: "Seated Calf Raises", sets: 3, reps: 15 }
];

// Core Exercises
const antiExtensionCoreExercises: Exercise[] = [
    { name: "Plank", sets: 3, reps: 30 }, // seconds
    { name: "Ab Wheel Rollout", sets: 3, reps: 8 },
    { name: "Stability Ball Rollout", sets: 3, reps: 10 },
    { name: "Dead Bug", sets: 3, reps: 10 }
];

const antiRotationCoreExercises: Exercise[] = [
    { name: "Pallof Press", sets: 3, reps: 12 },
    { name: "Cable Chop (Isometric)", sets: 3, reps: 10 },
    { name: "Band Anti-Rotation Hold", sets: 3, reps: 20 } // seconds
];

const antiLateralFlexionCoreExercises: Exercise[] = [
    { name: "Side Plank", sets: 3, reps: 30 }, // seconds per side
    { name: "Suitcase Carry", sets: 3, reps: 40 }, // meters
    { name: "Single-Arm Farmer Carry", sets: 3, reps: 30 } // seconds
];

const trunkFlexionCoreExercises: Exercise[] = [
    { name: "Hanging Leg Raises", sets: 3, reps: 10 },
    { name: "Cable Crunch", sets: 3, reps: 12 },
    { name: "Ab Crunch", sets: 3, reps: 15 }
];
