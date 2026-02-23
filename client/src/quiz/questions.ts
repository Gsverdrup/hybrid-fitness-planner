import type { Exercise } from "../../../server/src/domain/weeklyPlan";

export type PreferredLiftExercises = Partial<{
    primaryChest: Exercise[];
    secondaryChest: Exercise[];
    frontDelts: Exercise[];
    lateralDelts: Exercise[];
    triceps: Exercise[];

    lats: Exercise[];
    midBack: Exercise[];
    rearDelts: Exercise[];
    biceps: Exercise[];

    compoundLegs: Exercise[];
    quads: Exercise[];
    hamstrings: Exercise[];
    glutes: Exercise[];
    calves: Exercise[];

    antiExtensionCore: Exercise[];
    antiRotationCore: Exercise[];
    antiLateralFlexionCore: Exercise[];
    trunkFlexionCore: Exercise[];
}>;

export type QuizAnswerMap = {
    goal?: "5k" | "10k" | "half-marathon" | "marathon";
    age?: number;
    sex?: "male" | "female";
    runningLevel?: "beginner" | "intermediate" | "advanced";
    startingWeeklyMileage?: number;
    trainingLengthWeeks?: number;
    runDaysPerWeek?: number;
    runDays?: number[];
    hasLiftPlan?: boolean;
    liftDaysPerWeek?: number;
    liftDays?: number[];
    preferredLiftExercises?: PreferredLiftExercises;
}

export type QuizQuestionOption = {
    id: string | number | boolean;
    label: string;
};

export type QuizQuestion = {
    id: keyof QuizAnswerMap;
    label: string;
    type: "number" | "select" | "exercisePreferences";
    options?: QuizQuestionOption[];
    multiple?: boolean;
};

export const quizQuestions: QuizQuestion[] = [
    {
        id: "goal",
        label: "What is your primary running goal?",
        options: [
            { id: "5k", label: "5K" },
            { id: "10k", label: "10K" },
            { id: "half-marathon", label: "Half Marathon" },
            { id: "marathon", label: "Marathon" }
        ],
        type: "select"
    },
    {
        id: "age",
        label: "What is your age?",
        type: "number"
    },
    {
        id: "sex",
        label: "What is your sex?",
        options: [
            { id: "male", label: "Male" },
            { id: "female", label: "Female" }
        ],
        type: "select"
    },
    {
        id: "runningLevel",
        label: "How would you describe your running experience?",
        options: [
            { id: "beginner", label: "Beginner" },
            { id: "intermediate", label: "Intermediate" },
            { id: "advanced", label: "Advanced" }
        ],
        type: "select"
    },
    {
        id: "startingWeeklyMileage",
        label: "What is your starting weekly mileage?",
        type: "number"
    },
    {
        id: "trainingLengthWeeks",
        label: "How many weeks do you have until your goal race?",
        type: "number"
    },
    {
        id: "runDaysPerWeek",
        label: "How many days per week do you want to run?",
        type: "number"
    },
    {
        id: "runDays",
        label: "Which days of the week do you want to run? (Select all that apply)",
        options: [
            { id: 0, label: "Sunday" },
            { id: 1, label: "Monday" },
            { id: 2, label: "Tuesday" },
            { id: 3, label: "Wednesday" },
            { id: 4, label: "Thursday" },
            { id: 5, label: "Friday" },
            { id: 6, label: "Saturday" }
        ],
        multiple: true,
        type: "select"
    },
    {
        id: "hasLiftPlan",
        label: "Do you want to include a strength training plan alongside your running plan?",
        options: [
            { id: true, label: "Yes" },
            { id: false, label: "No" }
        ],
        type: "select"
    },    {
        id: "liftDaysPerWeek",
        label: "How many days per week do you want to strength train?",
        type: "number"
    },
    {
        id: "liftDays",
        label: "Which days of the week do you want to strength train? (Select all that apply)",
        options: [
            { id: 0, label: "Sunday" },
            { id: 1, label: "Monday" },
            { id: 2, label: "Tuesday" },
            { id: 3, label: "Wednesday" },
            { id: 4, label: "Thursday" },
            { id: 5, label: "Friday" },
            { id: 6, label: "Saturday" }
        ],
        multiple: true,
        type: "select"
    },
    {
        id: "preferredLiftExercises",
        label: "Do you have any preferred exercises for your strength training? (Optional)",
        type: "exercisePreferences"
    }
];