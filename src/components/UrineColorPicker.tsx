'use client';

import { useState } from 'react';
import { UrineColor, URINE_COLORS } from '@/lib/types';
import { Gender } from '@/lib/types';

interface UrineColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (color: UrineColor) => void;
  gender: Gender;
}

export function UrineColorPicker({ isOpen, onClose, onSelect, gender }: UrineColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState<UrineColor | null>(null);

  const buttonClass = gender === 'female'
    ? 'bg-pink-500 hover:bg-pink-600'
    : 'bg-teal-500 hover:bg-teal-600';
  const selectedRing = gender === 'female'
    ? 'ring-4 ring-pink-500'
    : 'ring-4 ring-teal-500';

  if (!isOpen) return null;

  const handleSelect = () => {
    if (selectedColor) {
      onSelect(selectedColor);
      onClose();
      setSelectedColor(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hydrated':
        return 'text-green-600 dark:text-green-400';
      case 'Mildly Dehydrated':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'Dehydrated':
        return 'text-orange-600 dark:text-orange-400';
      case 'Very Dehydrated':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-zinc-600 dark:text-zinc-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-4 py-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Urine Color
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Color Options */}
        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Select the color that best matches your urine to track hydration.
          </p>
          <div className="space-y-2">
            {URINE_COLORS.map((item) => (
              <button
                key={item.level}
                onClick={() => setSelectedColor(item.level)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-all ${
                  selectedColor === item.level
                    ? `${selectedRing} border-transparent`
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                {/* Color Circle */}
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-zinc-300 dark:border-zinc-600"
                  style={{ backgroundColor: item.color }}
                />

                {/* Labels */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {item.level}. {item.label}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                {/* Checkmark */}
                {selectedColor === item.level && (
                  <div className={`w-6 h-6 rounded-full ${buttonClass} flex items-center justify-center`}>
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-zinc-200 dark:border-zinc-700 px-4 py-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-zinc-300 dark:border-zinc-600 py-3 font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedColor}
            className={`flex-1 rounded-xl py-3 font-medium text-white transition-colors ${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Log Pee
          </button>
        </div>
      </div>
    </div>
  );
}
