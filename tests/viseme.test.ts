import { describe, it, expect } from 'vitest';
import { classifyAudioBandToViseme, generateVisemeCues } from '../src/engine/lipsync/visemeMapper';

describe('Viseme Lip-Sync Mapper', () => {
  it('classifies silence below threshold as rest shape X', () => {
    const viseme = classifyAudioBandToViseme({
      lowEnergy: 0.01,
      midEnergy: 0.01,
      highEnergy: 0.01,
      totalRms: 0.02
    });
    expect(viseme).toBe('X');
  });

  it('classifies high-frequency energy as sibilant B', () => {
    const viseme = classifyAudioBandToViseme({
      lowEnergy: 0.1,
      midEnergy: 0.2,
      highEnergy: 0.6,
      totalRms: 0.3
    });
    expect(viseme).toBe('B');
  });

  it('classifies strong mid vowels as open mouth D', () => {
    const viseme = classifyAudioBandToViseme({
      lowEnergy: 0.5,
      midEnergy: 0.7,
      highEnergy: 0.1,
      totalRms: 0.6
    });
    expect(viseme).toBe('D');
  });

  it('generates continuous sequential cues from sample frames', () => {
    const frames = [
      { lowEnergy: 0, midEnergy: 0, highEnergy: 0, totalRms: 0 },
      { lowEnergy: 0, midEnergy: 0, highEnergy: 0, totalRms: 0 },
      { lowEnergy: 0.6, midEnergy: 0.7, highEnergy: 0.1, totalRms: 0.7 },
      { lowEnergy: 0.6, midEnergy: 0.7, highEnergy: 0.1, totalRms: 0.7 },
      { lowEnergy: 0, midEnergy: 0, highEnergy: 0, totalRms: 0 },
    ];
    const cues = generateVisemeCues(frames, 30);
    expect(cues.length).toBeGreaterThanOrEqual(2);
    expect(cues[0].startFrame).toBe(0);
  });
});
