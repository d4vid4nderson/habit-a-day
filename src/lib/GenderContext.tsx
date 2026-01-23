'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Gender } from './types';

interface GenderContextType {
  gender: Gender;
  setGender: (gender: Gender) => void;
}

const GenderContext = createContext<GenderContextType | undefined>(undefined);

const STORAGE_KEY = 'potty-logger-gender';

export function GenderProvider({ children }: { children: ReactNode }) {
  const [gender, setGenderState] = useState<Gender>('male');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Gender | null;
    if (saved === 'male' || saved === 'female') {
      setGenderState(saved);
    }
    setLoaded(true);
  }, []);

  const setGender = (newGender: Gender) => {
    setGenderState(newGender);
    localStorage.setItem(STORAGE_KEY, newGender);
  };

  if (!loaded) {
    return null;
  }

  return (
    <GenderContext.Provider value={{ gender, setGender }}>
      {children}
    </GenderContext.Provider>
  );
}

export function useGender() {
  const context = useContext(GenderContext);
  if (context === undefined) {
    throw new Error('useGender must be used within a GenderProvider');
  }
  return context;
}
