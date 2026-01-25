'use client';

import { useState, useEffect } from 'react';
import { Gender } from '@/lib/types';

interface AvatarPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (avatarUrl: string) => void;
  gender: Gender;
}

export function AvatarPicker({ isOpen, onClose, onSelect, gender }: AvatarPickerProps) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [avatars, setAvatars] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buttonClass = gender === 'female'
    ? 'bg-pink-500 hover:bg-pink-600'
    : 'bg-teal-500 hover:bg-teal-600';
  const selectedRing = gender === 'female'
    ? 'ring-4 ring-pink-500'
    : 'ring-4 ring-teal-500';

  useEffect(() => {
    if (isOpen) {
      // alohe/avatars - professional cartoon avatars on jsDelivr CDN
      // https://github.com/alohe/avatars
      const avatarUrls = [
        // Vibrent style - colorful illustrated avatars
        ...Array.from({ length: 27 }, (_, i) =>
          `https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_${i + 1}.png`
        ),
        // Memo style - clean professional avatars
        ...Array.from({ length: 20 }, (_, i) =>
          `https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_${i + 1}.png`
        ),
      ];
      setAvatars(avatarUrls);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-4 py-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Choose Avatar
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

        {/* Avatar Grid */}
        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(80vh - 140px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-zinc-500">Loading avatars...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-500">{error}</div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {avatars.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedUrl(url)}
                  className={`relative aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 transition-all hover:scale-105 ${
                    selectedUrl === url ? selectedRing : ''
                  }`}
                >
                  <img
                    src={url}
                    alt={`Avatar ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {selectedUrl === url && (
                    <div className={`absolute bottom-1 right-1 h-5 w-5 rounded-full ${buttonClass} flex items-center justify-center`}>
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
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
            disabled={!selectedUrl}
            className={`flex-1 rounded-xl py-3 font-medium text-white transition-colors ${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
}
