'use client';

interface PoopIconProps {
  className?: string;
}

export function PoopIcon({ className = "w-24 h-24" }: PoopIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
    >
      {/* Head */}
      <circle cx="58" cy="18" r="10" />

      {/* Body/Torso */}
      <path d="M45 28 C35 35, 32 50, 35 58 L50 55 L55 35 C55 30, 50 28, 45 28" />

      {/* Arm */}
      <path d="M35 40 C25 42, 22 55, 28 60 C32 58, 35 50, 38 45" />

      {/* Upper leg */}
      <path d="M35 58 L55 62 L60 55 L50 55 Z" />

      {/* Lower leg */}
      <path d="M55 62 C58 72, 62 80, 70 85 C74 82, 72 78, 68 75 C64 72, 62 68, 60 62" />

      {/* Toilet bowl */}
      <path d="M20 65 L20 85 C20 92, 28 95, 45 95 L50 95 C55 95, 58 92, 58 88 L58 65 C58 62, 55 60, 50 60 L28 60 C23 60, 20 62, 20 65" />

      {/* Toilet tank */}
      <rect x="58" y="55" width="12" height="30" rx="2" />
    </svg>
  );
}
