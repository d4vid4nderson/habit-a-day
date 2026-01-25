'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { createClient, hasSupabaseConfig } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  // Get supabase client lazily
  const getSupabase = () => {
    if (!supabaseRef.current && typeof window !== 'undefined' && hasSupabaseConfig()) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  };

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    // Check if we have Supabase configuration
    if (!hasSupabaseConfig()) {
      console.warn('Supabase not configured. Running in demo mode.');
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getRedirectUrl = () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    return `${siteUrl}/auth/callback`;
  };

  const signInWithGoogle = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectUrl(),
      },
    });
  };

  const signInWithFacebook = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: getRedirectUrl(),
      },
    });
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ error: string | null }> => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Supabase not configured' };

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Please check your email and click the confirmation link before signing in.' };
      }
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Invalid email or password. Please try again.' };
      }
      return { error: error.message };
    }

    return { error: null };
  };

  const signUpWithEmail = async (email: string, password: string): Promise<{ error: string | null; needsConfirmation: boolean }> => {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Supabase not configured', needsConfirmation: false };

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getRedirectUrl(),
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { error: 'An account with this email already exists. Please sign in instead.', needsConfirmation: false };
      }
      return { error: error.message, needsConfirmation: false };
    }

    // Check if email confirmation is required
    // Supabase returns a user but with identities as null/empty if confirmation is pending
    const needsConfirmation = !data.session;

    return { error: null, needsConfirmation };
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signInWithFacebook,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
