'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProfile } from '@/lib/hooks/useProfile';
import { Gender, WeightUnit, UserGoal } from '@/lib/types';
import {
  updateProfile,
  uploadAvatar,
  getDefaultAvatarUrl,
  getUserGoals,
  saveUserGoals,
} from '@/lib/services/profileService';
import { DesktopNav } from '@/components/DesktopNav';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refreshProfile, gender } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lbs');
  const [goals, setGoals] = useState<string[]>(['', '', '']);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const accentColor = gender === 'female' ? 'pink' : 'teal';
  const buttonClass =
    gender === 'female'
      ? 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700'
      : 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700';
  const focusRing =
    gender === 'female'
      ? 'focus:ring-pink-500 focus:border-pink-500'
      : 'focus:ring-teal-500 focus:border-teal-500';
  const activeUnitClass =
    gender === 'female' ? 'bg-pink-500 text-white' : 'bg-teal-500 text-white';
  const accentBorder =
    gender === 'female' ? 'border-pink-500' : 'border-teal-500';

  // Load profile data
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setAge(profile.age);
      setAvatarUrl(profile.avatar_url);
      setWeight(profile.weight);
      setWeightUnit(profile.weight_unit || 'lbs');
    }
  }, [profile]);

  // Load goals
  useEffect(() => {
    if (user) {
      getUserGoals(user.id).then((userGoals) => {
        const goalTexts = ['', '', ''];
        userGoals.forEach((goal) => {
          if (goal.display_order >= 1 && goal.display_order <= 3) {
            goalTexts[goal.display_order - 1] = goal.goal_text;
          }
        });
        setGoals(goalTexts);
      });
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    setAvatarFile(file);
    setError(null);
  };

  const handleUseDefault = () => {
    if (user) {
      const defaultUrl = getDefaultAvatarUrl(user.id, gender);
      setAvatarUrl(defaultUrl);
      setAvatarFile(null);
    }
  };

  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...goals];
    newGoals[index] = value;
    setGoals(newGoals);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      let finalAvatarUrl = avatarUrl;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        finalAvatarUrl = await uploadAvatar(user.id, avatarFile);
      }

      // Update profile
      await updateProfile(user.id, {
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        age: age,
        avatar_url: finalAvatarUrl,
        weight: weight,
        weight_unit: weight ? weightUnit : null,
      });

      // Save goals
      await saveUserGoals(user.id, goals);

      // Refresh profile context
      await refreshProfile();

      setSuccess(true);
      setAvatarFile(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-zinc-50 dark:from-zinc-950 dark:via-teal-950/20 dark:to-zinc-950">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const defaultAvatarUrl = getDefaultAvatarUrl(user.id, gender);

  const bgGradient = gender === 'female'
    ? 'from-pink-50 via-purple-50 to-zinc-50 dark:from-zinc-950 dark:via-purple-950/20 dark:to-zinc-950'
    : 'from-teal-50 via-cyan-50 to-zinc-50 dark:from-zinc-950 dark:via-teal-950/20 dark:to-zinc-950';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient}`}>
      {/* Desktop Nav */}
      <DesktopNav
        currentView="home"
        onNavigate={(view) => router.push(view === 'home' ? '/' : `/${view}`)}
        onOpenSettings={() => {}}
        gender={gender}
        avatarUrl={profile?.avatar_url}
        userName={profile?.first_name || undefined}
      />

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-sm px-4 py-4 dark:border-zinc-700 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Edit Profile
          </h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-lg px-4 py-6">
        {error && (
          <div className="mb-4 rounded-xl bg-red-100 p-4 text-center text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl bg-green-100 p-4 text-center text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Profile saved successfully!
          </div>
        )}

        {/* Avatar */}
        <div className="mb-8 flex flex-col items-center">
          <div
            className={`relative mb-4 h-24 w-24 overflow-hidden rounded-full border-4 ${accentBorder}`}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Profile"
                fill
                className="object-cover"
                unoptimized={avatarUrl.startsWith('blob:') || avatarUrl.includes('dicebear')}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                <svg
                  className="h-12 w-12 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border-2 border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:active:bg-zinc-600"
            >
              Change Photo
            </button>
            <button
              onClick={handleUseDefault}
              className="rounded-xl border-2 border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:active:bg-zinc-600"
            >
              Use Default
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`mt-1 block w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${focusRing}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`mt-1 block w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${focusRing}`}
              />
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Age
            </label>
            <input
              type="number"
              min="13"
              max="120"
              value={age ?? ''}
              onChange={(e) => setAge(e.target.value ? parseInt(e.target.value, 10) : null)}
              className={`mt-1 block w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${focusRing}`}
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Weight
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                step="0.1"
                min="0"
                value={weight ?? ''}
                onChange={(e) => setWeight(e.target.value ? parseFloat(e.target.value) : null)}
                className={`block flex-1 rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${focusRing}`}
              />
              <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-700">
                <button
                  onClick={() => setWeightUnit('lbs')}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    weightUnit === 'lbs'
                      ? activeUnitClass
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  lbs
                </button>
                <button
                  onClick={() => setWeightUnit('kg')}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    weightUnit === 'kg'
                      ? activeUnitClass
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  kg
                </button>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Personal Goals
            </label>
            <div className="mt-2 space-y-3">
              {[0, 1, 2].map((index) => (
                <input
                  key={index}
                  type="text"
                  value={goals[index] || ''}
                  onChange={(e) => handleGoalChange(index, e.target.value)}
                  className={`block w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 ${focusRing}`}
                  placeholder={`Goal ${index + 1}`}
                  maxLength={200}
                />
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full rounded-xl px-4 py-3 font-medium text-white transition-colors disabled:opacity-50 ${buttonClass}`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </main>
    </div>
  );
}
