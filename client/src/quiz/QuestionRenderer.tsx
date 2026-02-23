import type { QuizQuestion, QuizQuestionOption } from '../quiz/questions';

interface QuestionRendererProps {
    question: QuizQuestion;
    value: unknown;
    onChange: (value: unknown) => void;
}

export default function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
    if (question.type === 'number') {
        return (
            <div>
                <label className="block text-lg font-medium text-gray-900 mb-4">
                    {question.label}
                </label>
                <input
                    type="number"
                    value={typeof value === 'number' || typeof value === 'string' ? value : ''}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
        );
    }

    if (question.type === 'select' && question.multiple) {
        const selectedValues = Array.isArray(value) ? (value as Array<string | number | boolean>) : [];
        
        return (
            <div>
                <label className="block text-lg font-medium text-gray-900 mb-4">
                    {question.label}
                </label>
                <div className="space-y-2">
                    {question.options?.map((option: QuizQuestionOption) => (
                        <label key={String(option.id)} className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedValues.includes(option.id)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        onChange([...selectedValues, option.id]);
                                    } else {
                                        onChange(selectedValues.filter((selectedValue) => selectedValue !== option.id));
                                    }
                                }}
                                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="ml-3 text-gray-900">{option.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        );
    }

    if (question.type === 'select') {
        return (
            <div>
                <label className="block text-lg font-medium text-gray-900 mb-4">
                    {question.label}
                </label>
                <div className="space-y-2">
                    {question.options?.map((option: QuizQuestionOption) => (
                        <label key={String(option.id)} className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                            <input
                                type="radio"
                                name={question.id}
                                checked={value === option.id}
                                onChange={() => onChange(option.id)}
                                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="ml-3 text-gray-900">{option.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        );
    }

    if (question.type === 'exercisePreferences') {
        return (
            <div>
                <label className="block text-lg font-medium text-gray-900 mb-4">
                    {question.label}
                </label>
                <p className="text-gray-600 mb-4">
                    You can customize your exercise preferences after creating your plan.
                </p>
                <button
                    onClick={() => onChange({})}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800"
                >
                    Skip for now
                </button>
            </div>
        );
    }

    return null;
}
