'use client';

interface SetupProgressProps {
  currentStep: number;
  totalSteps: number;
  gender: 'male' | 'female';
}

export function SetupProgress({ currentStep, totalSteps, gender }: SetupProgressProps) {
  const accentColor = gender === 'female' ? 'bg-pink-500' : 'bg-teal-500';
  const inactiveColor = 'bg-zinc-300 dark:bg-zinc-600';

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full transition-colors duration-200 ${
            i < currentStep ? accentColor : inactiveColor
          }`}
        />
      ))}
    </div>
  );
}
