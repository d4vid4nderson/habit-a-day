'use client';

import { useState, useRef, useEffect } from 'react';
import { PhotoCapture } from '../PhotoCapture';
import { getDefaultAvatarUrl } from '@/lib/services/profileService';
import Image from 'next/image';

interface PhotoStepProps {
  avatarUrl: string | null;
  oauthAvatarUrl?: string | null;
  userId: string;
  onAvatarChange: (url: string | null, file?: File) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  gender: 'male' | 'female';
}

export function PhotoStep({
  avatarUrl,
  oauthAvatarUrl,
  userId,
  onAvatarChange,
  onNext,
  onBack,
  onSkip,
  gender,
}: PhotoStepProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buttonClass =
    gender === 'female'
      ? 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700'
      : 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700';
  const skipColor =
    gender === 'female'
      ? 'text-pink-500 hover:text-pink-600'
      : 'text-teal-500 hover:text-teal-600';
  const accentBorder =
    gender === 'female' ? 'border-pink-500' : 'border-teal-500';

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      );
    };
    checkMobile();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onAvatarChange(url, file);
  };

  const handleCameraCapture = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onAvatarChange(url, file);
  };

  const handleUseDefault = () => {
    const defaultUrl = getDefaultAvatarUrl(userId, gender);
    setPreviewUrl(defaultUrl);
    onAvatarChange(defaultUrl);
  };

  const defaultAvatarUrl = getDefaultAvatarUrl(userId, gender);

  // Determine the source of the current photo
  const getPhotoSource = (url: string | null): { label: string; icon: React.ReactNode } | null => {
    if (!url) return null;

    if (url.includes('googleusercontent.com')) {
      return {
        label: 'From Google',
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
        label: 'From Facebook',
        icon: (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        ),
      };
    }

    if (url.includes('appleid.apple.com')) {
      return {
        label: 'From Apple',
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
        label: 'Custom photo',
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
    }

    return null;
  };

  const photoSource = getPhotoSource(previewUrl);

  return (
    <div className="flex flex-col items-center px-4">
      <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Add a profile photo
      </h2>
      <p className="mb-8 text-center text-zinc-500 dark:text-zinc-400">
        Choose a photo or use a generated avatar
      </p>

      {/* Preview */}
      <div className="mb-6 flex flex-col items-center">
        <div
          className={`relative h-32 w-32 overflow-hidden rounded-full border-4 ${
            previewUrl ? accentBorder : 'border-zinc-300 dark:border-zinc-600'
          }`}
        >
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Profile preview"
              fill
              className="object-cover"
              unoptimized={previewUrl.startsWith('blob:') || previewUrl.includes('dicebear') || previewUrl.includes('googleusercontent.com')}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
              <svg
                className="h-16 w-16 text-zinc-400"
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
        {/* Photo source indicator */}
        {photoSource && (
          <div className="mt-3 flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800">
            {photoSource.icon}
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {photoSource.label}
            </span>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="w-full max-w-sm space-y-3">
        {/* Keep OAuth photo button - only show if OAuth avatar exists */}
        {oauthAvatarUrl && (
          <button
            onClick={() => {
              setPreviewUrl(oauthAvatarUrl);
              onAvatarChange(oauthAvatarUrl);
            }}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium text-white transition-colors ${buttonClass}`}
          >
            <div className="relative h-5 w-5 overflow-hidden rounded-full">
              <Image
                src={oauthAvatarUrl}
                alt="Current photo"
                fill
                className="object-cover"
                unoptimized
                referrerPolicy="no-referrer"
              />
            </div>
            Keep Current Photo
          </button>
        )}

        {/* Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Upload Photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Camera button (mobile only) */}
        {isMobile && (
          <button
            onClick={() => setShowCamera(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Take Photo
          </button>
        )}

        {/* Use default avatar */}
        <button
          onClick={handleUseDefault}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          <div className="relative h-5 w-5 overflow-hidden rounded-full">
            <Image
              src={defaultAvatarUrl}
              alt="Default avatar"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          Use Generated Avatar
        </button>

        <div className="mt-8 flex gap-3">
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

        <button
          onClick={onSkip}
          className={`mt-4 w-full py-2 text-sm font-medium transition-colors ${skipColor}`}
        >
          Skip this step
        </button>
      </div>

      {/* Camera modal */}
      <PhotoCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
        gender={gender}
      />
    </div>
  );
}
