'use client';

import { useProfile } from '@/lib/hooks/useProfile';
import { MalePoopIcon } from './MalePoopIcon';
import { MalePeeIcon } from './MalePeeIcon';
import { FemalePoopIcon } from './FemalePoopIcon';
import { FemalePeeIcon } from './FemalePeeIcon';

interface IconProps {
  className?: string;
}

// Simple poop swirl icon - good for small sizes and inline display
export function SimplePoopIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C9.5 2 7.5 3.5 7.5 5.5C7.5 6.5 8 7.3 8.5 8C6.5 8.5 5 10.3 5 12.5C5 13.7 5.5 14.8 6.3 15.6C4.9 16.3 4 17.8 4 19.5C4 21.4 5.6 23 7.5 23H16.5C18.4 23 20 21.4 20 19.5C20 17.8 19.1 16.3 17.7 15.6C18.5 14.8 19 13.7 19 12.5C19 10.3 17.5 8.5 15.5 8C16 7.3 16.5 6.5 16.5 5.5C16.5 3.5 14.5 2 12 2Z"/>
    </svg>
  );
}

// Simple water droplet icon - good for small sizes and inline display
export function SimpleDropletIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z"/>
    </svg>
  );
}

// Detailed toilet figure icons - good for large buttons
export function PoopIcon({ className }: IconProps) {
  const { gender } = useProfile();

  if (gender === 'female') {
    return <FemalePoopIcon className={className} />;
  }
  return <MalePoopIcon className={className} />;
}

export function PeeIcon({ className }: IconProps) {
  const { gender } = useProfile();

  if (gender === 'female') {
    return <FemalePeeIcon className={className} />;
  }
  return <MalePeeIcon className={className} />;
}
