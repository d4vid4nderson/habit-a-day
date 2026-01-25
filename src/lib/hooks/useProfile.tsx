'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Gender } from '@/lib/types';
import {
  UserProfile,
  Theme,
  getOrCreateProfile,
  updateProfile as updateProfileService,
  acceptTerms as acceptTermsService,
  hasAcceptedCurrentTerms,
  CURRENT_TERMS_VERSION,
} from '@/lib/services/profileService';

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

interface ProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  gender: Gender;
  theme: Theme;
  profileCompleted: boolean;
  termsAccepted: boolean;
  termsVersion: string;
  updateGender: (gender: Gender) => Promise<void>;
  updateTheme: (theme: Theme) => Promise<void>;
  acceptTerms: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getOrCreateProfile(
        user.id,
        user.email ?? null,
        user.user_metadata?.full_name ?? null
      );
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch profile on mount and when user changes
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Apply theme when profile loads or theme changes
  useEffect(() => {
    if (profile?.theme) {
      applyTheme(profile.theme);
    }
  }, [profile?.theme]);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const updateGender = useCallback(
    async (gender: Gender) => {
      if (!user || !profile) return;

      // Optimistic update
      const previousProfile = profile;
      setProfile((prev) => (prev ? { ...prev, gender } : null));

      try {
        const updated = await updateProfileService(user.id, { gender });
        setProfile(updated);
      } catch (err) {
        // Rollback on error
        setProfile(previousProfile);
        throw err;
      }
    },
    [user, profile]
  );

  const updateTheme = useCallback(
    async (theme: Theme) => {
      if (!user || !profile) return;

      // Optimistic update
      const previousProfile = profile;
      setProfile((prev) => (prev ? { ...prev, theme } : null));

      try {
        const updated = await updateProfileService(user.id, { theme });
        setProfile(updated);
      } catch (err) {
        // Rollback on error
        setProfile(previousProfile);
        throw err;
      }
    },
    [user, profile]
  );

  const acceptTerms = useCallback(async () => {
    if (!user || !profile) return;

    try {
      const updated = await acceptTermsService(user.id);
      setProfile(updated);
    } catch (err) {
      throw err;
    }
  }, [user, profile]);

  const value: ProfileContextType = {
    profile,
    loading,
    error,
    gender: profile?.gender ?? 'male',
    theme: profile?.theme ?? 'system',
    profileCompleted: profile?.profile_completed ?? false,
    termsAccepted: hasAcceptedCurrentTerms(profile),
    termsVersion: CURRENT_TERMS_VERSION,
    updateGender,
    updateTheme,
    acceptTerms,
    refreshProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
