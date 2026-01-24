'use client';

import { useState } from 'react';

interface AgeStepProps {
  age: number | null;
  onAgeChange: (age: number | null) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  gender: 'male' | 'female';
}

export function AgeStep({
  age,
  onAgeChange,
  onNext,
  onBack,
  onSkip,
  gender,
}: AgeStepProps) {
  const [error, setError] = useState('');

  const buttonClass =
    gender === 'female'
      ? 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700'
      : 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700';
  const focusRing =
    gender === 'female'
      ? 'focus:ring-pink-500 focus:border-pink-500'
      : 'focus:ring-teal-500 focus:border-teal-500';
  const skipColor =
    gender === 'female'
      ? 'text-pink-500 hover:text-pink-600'
      : 'text-teal-500 hover:text-teal-600';

  const handleAgeChange = (value: string) => {
    if (value === '') {
      onAgeChange(null);
      setError('');
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      return;
    }

    onAgeChange(numValue);

    if (numValue < 13) {
      setError('You must be at least 13 years old');
    } else if (numValue > 120) {
      setError('Please enter a valid age');
    } else {
      setError('');
    }
  };

  const handleNext = () => {
    if (age !== null && (age < 13 || age > 120)) {
      return;
    }
    onNext();
  };

  return (
    <div className="flex flex-col items-center px-4">
      <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        How old are you?
      </h2>
      <p className="mb-8 text-center text-zinc-500 dark:text-zinc-400">
        This is optional - skip if you prefer not to share
      </p>

      <div className="w-full max-w-sm">
        <label
          htmlFor="age"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Age
        </label>
        <input
          id="age"
          type="number"
          min="13"
          max="120"
          value={age ?? ''}
          onChange={(e) => handleAgeChange(e.target.value)}
          className={`mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 ${focusRing} ${
            error ? 'border-red-500' : ''
          }`}
          placeholder="Enter your age"
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

        <div className="mt-8 flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!!error}
            className={`flex-1 rounded-xl px-4 py-3 font-medium text-white transition-colors disabled:opacity-50 ${buttonClass}`}
          >
            Continue
          </button>
        </div>

        <button
          onClick={onSkip}
          className={`mt-4 w-full py-2 text-sm font-medium transition-colors ${skipColor}`}
        >
          Skip this step
        </button>
      </div>
    </div>
  );
}
