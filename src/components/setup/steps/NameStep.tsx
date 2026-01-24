'use client';

import { useState } from 'react';

interface NameStepProps {
  firstName: string;
  lastName: string;
  onFirstNameChange: (name: string) => void;
  onLastNameChange: (name: string) => void;
  onNext: () => void;
  gender: 'male' | 'female';
}

export function NameStep({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  onNext,
  gender,
}: NameStepProps) {
  const [errors, setErrors] = useState({ firstName: '', lastName: '' });

  const accentColor = gender === 'female' ? 'pink' : 'teal';
  const buttonClass =
    gender === 'female'
      ? 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700'
      : 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700';
  const focusRing =
    gender === 'female'
      ? 'focus:ring-pink-500 focus:border-pink-500'
      : 'focus:ring-teal-500 focus:border-teal-500';

  const handleNext = () => {
    const newErrors = { firstName: '', lastName: '' };

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (newErrors.firstName || newErrors.lastName) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  return (
    <div className="flex flex-col items-center px-4">
      <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        What&apos;s your name?
      </h2>
      <p className="mb-8 text-center text-zinc-500 dark:text-zinc-400">
        Let&apos;s personalize your experience
      </p>

      <div className="w-full max-w-sm space-y-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => {
              onFirstNameChange(e.target.value);
              setErrors((prev) => ({ ...prev, firstName: '' }));
            }}
            className={`mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 ${focusRing} ${
              errors.firstName ? 'border-red-500' : ''
            }`}
            placeholder="Enter your first name"
            autoComplete="given-name"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => {
              onLastNameChange(e.target.value);
              setErrors((prev) => ({ ...prev, lastName: '' }));
            }}
            className={`mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 ${focusRing} ${
              errors.lastName ? 'border-red-500' : ''
            }`}
            placeholder="Enter your last name"
            autoComplete="family-name"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
          )}
        </div>

        <button
          onClick={handleNext}
          className={`mt-6 w-full rounded-xl px-4 py-3 font-medium text-white transition-colors ${buttonClass}`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
