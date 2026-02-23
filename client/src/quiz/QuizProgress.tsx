interface QuizProgressProps {
    currentStep: number;
    totalSteps: number;
}

export default function QuizProgress({ currentStep, totalSteps }: QuizProgressProps) {
    const percentage = (currentStep / totalSteps) * 100;

    return (
        <div className="w-full">
            <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                    Question {currentStep} of {totalSteps}
                </span>
                <span className="text-sm font-medium text-gray-700">
                    {Math.round(percentage)}%
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}