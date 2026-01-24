'use client';

interface GoalsStepProps {
  goals: string[];
  onGoalsChange: (goals: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  gender: 'male' | 'female';
  isSubmitting: boolean;
}

export function GoalsStep({
  goals,
  onGoalsChange,
  onNext,
  onBack,
  gender,
  isSubmitting,
}: GoalsStepProps) {
  const buttonClass =
    gender === 'female'
      ? 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700'
      : 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700';
  const focusRing =
    gender === 'female'
      ? 'focus:ring-pink-500 focus:border-pink-500'
      : 'focus:ring-teal-500 focus:border-teal-500';

  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...goals];
    newGoals[index] = value;
    onGoalsChange(newGoals);
  };

  return (
    <div className="flex flex-col items-center px-4">
      <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Set your goals
      </h2>
      <p className="mb-8 text-center text-zinc-500 dark:text-zinc-400">
        Add up to 3 personal goals to stay motivated
      </p>

      <div className="w-full max-w-sm space-y-4">
        {[0, 1, 2].map((index) => (
          <div key={index}>
            <label
              htmlFor={`goal-${index}`}
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Goal {index + 1} {index > 0 && '(optional)'}
            </label>
            <input
              id={`goal-${index}`}
              type="text"
              value={goals[index] || ''}
              onChange={(e) => handleGoalChange(index, e.target.value)}
              className={`mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 ${focusRing}`}
              placeholder={
                index === 0
                  ? 'e.g., Drink more water daily'
                  : index === 1
                  ? 'e.g., Track my habits consistently'
                  : 'e.g., Build healthy routines'
              }
              maxLength={200}
            />
          </div>
        ))}

        <div className="mt-8 flex gap-3">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={isSubmitting}
            className={`flex-1 rounded-xl px-4 py-3 font-medium text-white transition-colors disabled:opacity-50 ${buttonClass}`}
          >
            {isSubmitting ? 'Saving...' : 'Complete Setup'}
          </button>
        </div>
      </div>
    </div>
  );
}
