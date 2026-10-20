import { Keyframe, EasingType, AnimationTrack } from '../../types/animation';

/**
 * Standard animation easing functions.
 */
export function evaluateEasing(t: number, easing: EasingType): number {
  const clamped = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'linear':
      return clamped;
    case 'easeIn':
      return clamped * clamped;
    case 'easeOut':
      return clamped * (2 - clamped);
    case 'easeInOut':
      return clamped < 0.5
        ? 2 * clamped * clamped
        : -1 + (4 - 2 * clamped) * clamped;
    case 'step':
      return clamped >= 1.0 ? 1.0 : 0.0;
    default:
      return clamped;
  }
}

/**
 * Interpolates value for a given frame across sorted keyframes.
 */
export function sampleTrackValue(track: AnimationTrack, frame: number, defaultValue = 0): number {
  const { keyframes } = track;
  if (!keyframes || keyframes.length === 0) {
    return defaultValue;
  }

  // Before first keyframe
  if (frame <= keyframes[0].frame) {
    return keyframes[0].value;
  }

  // After last keyframe
  if (frame >= keyframes[keyframes.length - 1].frame) {
    return keyframes[keyframes.length - 1].value;
  }

  // Find surrounding keyframe pair
  for (let i = 0; i < keyframes.length - 1; i++) {
    const k0 = keyframes[i];
    const k1 = keyframes[i + 1];

    if (frame >= k0.frame && frame <= k1.frame) {
      const duration = k1.frame - k0.frame;
      if (duration === 0) return k0.value;

      const progress = (frame - k0.frame) / duration;
      const easedT = evaluateEasing(progress, k0.easing);
      return k0.value + (k1.value - k0.value) * easedT;
    }
  }

  return defaultValue;
}
