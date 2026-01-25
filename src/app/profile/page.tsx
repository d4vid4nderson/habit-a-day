'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProfile } from '@/lib/hooks/useProfile';
import { Gender, WeightUnit, HeightUnit, UserGoal } from '@/lib/types';
import {
  updateProfile,
  uploadAvatar,
  getUserGoals,
  saveUserGoals,
} from '@/lib/services/profileService';
import { DesktopNav } from '@/components/DesktopNav';
import { Menu } from '@/components/Menu';
import { AvatarPicker } from '@/components/AvatarPicker';

interface DeletedData {
  email: string;
  profile: number;
  bathroomEntries: number;
  waterEntries: number;
  foodEntries: number;
  ptEntries: number;
  goals: number;
  avatarFiles: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, refreshProfile, gender } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get OAuth avatar from profile (stored from Google/Facebook/Apple on login)
  const oauthAvatarUrl = profile?.oauth_avatar_url || null;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [heightFeet, setHeightFeet] = useState<number | null>(null);
  const [heightInches, setHeightInches] = useState<number | null>(null);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('imperial');
  const [weight, setWeight] = useState<number | null>(null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lbs');
  const [goals, setGoals] = useState<string[]>(['', '', '']);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'download' | 'confirm'>('download');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletedData, setDeletedData] = useState<DeletedData | null>(null);

  // Data export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

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
      // Fall back to OAuth avatar if no custom avatar is set
      setAvatarUrl(profile.avatar_url || profile.oauth_avatar_url);
      setAvatarError(false);
      setHeightFeet(profile.height_feet);
      setHeightInches(profile.height_inches);
      setHeightCm(profile.height_cm);
      setHeightUnit(profile.height_unit || 'imperial');
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
    setAvatarError(false);
    setError(null);
  };

  const handleAvatarSelect = (url: string) => {
    setAvatarUrl(url);
    setAvatarFile(null);
    setAvatarError(false);
  };

  const handleDeleteAvatar = () => {
    // Reset to OAuth provider avatar (or null if no OAuth avatar available)
    setAvatarUrl(oauthAvatarUrl);
    setAvatarFile(null);
    setAvatarError(false);
  };

  // Check if we can show the delete button
  // Show it when the current avatar is different from the OAuth avatar
  // (meaning user uploaded a custom photo or selected from avatar picker)
  const canDeleteAvatar = avatarUrl && avatarUrl !== oauthAvatarUrl;

  // Determine the source of the current photo
  const getPhotoSource = (url: string | null): { label: string; icon: React.ReactNode } | null => {
    if (!url) return null;

    if (url.includes('googleusercontent.com')) {
      return {
        label: 'Google account',
        icon: (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        ),
      };
    }

    if (url.includes('fbcdn.net') || url.includes('facebook.com')) {
      return {
        label: 'Facebook account',
        icon: (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        ),
      };
    }

    if (url.includes('appleid.apple.com')) {
      return {
        label: 'Apple account',
        icon: (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
        ),
      };
    }

    if (url.startsWith('blob:')) {
      return {
        label: 'New upload',
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      };
    }

    if (url.includes('dicebear') || url.includes('jsdelivr.net/gh/alohe/avatars')) {
      return {
        label: 'Generated avatar',
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
    }

    // Custom uploaded photo (from Supabase storage)
    if (url.includes('supabase')) {
      return {
        label: 'Custom upload',
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      };
    }

    return null;
  };

  const photoSource = getPhotoSource(avatarUrl);

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
        height_feet: heightUnit === 'imperial' ? heightFeet : null,
        height_inches: heightUnit === 'imperial' ? heightInches : null,
        height_cm: heightUnit === 'metric' ? heightCm : null,
        height_unit: heightUnit,
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

  const handleExportData = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const response = await fetch('/api/data-export');

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habit-a-day-data-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      setExportError('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.error || 'Failed to delete account');
        setIsDeleting(false);
        return;
      }

      // Show deletion confirmation
      setDeletedData(data.deletedData);

      // Sign out and redirect after showing confirmation
      setTimeout(async () => {
        await signOut();
        router.push('/auth/login');
      }, 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setDeleteError('An unexpected error occurred. Please try again.');
      setIsDeleting(false);
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

  const bgGradient = gender === 'female'
    ? 'from-pink-50 via-purple-50 to-zinc-50 dark:from-zinc-950 dark:via-purple-950/20 dark:to-zinc-950'
    : 'from-teal-50 via-cyan-50 to-zinc-50 dark:from-zinc-950 dark:via-teal-950/20 dark:to-zinc-950';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient}`}>
      {/* Desktop Nav */}
      <DesktopNav
        currentView="home"
        onNavigate={(view) => router.push(view === 'home' ? '/' : `/?view=${view}`)}
        onOpenSettings={() => setMenuOpen(true)}
        gender={gender}
        avatarUrl={profile?.avatar_url}
        userName={profile?.first_name || undefined}
      />

      {/* Settings Menu */}
      <Menu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(view) => {
          setMenuOpen(false);
          router.push(view === 'home' ? '/' : `/${view}`);
        }}
        currentView="home"
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
      <main className="mx-auto max-w-4xl px-4 py-6">
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

        {/* Profile Photo - Full Width */}
        <div className="rounded-2xl bg-white/60 p-6 dark:bg-zinc-800/60 mb-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Profile Photo</h2>
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className={`relative h-24 w-24 overflow-hidden rounded-full border-4 ${accentBorder}`}>
                {avatarUrl && !avatarError ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => {
                      console.error('Failed to load avatar:', avatarUrl);
                      setAvatarError(true);
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                    <svg className="h-12 w-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              {canDeleteAvatar && (
                <button
                  onClick={handleDeleteAvatar}
                  className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-colors hover:bg-red-600 active:bg-red-700"
                  title="Remove custom photo"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {photoSource && (
              <div className="mb-3 flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 dark:bg-zinc-700">
                {photoSource.icon}
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{photoSource.label}</span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border-2 border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:active:bg-zinc-600"
              >
                Change Photo
              </button>
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="rounded-xl border-2 border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:active:bg-zinc-600"
              >
                Browse
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
        </div>

        {/* Two column layout - Personal Information + Personal Goals */}
        <div className="md:grid md:grid-cols-2 md:gap-6">
          {/* Left Column - Personal Information */}
          <div className="rounded-2xl bg-white/60 p-6 dark:bg-zinc-800/60 overflow-hidden">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Personal Information</h2>
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
                  inputMode="numeric"
                  min="13"
                  max="120"
                  value={age ?? ''}
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className={`mt-1 block w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${focusRing} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  placeholder="Years"
                />
              </div>

              {/* Height */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Height
                </label>
                <div className="mt-1 flex gap-2">
                  {heightUnit === 'imperial' ? (
                    <>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max="8"
                          value={heightFeet ?? ''}
                          onChange={(e) => setHeightFeet(e.target.value ? parseInt(e.target.value, 10) : null)}
                          className={`block w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 pr-10 text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${focusRing} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                          placeholder="Feet"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">ft</span>
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max="11"
                          value={heightInches ?? ''}
                          onChange={(e) => setHeightInches(e.target.value ? parseInt(e.target.value, 10) : null)}
                          className={`block w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 pr-10 text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${focusRing} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                          placeholder="Inches"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">in</span>
                      </div>
                    </>
                  ) : (
                    <div className="relative flex-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="300"
                        value={heightCm ?? ''}
                        onChange={(e) => setHeightCm(e.target.value ? parseInt(e.target.value, 10) : null)}
                        className={`block w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 pr-12 text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${focusRing} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        placeholder="Centimeters"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">cm</span>
                    </div>
                  )}
                  <div className="flex shrink-0 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-700">
                    <button
                      onClick={() => setHeightUnit('imperial')}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        heightUnit === 'imperial'
                          ? activeUnitClass
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      ft/in
                    </button>
                    <button
                      onClick={() => setHeightUnit('metric')}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        heightUnit === 'metric'
                          ? activeUnitClass
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      cm
                    </button>
                  </div>
                </div>
              </div>

              {/* Weight */}
              <div className="min-w-0">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Weight
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    value={weight ?? ''}
                    onChange={(e) => setWeight(e.target.value ? parseFloat(e.target.value) : null)}
                    className={`block min-w-0 flex-1 rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${focusRing} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    placeholder={weightUnit === 'lbs' ? 'Pounds' : 'Kilograms'}
                  />
                  <div className="flex shrink-0 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-700">
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

            </div>
          </div>

          {/* Right Column - Personal Goals */}
          <div className="mt-6 md:mt-0">
            <div className="rounded-2xl bg-white/60 p-6 dark:bg-zinc-800/60 h-full">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Personal Goals</h2>
              <div className="space-y-3">
                {[0, 1, 2].map((index) => (
                  <textarea
                    key={index}
                    value={goals[index] || ''}
                    onChange={(e) => handleGoalChange(index, e.target.value)}
                    className={`block w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 resize-none ${focusRing}`}
                    placeholder={`Goal ${index + 1}`}
                    maxLength={200}
                    rows={2}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button - Full Width */}
        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full rounded-xl px-4 py-3 font-medium text-white transition-colors disabled:opacity-50 ${buttonClass}`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Data Management Section */}
        <div className="mt-10 pt-6 border-t border-zinc-200 dark:border-zinc-700">
          {/* Export Data */}
          <div className="rounded-2xl bg-white/60 p-6 dark:bg-zinc-800/60 mb-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Export Your Data
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Download a complete copy of all your data in CSV format. This includes your profile information, tracking history, goals, and all other data associated with your account.
            </p>
            {exportError && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {exportError}
              </div>
            )}
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className={`rounded-xl px-6 py-2.5 font-medium text-white transition-colors disabled:opacity-50 ${buttonClass}`}
            >
              {isExporting ? 'Preparing Download...' : 'Download My Data'}
            </button>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl border-2 border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-900/10">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-500 mb-2">
              Danger Zone
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Permanently delete your account and all associated data. This action is irreversible and cannot be undone.
            </p>
            <button
              onClick={() => {
                setDeleteStep('download');
                setShowDeleteModal(true);
              }}
              className="rounded-xl border-2 border-red-500 bg-white px-6 py-2.5 font-medium text-red-600 transition-colors hover:bg-red-50 active:bg-red-100 dark:bg-transparent dark:text-red-500 dark:hover:bg-red-900/20 dark:active:bg-red-900/30"
            >
              Delete Account
            </button>
          </div>
        </div>
      </main>

      {/* Delete Account Modal - Two Step Process */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800">
            {deletedData ? (
              // Success state - show what was deleted
              <>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Account Deleted
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Your account and all associated data have been permanently removed:
                </p>
                <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1 mb-4">
                  <li>• Email: {deletedData.email}</li>
                  <li>• Profile: {deletedData.profile} record</li>
                  <li>• Bathroom entries: {deletedData.bathroomEntries}</li>
                  <li>• Water entries: {deletedData.waterEntries}</li>
                  <li>• Food entries: {deletedData.foodEntries}</li>
                  <li>• PT entries: {deletedData.ptEntries}</li>
                  <li>• Goals: {deletedData.goals}</li>
                  <li>• Avatar files: {deletedData.avatarFiles}</li>
                </ul>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Redirecting to login page...
                </p>
              </>
            ) : deleteStep === 'download' ? (
              // Step 1: Download data before deletion
              <>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                  Download Your Data First
                </h3>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3 mb-4">
                  <p>
                    Before deleting your account, we recommend downloading a copy of all your data. Once your account is deleted, <strong className="text-zinc-900 dark:text-zinc-200">your data cannot be recovered</strong>.
                  </p>
                  <p>
                    Your data export will include:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Profile information (name, age, height, weight)</li>
                    <li>Personal goals</li>
                    <li>Bathroom tracking history</li>
                    <li>Water intake records</li>
                    <li>Food journal entries</li>
                  </ul>
                </div>
                {exportError && (
                  <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {exportError}
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleExportData}
                    disabled={isExporting}
                    className={`w-full rounded-xl px-4 py-3 font-medium text-white transition-colors disabled:opacity-50 ${buttonClass}`}
                  >
                    {isExporting ? 'Preparing Download...' : 'Download My Data'}
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeleteStep('download');
                        setDeleteConfirmText('');
                        setDeleteError(null);
                        setExportError(null);
                      }}
                      className="flex-1 rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setDeleteStep('confirm')}
                      className="flex-1 rounded-xl border-2 border-red-300 bg-white px-4 py-3 font-medium text-red-600 transition-colors hover:bg-red-50 active:bg-red-100 dark:border-red-700 dark:bg-transparent dark:text-red-500 dark:hover:bg-red-900/20"
                    >
                      Skip & Continue
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Step 2: Confirmation
              <>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-500 mb-3">
                  Permanently Delete Account
                </h3>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3 mb-4">
                  <p>
                    <strong className="text-zinc-900 dark:text-zinc-200">This action is irreversible.</strong> By proceeding, you acknowledge and agree to the following:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Your account and all associated data will be <strong className="text-red-600 dark:text-red-400">permanently deleted</strong> from our systems.</li>
                    <li>All tracking history, including bathroom logs, water intake, food journal entries, and physical therapy records, will be erased.</li>
                    <li>Your profile information, personal goals, and any uploaded photos will be removed.</li>
                    <li>Any authentication connections (Google, Facebook, Apple) will be disconnected.</li>
                  </ul>
                  <p className="pt-1">
                    <strong className="text-zinc-900 dark:text-zinc-200">Data recovery is not possible.</strong> Once deleted, your information cannot be restored under any circumstances. You may create a new account in the future, but none of your previous data will be recoverable.
                  </p>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                  To confirm deletion, type <span className="font-mono font-semibold text-red-600 dark:text-red-400">DELETE</span> below:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="mb-4 w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-red-500 focus:outline-none focus:ring-0 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder-zinc-500 dark:focus:border-red-500"
                  disabled={isDeleting}
                />
                {deleteError && (
                  <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                    {deleteError}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setDeleteStep('download');
                      setDeleteConfirmText('');
                      setDeleteError(null);
                    }}
                    disabled={isDeleting}
                    className="flex-1 rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                    className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-medium text-white transition-colors hover:bg-red-600 active:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Avatar Picker Modal */}
      <AvatarPicker
        isOpen={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        onSelect={handleAvatarSelect}
        gender={gender}
      />
    </div>
  );
}
