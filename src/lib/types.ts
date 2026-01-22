export type BathroomType = 'poop' | 'pee';

export interface BathroomEntry {
  id: string;
  type: BathroomType;
  timestamp: number; // Unix timestamp
  notes?: string;
}

export interface TrackerData {
  entries: BathroomEntry[];
}
