import { VisemeCue, VisemeType } from '../../types/lipsync';

/**
 * Phoneme-to-Viseme mapping table following Rhubarb / Disney standards:
 * A: Closed mouth (m, b, p)
 * B: Slightly open, teeth together (s, z, t, d, k, g)
 * C: Wide open, vowels like 'eh', 'ae'
 * D: Deep open, vowels like 'ah', 'aa'
 * E: Rounded open, 'oh', 'ao'
 * F: Puckered narrow, 'oo', 'uw', 'w'
 * G: Teeth touching bottom lip (f, v)
 * H: Tongue behind teeth (l, th)
 * X: Idle / Rest closed
 */

export interface AudioFrequencyBand {
  lowEnergy: number;   // 100-500 Hz (fundamental vowel pitch)
  midEnergy: number;   // 500-2500 Hz (formants, vowels)
  highEnergy: number;  // 2500-8000 Hz (fricatives, sibilants s, t, z)
  totalRms: number;    // Overall volume
}

/**
 * Classifies an audio energy sample into a corresponding viseme mouth shape.
 */
export function classifyAudioBandToViseme(band: AudioFrequencyBand): VisemeType {
  // If silent or below threshold -> Rest
  if (band.totalRms < 0.05) {
    return 'X';
  }

  // Strong high frequency energy (sibilants like 's', 'z', 't')
  if (band.highEnergy > 0.4 && band.highEnergy > band.midEnergy) {
    return 'B';
  }

  // Strong mid + high balance with lower overall RMS (f, v)
  if (band.highEnergy > 0.3 && band.totalRms < 0.3) {
    return 'G';
  }

  // High volume, strong mid energy (wide open vowels: A, E)
  if (band.midEnergy > 0.5 && band.totalRms > 0.4) {
    return band.lowEnergy > 0.4 ? 'D' : 'C';
  }

  // Strong low energy, rounded vowels (O, U)
  if (band.lowEnergy > 0.5) {
    return band.totalRms > 0.5 ? 'E' : 'F';
  }

  // Default speaking articulation
  return 'C';
}

/**
 * Generates timed viseme cues from an array of frequency analysis frames.
 */
export function generateVisemeCues(
  bands: AudioFrequencyBand[],
  fps: number = 30
): VisemeCue[] {
  const cues: VisemeCue[] = [];
  let currentViseme: VisemeType = 'X';
  let startFrame = 0;
  let maxIntensity = 0;

  bands.forEach((band, frameIdx) => {
    const viseme = classifyAudioBandToViseme(band);

    if (viseme !== currentViseme || frameIdx === bands.length - 1) {
      if (frameIdx > startFrame) {
        cues.push({
          id: `cue_${startFrame}_${frameIdx}`,
          startFrame,
          endFrame: frameIdx,
          viseme: currentViseme,
          intensity: Math.min(1.0, Math.max(0.2, maxIntensity))
        });
      }
      currentViseme = viseme;
      startFrame = frameIdx;
      maxIntensity = band.totalRms;
    } else {
      maxIntensity = Math.max(maxIntensity, band.totalRms);
    }
  });

  return cues;
}
