export type BathroomType = 'poop' | 'pee';

export interface BathroomEntry {
  id: string;
  type: BathroomType;
  timestamp: number; // Unix timestamp
}

export interface TrackerData {
  entries: BathroomEntry[];
}
