export type AudioCategoryType = 'music' | 'sfx' | 'voice' | 'song' | 'upload';

export interface AutoDraftAudioClip {
  id: string;
  name: string;
  url: string;                  // Remote URL or local blob
  startTime: number;            // Start position on timeline in seconds
  duration: number;             // Duration on timeline in seconds
  offset?: number;              // In-point offset into source file (for trimming)
  sourceDuration?: number;      // Original total file length
  volume: number;               // 0.0 to 1.5 (gain)
  speed?: number;               // 0.5 to 2.0
  fadeIn?: number;              // In seconds (0 to 3)
  fadeOut?: number;             // In seconds (0 to 3)
  isDeleted?: boolean;
  category: AudioCategoryType;
  lipSyncEnabled?: boolean;
  lipSyncJobState?: string | null;
  lipSyncJsonUrl?: string | null;
  targetCharacterId?: string;
}

export interface AutoDraftAudioTrack {
  id: string;
  name: string;
  type: 'AUDIO';
  trackIndex: number;
  isMuted: boolean;
  isSolo: boolean;
  isLocked: boolean;
  volume: number;               // Master track volume multiplier
  clips: AutoDraftAudioClip[];
}

// Backwards-compatible single-clip representation
export interface ActiveAudioTrack extends AutoDraftAudioClip {
  isMuted: boolean;
  isLocked?: boolean;
  targetCharacterId?: string;
}

export interface StockAudioTrack {
  id: string;
  name: string;
  title?: string;
  raw_id?: number;
  duration: string;
  durationSeconds: number;
  category: string;
  type: 'music' | 'sfx' | 'song';
  tags?: string;
  s3_url?: string;
  created_at?: string;
  url?: string;
  thumbnailUrl?: string | null;
  generate?: () => string;      // Fallback synthetic WAV generator
}

export interface VisualOverlayEffect {
  id: number | string;
  title: string;
  type: 'overlay-effect' | 'filter' | 'transition';
  blendMode: 'SCREEN' | 'MULTIPLY' | 'ADDITIVE' | 'NORMAL';
  s3Url: string;
  thumbnailUrl?: string | null;
  tags?: string | null;
  opacity?: number;
  speed?: number;
}
