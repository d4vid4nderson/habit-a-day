'use client';

import { useState } from 'react';
import { BathroomType } from '@/lib/types';
import { PoopIcon, PeeIcon } from './icons/BathroomIcons';
import { useProfile } from '@/lib/hooks/useProfile';

interface LogButtonProps {
  type: BathroomType;
  onLog: (type: BathroomType) => void;
}

const maleConfig = {
  poop: {
    bg: 'bg-teal-600 dark:bg-teal-900/30',
    activeBg: 'bg-teal-700 dark:bg-teal-800/50',
    ring: 'ring-teal-400',
    iconColor: 'text-teal-100 dark:text-teal-400',
  },
  pee: {
    bg: 'bg-blue-600 dark:bg-blue-900/30',
    activeBg: 'bg-blue-700 dark:bg-blue-800/50',
    ring: 'ring-blue-400',
    iconColor: 'text-blue-100 dark:text-blue-400',
  },
};

const femaleConfig = {
  poop: {
    bg: 'bg-pink-600 dark:bg-pink-900/30',
    activeBg: 'bg-pink-700 dark:bg-pink-800/50',
    ring: 'ring-pink-400',
    iconColor: 'text-pink-100 dark:text-pink-400',
  },
  pee: {
    bg: 'bg-purple-600 dark:bg-purple-900/30',
    activeBg: 'bg-purple-700 dark:bg-purple-800/50',
    ring: 'ring-purple-400',
    iconColor: 'text-purple-100 dark:text-purple-400',
  },
};

export function LogButton({ type, onLog }: LogButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const { gender } = useProfile();
  const config = gender === 'female' ? femaleConfig : maleConfig;
  const { bg, activeBg, ring, iconColor } = config[type];

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
      <div className={`flex flex-col items-center transition-transform ${isPressed ? 'scale-90' : ''} ${iconColor}`}>
        {type === 'poop' ? (
          <PoopIcon className="w-[12rem] h-[12rem]" />
        ) : (
          <PeeIcon className="w-[12rem] h-[12rem]" />
        )}
        <span className="w-[12rem] text-center text-[3.5rem] font-black uppercase leading-none tracking-tight">
          {type === 'poop' ? "POOP'D" : "PEE'D"}
        </span>
      </div>
    </button>
  );
}
