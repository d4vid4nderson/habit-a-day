'use client';

import { useState } from 'react';
import { BathroomType } from '@/lib/types';

interface LogButtonProps {
  type: BathroomType;
  onLog: (type: BathroomType) => void;
}

const config = {
  poop: {
    emoji: '💩',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    activeBg: 'bg-amber-200 dark:bg-amber-800/50',
    ring: 'ring-amber-400',
  },
  pee: {
    emoji: '🍆',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    activeBg: 'bg-purple-200 dark:bg-purple-800/50',
    ring: 'ring-purple-400',
  },
};

export function LogButton({ type, onLog }: LogButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { emoji, bg, activeBg, ring } = config[type];

  const handleClick = () => {
    onLog(type);
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 1000);
  };

  return (
    <button
      onClick={handleClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`relative flex aspect-square w-full flex-1 items-center justify-center rounded-3xl transition-all duration-150 ${
        isPressed ? `${activeBg} scale-95 ${ring} ring-4` : bg
      } ${showConfirm ? 'ring-4 ring-emerald-500' : ''}`}
    >
      <span className={`text-8xl transition-transform ${isPressed ? 'scale-90' : ''}`}>
        {showConfirm ? '✓' : emoji}
      </span>
    </button>
  );
}
