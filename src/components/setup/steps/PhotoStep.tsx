'use client';

import { useState, useRef, useEffect } from 'react';
import { PhotoCapture } from '../PhotoCapture';
import { getDefaultAvatarUrl } from '@/lib/services/profileService';
import Image from 'next/image';

interface PhotoStepProps {
  avatarUrl: string | null;
  userId: string;
  onAvatarChange: (url: string | null, file?: File) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  gender: 'male' | 'female';
}

export function PhotoStep({
  avatarUrl,
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
              unoptimized={previewUrl.startsWith('blob:') || previewUrl.includes('dicebear')}
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
      </div>

      {/* Options */}
      <div className="w-full max-w-sm space-y-3">
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
