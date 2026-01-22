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
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    activeBg: 'bg-cyan-200 dark:bg-cyan-800/50',
    ring: 'ring-cyan-400',
  },
  pee: {
    emoji: '🍆',
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    activeBg: 'bg-violet-200 dark:bg-violet-800/50',
    ring: 'ring-violet-400',
  },
};

export function LogButton({ type, onLog }: LogButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const { emoji, bg, activeBg, ring } = config[type];

  return (
    <button
      onClick={() => onLog(type)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`relative flex aspect-square w-full flex-1 items-center justify-center rounded-3xl transition-all duration-150 ${
        isPressed ? `${activeBg} scale-95 ${ring} ring-4` : bg
      }`}
    >
      <span className={`text-8xl transition-transform ${isPressed ? 'scale-90' : ''}`}>
        {emoji}
      </span>
    </button>
  );
}
