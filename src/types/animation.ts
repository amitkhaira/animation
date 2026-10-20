export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'step';

export interface Keyframe<T = number> {
  id: string;
  frame: number;
  value: T;
  easing: EasingType;
}

export type TrackTarget = 'boneRotation' | 'bonePositionX' | 'bonePositionY' | 'cameraX' | 'cameraY' | 'cameraZoom' | 'layerOpacity';

export interface AnimationTrack {
  id: string;
  targetType: TrackTarget;
  targetId: string; // boneId or layerId or 'camera'
  name: string;
  keyframes: Keyframe[];
}

export interface AnimationClip {
  id: string;
  name: string;
  durationFrames: number;
  tracks: AnimationTrack[];
}
