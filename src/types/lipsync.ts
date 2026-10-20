// Standard Rhubarb 9-viseme set
export type VisemeType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'X';

export interface VisemeCue {
  id: string;
  startFrame: number;
  endFrame: number;
  viseme: VisemeType;
  intensity: number; // 0.0 to 1.0
}

export interface AudioTrack {
  id: string;
  name: string;
  audioUrl: string;
  durationSeconds: number;
  sampleRate: number;
  cues: VisemeCue[];
  waveformPoints?: number[];
}
