'use client';

import { useGender } from '@/lib/GenderContext';
import { MalePoopIcon } from './MalePoopIcon';
import { MalePeeIcon } from './MalePeeIcon';
import { FemalePoopIcon } from './FemalePoopIcon';
import { FemalePeeIcon } from './FemalePeeIcon';

interface IconProps {
  className?: string;
}

export function PoopIcon({ className }: IconProps) {
  const { gender } = useGender();

  if (gender === 'female') {
    return <FemalePoopIcon className={className} />;
  }
  return <MalePoopIcon className={className} />;
}

export function PeeIcon({ className }: IconProps) {
  const { gender } = useGender();

  if (gender === 'female') {
    return <FemalePeeIcon className={className} />;
  }
  return <MalePeeIcon className={className} />;
}
