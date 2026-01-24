'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProfile } from '@/lib/hooks/useProfile';
import { Gender, WeightUnit } from '@/lib/types';
import {
  completeProfileSetup,
  uploadAvatar,
  getDefaultAvatarUrl,
  ProfileSetupData,
} from '@/lib/services/profileService';
import { SetupProgress } from './SetupProgress';
import { NameStep } from './steps/NameStep';
import { GenderStep } from './steps/GenderStep';
import { AgeStep } from './steps/AgeStep';
import { PhotoStep } from './steps/PhotoStep';
import { WeightStep } from './steps/WeightStep';
import { GoalsStep } from './steps/GoalsStep';

const TOTAL_STEPS = 6;

interface SetupData {
  firstName: string;
  lastName: string;
  gender: Gender;
  age: number | null;
  avatarUrl: string | null;
  avatarFile: File | null;
  weight: number | null;
  weightUnit: WeightUnit;
  goals: string[];
}

export function SetupWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshProfile } = useProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [setupData, setSetupData] = useState<SetupData>({
    firstName: '',
    lastName: '',
    gender: 'male',
    age: null,
    avatarUrl: null,
    avatarFile: null,
    weight: null,
    weightUnit: 'lbs',
    goals: ['', '', ''],
  });

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  }, []);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSkip = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const updateSetupData = useCallback(
    <K extends keyof SetupData>(key: K, value: SetupData[K]) => {
      setSetupData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleAvatarChange = useCallback(
    (url: string | null, file?: File) => {
      setSetupData((prev) => ({
        ...prev,
        avatarUrl: url,
        avatarFile: file ?? null,
      }));
    },
    []
  );

  const handleComplete = async () => {
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      let finalAvatarUrl = setupData.avatarUrl;

      // Upload avatar if a file was selected
      if (setupData.avatarFile) {
        finalAvatarUrl = await uploadAvatar(user.id, setupData.avatarFile);
      } else if (!finalAvatarUrl) {
        // Use default avatar if none selected
        finalAvatarUrl = getDefaultAvatarUrl(user.id, setupData.gender);
      }

      const profileData: ProfileSetupData = {
        first_name: setupData.firstName.trim(),
        last_name: setupData.lastName.trim(),
        gender: setupData.gender,
        age: setupData.age,
        avatar_url: finalAvatarUrl,
        weight: setupData.weight,
        weight_unit: setupData.weight ? setupData.weightUnit : null,
      };

      await completeProfileSetup(user.id, profileData, setupData.goals);
      await refreshProfile();
      router.push('/');
    } catch (err) {
      console.error('Setup error:', err);
      setError('Failed to save profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  const bgGradient = setupData.gender === 'female'
    ? 'from-pink-50 via-purple-50 to-zinc-50 dark:from-zinc-950 dark:via-purple-950/20 dark:to-zinc-950'
    : 'from-teal-50 via-cyan-50 to-zinc-50 dark:from-zinc-950 dark:via-teal-950/20 dark:to-zinc-950';

  return (
    <div className={`flex min-h-screen flex-col bg-gradient-to-br ${bgGradient}`}>
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm px-4 py-4 dark:border-zinc-700 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-lg">
          <h1
            className={`text-center text-2xl font-bold bg-gradient-to-r ${
              setupData.gender === 'female'
                ? 'from-pink-400 via-purple-500 to-purple-400'
                : 'from-teal-400 via-blue-500 to-blue-400'
            } bg-clip-text text-transparent`}
          >
            Habit-a-Day
          </h1>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white/80 backdrop-blur-sm px-4 py-4 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-lg">
          <SetupProgress
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            gender={setupData.gender}
          />
        </div>
      </div>

      {/* Content */}
      <main className="flex flex-1 flex-col items-center justify-center py-8">
        <div className="w-full max-w-lg">
          {error && (
            <div className="mx-4 mb-4 rounded-xl bg-red-100 p-4 text-center text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          {currentStep === 1 && (
            <NameStep
              firstName={setupData.firstName}
              lastName={setupData.lastName}
              onFirstNameChange={(name) => updateSetupData('firstName', name)}
              onLastNameChange={(name) => updateSetupData('lastName', name)}
              onNext={handleNext}
              gender={setupData.gender}
            />
          )}

          {currentStep === 2 && (
            <GenderStep
              gender={setupData.gender}
              onGenderChange={(gender) => updateSetupData('gender', gender)}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <AgeStep
              age={setupData.age}
              onAgeChange={(age) => updateSetupData('age', age)}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
              gender={setupData.gender}
            />
          )}

          {currentStep === 4 && (
            <PhotoStep
              avatarUrl={setupData.avatarUrl}
              userId={user.id}
              onAvatarChange={handleAvatarChange}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
              gender={setupData.gender}
            />
          )}

          {currentStep === 5 && (
            <WeightStep
              weight={setupData.weight}
              weightUnit={setupData.weightUnit}
              onWeightChange={(weight) => updateSetupData('weight', weight)}
              onWeightUnitChange={(unit) => updateSetupData('weightUnit', unit)}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
              gender={setupData.gender}
            />
          )}

          {currentStep === 6 && (
            <GoalsStep
              goals={setupData.goals}
              onGoalsChange={(goals) => updateSetupData('goals', goals)}
              onNext={handleComplete}
              onBack={handleBack}
              gender={setupData.gender}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white/80 backdrop-blur-sm px-4 py-4 dark:border-zinc-700 dark:bg-zinc-900/80">
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          Step {currentStep} of {TOTAL_STEPS}
        </p>
      </footer>
    </div>
  );
}
