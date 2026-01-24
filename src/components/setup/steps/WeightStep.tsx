'use client';

import { useState } from 'react';
import { WeightUnit } from '@/lib/types';

interface WeightStepProps {
  weight: number | null;
  weightUnit: WeightUnit;
  onWeightChange: (weight: number | null) => void;
  onWeightUnitChange: (unit: WeightUnit) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  gender: 'male' | 'female';
}

export function WeightStep({
  weight,
  weightUnit,
  onWeightChange,
  onWeightUnitChange,
  onNext,
  onBack,
  onSkip,
  gender,
}: WeightStepProps) {
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
  const activeUnitClass =
    gender === 'female'
      ? 'bg-pink-500 text-white'
      : 'bg-teal-500 text-white';

  const handleWeightChange = (value: string) => {
    if (value === '') {
      onWeightChange(null);
      setError('');
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return;
    }

    onWeightChange(numValue);

    if (numValue <= 0) {
      setError('Weight must be greater than 0');
    } else if (numValue > 1000) {
      setError('Please enter a valid weight');
    } else {
      setError('');
    }
  };

  const handleNext = () => {
    if (weight !== null && (weight <= 0 || weight > 1000)) {
      return;
    }
    onNext();
  };

  return (
    <div className="flex flex-col items-center px-4">
      <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        What&apos;s your weight?
      </h2>
      <p className="mb-8 text-center text-zinc-500 dark:text-zinc-400">
        This helps with personalized tracking - you can skip this
      </p>

      <div className="w-full max-w-sm">
        {/* Unit toggle */}
        <div className="mb-4 flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
          <button
            onClick={() => onWeightUnitChange('lbs')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              weightUnit === 'lbs'
                ? activeUnitClass
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            lbs
          </button>
          <button
            onClick={() => onWeightUnitChange('kg')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              weightUnit === 'kg'
                ? activeUnitClass
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            kg
          </button>
        </div>

        <label
          htmlFor="weight"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Weight ({weightUnit})
        </label>
        <input
          id="weight"
          type="number"
          step="0.1"
          min="0"
          value={weight ?? ''}
          onChange={(e) => handleWeightChange(e.target.value)}
          className={`mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 ${focusRing} ${
            error ? 'border-red-500' : ''
          }`}
          placeholder={`Enter your weight in ${weightUnit}`}
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
