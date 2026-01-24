'use client';

import { Gender } from '@/lib/types';

interface GenderStepProps {
  gender: Gender;
  onGenderChange: (gender: Gender) => void;
  onNext: () => void;
  onBack: () => void;
}

function MaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 104.38 251.57">
      <path d="M54.41,237.98l-.08-86.85c0-1.21-1.12-2.68-1.68-2.9-.75-.3-2.64,1.48-2.64,2.29l-.03,87.12c0,8.08-6.99,13.88-14.15,13.64-7.89-.27-13.5-6.39-13.5-14.72l.03-147.72c0-.9-1.04-2.54-1.69-2.88-.81-.43-2.67,1.68-2.67,2.69l.02,59.82c0,5.21-3.91,8.94-8.23,9.26C4.53,158.12,0,154.25,0,148.55l.02-73.78c0-12.42,9.9-22.35,22.29-22.35h59.76c12.39,0,22.29,9.9,22.3,22.35l.02,73.77c0,5.35-3.98,9.1-8.89,9.21-4.03.09-9.08-3.14-9.09-8.47l-.05-60.54c0-.81-1.16-2.54-1.83-2.84-.84-.37-2.55,1.71-2.55,2.92l.08,148.76c0,8.04-6.26,13.77-13.46,13.98-6.86.2-14.17-5.01-14.18-13.58Z"/>
      <path d="M57.5.6c-14.28-3.1-27.19,6.22-29.99,19.64-2.77,13.33,5.92,26.68,19.43,29.61,13.15,2.85,26.33-5.37,29.62-18.28,3.47-13.6-4.47-27.81-19.06-30.98Z"/>
    </svg>
  );
}

function FemaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 127.46 251.57">
      <path d="M71.26.6c-14.28-3.1-27.19,6.22-29.99,19.64-2.77,13.33,5.92,26.68,19.43,29.61,13.15,2.85,26.33-5.37,29.62-18.28,3.47-13.6-4.47-27.81-19.06-30.98Z"/>
      <path d="M112.2,167.96l-96.9.04,6.34-19.72,19.24-64.31c.33-1.12-1.12-3.53-1.62-3.22s-1.87,1.13-2.07,1.79l-19.08,63.27c-1.71,5.67-8.1,6.64-11.99,5.43-5.06-1.57-7.19-6.69-5.61-11.98l19.25-64.38c4.01-13.41,16.25-22.51,30.13-22.47l29.03.09c13.43.04,25.4,9.38,29.19,22.38l18.97,65.1c1.44,4.96-1.36,10-5.22,11.45-5.06,1.9-11-.15-12.68-5.73l-18.81-62.61c-.29-.95-2.26-2.14-2.88-1.89s-1.3,1.82-.98,2.88l18.73,62.36,6.95,21.52Z"/>
      <path d="M86.75,241.1c0,6.37-5.24,10.41-10.34,10.47s-10.44-4.06-10.44-9.96l-.03-73.62,20.8.03v73.07Z"/>
      <path d="M61.93,241.19c0,6.38-5.42,10.4-10.37,10.37-5.97-.04-10.16-4.56-10.14-10.54l.16-73,20.36-.03v73.19Z"/>
    </svg>
  );
}

export function GenderStep({
  gender,
  onGenderChange,
  onNext,
  onBack,
}: GenderStepProps) {
  const buttonClass =
    gender === 'female'
      ? 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700'
      : 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700';

  const selectedMaleClass =
    gender === 'male'
      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 ring-2 ring-teal-500'
      : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500';

  const selectedFemaleClass =
    gender === 'female'
      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30 ring-2 ring-pink-500'
      : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500';

  return (
    <div className="flex flex-col items-center px-4">
      <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Select your gender
      </h2>
      <p className="mb-8 text-center text-zinc-500 dark:text-zinc-400">
        This helps personalize your app theme
      </p>

      <div className="grid w-full max-w-sm grid-cols-2 gap-4">
        <button
          onClick={() => onGenderChange('male')}
          className={`flex flex-col items-center rounded-2xl border-2 bg-white p-6 transition-all dark:bg-zinc-800 ${selectedMaleClass}`}
        >
          <MaleIcon className="mb-3 h-16 w-16 text-teal-500" />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Male</span>
        </button>

        <button
          onClick={() => onGenderChange('female')}
          className={`flex flex-col items-center rounded-2xl border-2 bg-white p-6 transition-all dark:bg-zinc-800 ${selectedFemaleClass}`}
        >
          <FemaleIcon className="mb-3 h-16 w-16 text-pink-500" />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Female</span>
        </button>
      </div>

      <div className="mt-8 flex w-full max-w-sm gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className={`flex-1 rounded-xl px-4 py-3 font-medium text-white transition-colors ${buttonClass}`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
