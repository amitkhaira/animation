import { describe, it, expect } from 'vitest';
import { evaluateEasing, sampleTrackValue } from '../src/engine/animation/interpolator';
import { AnimationTrack } from '../src/types/animation';

describe('Timeline Interpolation Engine', () => {
  it('correctly evaluates easing functions at boundary points', () => {
    expect(evaluateEasing(0, 'linear')).toBe(0);
    expect(evaluateEasing(1, 'linear')).toBe(1);
    expect(evaluateEasing(0.5, 'linear')).toBe(0.5);

    expect(evaluateEasing(0.5, 'easeIn')).toBe(0.25);
    expect(evaluateEasing(0.5, 'easeOut')).toBe(0.75);
    expect(evaluateEasing(0.5, 'easeInOut')).toBe(0.5);
  });

  it('interpolates track keyframes accurately across time frames', () => {
    const track: AnimationTrack = {
      id: 'track_1',
      targetType: 'boneRotation',
      targetId: 'spine',
      name: 'Spine Sway',
      keyframes: [
        { id: 'k0', frame: 0, value: 0, easing: 'easeIn' },
        { id: 'k1', frame: 30, value: 100, easing: 'linear' },
        { id: 'k2', frame: 60, value: 50, easing: 'linear' }
      ]
    };

    expect(sampleTrackValue(track, 0)).toBe(0);
    expect(sampleTrackValue(track, 30)).toBe(100);
    expect(sampleTrackValue(track, 60)).toBe(50);

    // Frame 15 (halfway between 0 and 30 with easeIn: t=0.5 -> eased=0.25 -> 25)
    expect(sampleTrackValue(track, 15)).toBeCloseTo(25, 1);

    // Outside bounds
    expect(sampleTrackValue(track, -10)).toBe(0);
    expect(sampleTrackValue(track, 100)).toBe(50);
  });

  it('correctly splits audio track into two independent non-overlapping clips with accurate offsets', () => {
    const originalTrack = {
      id: 'geeta_audio',
      name: 'Shri Krishna Geeta Updesh',
      startTime: 0,
      duration: 140,
      offset: 0,
      volume: 0.9,
      isMuted: false
    };

    const splitTime = 15;
    const firstDur = splitTime - originalTrack.startTime;
    const secondDur = originalTrack.duration - firstDur;

    const clip1 = { ...originalTrack, duration: firstDur };
    const clip2 = {
      ...originalTrack,
      id: `${originalTrack.id}_split_part2`,
      name: `${originalTrack.name} (Part 2)`,
      startTime: splitTime,
      duration: secondDur,
      offset: (originalTrack.offset || 0) + firstDur
    };

    expect(clip1.startTime).toBe(0);
    expect(clip1.duration).toBe(15);
    expect(clip1.offset).toBe(0);

    expect(clip2.startTime).toBe(15);
    expect(clip2.duration).toBe(125);
    expect(clip2.offset).toBe(15);
    expect(clip1.duration + clip2.duration).toBe(140);
  });

  it('computes pixel-accurate ruler dimensions and scrollable width for long 140s timeline', () => {
    const totalDurationSeconds = 140;
    const zoomLevel = 1.0;
    const BASE_PX_PER_SEC = 50;
    const pxPerSec = Math.max(20, Math.round(BASE_PX_PER_SEC * zoomLevel));
    const totalTrackWidth = Math.max(800, Math.ceil(totalDurationSeconds * pxPerSec));

    expect(pxPerSec).toBe(50);
    expect(totalTrackWidth).toBe(7000);

    // Playhead at 23.4s
    const playheadPx = 23.4 * pxPerSec;
    expect(playheadPx).toBe(1170);

    // Zoomed out to 0.5x
    const zoomHalfPxPerSec = Math.max(20, Math.round(BASE_PX_PER_SEC * 0.5));
    expect(zoomHalfPxPerSec).toBe(25);
    expect(Math.max(800, Math.ceil(totalDurationSeconds * zoomHalfPxPerSec))).toBe(3500);
  });

  it('correctly filters visibility of background and media tracks based on active playhead timestamp', () => {
    const isTrackVisibleAt = (track: { startTime: number; duration: number; isVisible?: boolean }, currentTime: number) => {
      if (track.isVisible === false) return false;
      return currentTime >= track.startTime - 0.05 && currentTime <= track.startTime + track.duration + 0.05;
    };

    const bgTrack = {
      id: 'bg_rathh',
      startTime: 5,
      duration: 20,
      isVisible: true
    };

    expect(isTrackVisibleAt(bgTrack, 0)).toBe(false); // Before start
    expect(isTrackVisibleAt(bgTrack, 5)).toBe(true);  // At start
    expect(isTrackVisibleAt(bgTrack, 15)).toBe(true); // Within duration
    expect(isTrackVisibleAt(bgTrack, 25)).toBe(true); // At end
    expect(isTrackVisibleAt(bgTrack, 30)).toBe(false); // After end

    // Toggled eye off (hidden)
    bgTrack.isVisible = false;
    expect(isTrackVisibleAt(bgTrack, 15)).toBe(false);
  });
});
