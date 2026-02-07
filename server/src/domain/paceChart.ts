export interface paceChart {
    // Race paces in minutes per mile
    race1Mile: number;
    race5k: number;
    race10k: number;
    raceHalfMarathon: number;
    raceMarathon: number;

    // Training paces in minutes per mile
    easyRun: number;
    thresholdRun: number;
    intervalRun: number;
}