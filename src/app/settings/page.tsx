'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProfile } from '@/lib/hooks/useProfile';
import { updateProfile } from '@/lib/services/profileService';
import { calculateDietaryNeeds } from '@/lib/services/foodService';
import { DesktopNav } from '@/components/DesktopNav';
import { Menu } from '@/components/Menu';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refreshProfile, gender } = useProfile();

  const [caloriesGoal, setCaloriesGoal] = useState<number | null>(null);
  const [proteinGoal, setProteinGoal] = useState<number | null>(null);
  const [carbsGoal, setCarbsGoal] = useState<number | null>(null);
  const [fatGoal, setFatGoal] = useState<number | null>(null);
  const [waterGoal, setWaterGoal] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Handle menu navigation
  const handleNavigate = (view: 'home' | 'potty' | 'history' | 'faq' | 'water' | 'water-history' | 'water-faq' | 'food' | 'food-history' | 'food-faq') => {
    setMenuOpen(false);
    router.push('/');
  };

  const accentColor = gender === 'female' ? 'pink' : 'teal';
  const buttonClass =
    gender === 'female'
      ? 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700'
      : 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700';
  const focusRing =
    gender === 'female'
      ? 'focus:ring-pink-500 focus:border-pink-500'
      : 'focus:ring-teal-500 focus:border-teal-500';
  const accentBorder =
    gender === 'female' ? 'border-pink-500' : 'border-teal-500';
  const gradientText = gender === 'female'
    ? 'from-pink-500 to-purple-600'
    : 'from-teal-500 to-blue-600';

  // Calculate recommended values based on profile
  const recommendedValues = profile
    ? calculateDietaryNeeds(
        profile.gender,
        profile.age,
        profile.weight && profile.weight_unit === 'kg'
          ? profile.weight * 2.20462
          : profile.weight
      )
    : null;

  // Load current settings
  useEffect(() => {
    if (profile) {
      setCaloriesGoal(profile.daily_calories_goal);
      setProteinGoal(profile.protein_goal);
      setCarbsGoal(profile.carbs_goal);
      setFatGoal(profile.fat_goal);
      setWaterGoal(profile.water_goal);
    }
  }, [profile]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const handleSave = async () => {
    if (!user || !profile) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile(user.id, {
        daily_calories_goal: caloriesGoal,
        protein_goal: proteinGoal,
        carbs_goal: carbsGoal,
        fat_goal: fatGoal,
        water_goal: waterGoal,
      });

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (recommendedValues) {
      setCaloriesGoal(recommendedValues.dailyCalories);
      setProteinGoal(recommendedValues.protein);
      setCarbsGoal(recommendedValues.carbs);
      setFatGoal(recommendedValues.fat);
      setWaterGoal(recommendedValues.water);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Menu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleNavigate}
        currentView="home"
      />

      <DesktopNav
        currentView="home"
        onNavigate={handleNavigate}
        onOpenSettings={() => setMenuOpen(true)}
        gender={gender}
        avatarUrl={profile?.avatar_url}
        userName={profile?.first_name || undefined}
      />

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Edit Settings
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-6">
          {/* Desktop Header */}
          <div className="hidden lg:block">
            <h1 className={`text-3xl font-bold bg-gradient-to-r ${gradientText} bg-clip-text text-transparent mb-2`}>
              Settings
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Customize your daily goals and targets
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Settings saved successfully!
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Info Card */}
          <div className={`rounded-2xl p-4 shadow-sm ${
            gender === 'female' ? 'bg-pink-50 dark:bg-pink-900/20' : 'bg-teal-50 dark:bg-teal-900/20'
          }`}>
            <div className="flex items-start gap-3">
              <svg className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                gender === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-teal-600 dark:text-teal-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className={`text-sm font-medium mb-1 ${
                  gender === 'female' ? 'text-pink-700 dark:text-pink-300' : 'text-teal-700 dark:text-teal-300'
                }`}>
                  Custom Goals
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Set your own daily targets, or leave them empty to use recommended values based on your profile.
                </p>
              </div>
            </div>
          </div>

          {/* Settings Form */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800 space-y-6">
            {/* Daily Calories */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Daily Calories Goal
              </label>
              <input
                type="number"
                value={caloriesGoal || ''}
                onChange={(e) => setCaloriesGoal(e.target.value ? parseInt(e.target.value) : null)}
                placeholder={recommendedValues ? `Recommended: ${recommendedValues.dailyCalories} cal` : 'Enter calories'}
                className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 ${focusRing}`}
              />
            </div>

            {/* Protein */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Protein Goal (grams)
              </label>
              <input
                type="number"
                value={proteinGoal || ''}
                onChange={(e) => setProteinGoal(e.target.value ? parseInt(e.target.value) : null)}
                placeholder={recommendedValues ? `Recommended: ${recommendedValues.protein}g` : 'Enter protein'}
                className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 ${focusRing}`}
              />
            </div>

            {/* Carbs */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Carbs Goal (grams)
              </label>
              <input
                type="number"
                value={carbsGoal || ''}
                onChange={(e) => setCarbsGoal(e.target.value ? parseInt(e.target.value) : null)}
                placeholder={recommendedValues ? `Recommended: ${recommendedValues.carbs}g` : 'Enter carbs'}
                className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 ${focusRing}`}
              />
            </div>

            {/* Fat */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Fat Goal (grams)
              </label>
              <input
                type="number"
                value={fatGoal || ''}
                onChange={(e) => setFatGoal(e.target.value ? parseInt(e.target.value) : null)}
                placeholder={recommendedValues ? `Recommended: ${recommendedValues.fat}g` : 'Enter fat'}
                className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 ${focusRing}`}
              />
            </div>

            {/* Water Intake */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Water Intake Goal (fl.oz.)
              </label>
              <input
                type="number"
                value={waterGoal || ''}
                onChange={(e) => setWaterGoal(e.target.value ? parseInt(e.target.value) : null)}
                placeholder={recommendedValues ? `Recommended: ${recommendedValues.water} fl.oz.` : '64 fl.oz. (default)'}
                className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 ${focusRing}`}
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                8 cups = 64 fl.oz. | 1 liter ≈ 33.8 fl.oz.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleReset}
                className="flex-1 rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Use Recommended
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex-1 rounded-xl px-4 py-3 font-medium text-white transition-colors disabled:opacity-50 ${buttonClass}`}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Current Values Card */}
          {recommendedValues && (
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                Recommended Values (Based on Your Profile)
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Calories:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {recommendedValues.dailyCalories}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Protein:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {recommendedValues.protein}g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Carbs:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {recommendedValues.carbs}g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Fat:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {recommendedValues.fat}g
                  </span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-zinc-600 dark:text-zinc-400">Water:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {recommendedValues.water} fl.oz.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
