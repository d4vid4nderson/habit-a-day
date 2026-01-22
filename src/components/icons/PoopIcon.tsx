'use client';

import Image from 'next/image';

interface PoopIconProps {
  className?: string;
}

export function PoopIcon({ className = "w-24 h-24" }: PoopIconProps) {
  return (
    <Image
      src="/poop.svg"
      alt="Poop"
      width={96}
      height={96}
      className={className}
    />
  );
}
