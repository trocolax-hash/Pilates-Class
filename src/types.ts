export interface PilatesClass {
  id: string;
  name: string;
  // Map of block ID (1-6) to lists of selected exercise names
  blocks: {
    [blockId: number]: string[];
  };
  createdAt: string;
}

export interface BlockConfig {
  id: number;
  name: string;
  allExercises: string[];
}

export interface PlaybackState {
  isPlaying: boolean;
  totalElapsedSeconds: number; // 0 to 3600 (60 minutes)
  simulationSpeed: number; // coefficients like 1, 10, 60
}
