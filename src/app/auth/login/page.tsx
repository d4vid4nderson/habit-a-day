'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Link from 'next/link';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithFacebook, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Check for error in URL params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validate email
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    // Validate password
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsSubmitting(false);
      return;
    }

    if (isSignUp) {
      // Validate confirm password
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setIsSubmitting(false);
        return;
      }

      const { error, needsConfirmation } = await signUpWithEmail(email, password);
      if (error) {
        setError(error);
      } else if (needsConfirmation) {
        setShowConfirmation(true);
      }
    } else {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setError(error);
      }
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-zinc-50 dark:from-zinc-950 dark:via-teal-950/20 dark:to-zinc-950">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  // Show confirmation message after successful sign up
  if (showConfirmation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-zinc-50 px-4 dark:from-zinc-950 dark:via-teal-950/20 dark:to-zinc-950">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30">
            <svg className="h-8 w-8 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Check your email
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            We sent a confirmation link to <strong>{email}</strong>. Click the link in the email to verify your account.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Didn&apos;t receive the email? Check your spam folder or try signing up again.
          </p>
          <button
            onClick={() => {
              setShowConfirmation(false);
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-zinc-50 px-4 dark:from-zinc-950 dark:via-teal-950/20 dark:to-zinc-950">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo/Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent">
            Habit-a-Day
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Start your journey to healing one day at a time
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-xl bg-red-100 p-4 text-center text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          {isSignUp && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-teal-500 px-4 py-3 font-medium text-white shadow-sm transition-colors hover:bg-teal-600 active:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {/* Toggle sign up / sign in */}
        <div className="text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setConfirmPassword('');
            }}
            className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-300 dark:border-zinc-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gradient-to-br from-teal-50 via-cyan-50 to-zinc-50 px-4 text-zinc-500 dark:from-zinc-950 dark:via-teal-950/20 dark:to-zinc-950 dark:text-zinc-400">
              or continue with
            </span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <GoogleIcon className="h-5 w-5" />
            Continue with Google
          </button>

          <button
            onClick={signInWithFacebook}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#1877F2] px-4 py-3 font-medium text-white shadow-sm transition-colors hover:bg-[#166FE5] active:bg-[#1469D8]"
          >
            <FacebookIcon className="h-5 w-5" />
            Continue with Facebook
          </button>
        </div>

        {/* Privacy note */}
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="text-teal-600 hover:underline dark:text-teal-400">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-teal-600 hover:underline dark:text-teal-400">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
