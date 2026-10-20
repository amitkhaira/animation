import { Keyframe } from '../../types/animation';

export interface MotionPreset {
  id: string;
  name: string;
  category: 'walk' | 'gesture' | 'idle' | 'emotion';
  description: string;
  durationFrames: number;
  tracks: {
    targetId: string; // boneId
    keyframes: Keyframe[];
  }[];
}

export const BUILTIN_MOTION_PRESETS: MotionPreset[] = [
  {
    id: 'preset_walk_cycle',
    name: 'Standard Walk Cycle',
    category: 'walk',
    description: 'Natural cyclic 2-step bipedal walk animation',
    durationFrames: 60,
    tracks: [
      {
        targetId: 'leftUpperLeg',
        keyframes: [
          { id: 'w1', frame: 0, value: Math.PI / 2 + 0.4, easing: 'easeInOut' },
          { id: 'w2', frame: 30, value: Math.PI / 2 - 0.4, easing: 'easeInOut' },
          { id: 'w3', frame: 60, value: Math.PI / 2 + 0.4, easing: 'easeInOut' }
        ]
      },
      {
        targetId: 'rightUpperLeg',
        keyframes: [
          { id: 'w4', frame: 0, value: Math.PI / 2 - 0.4, easing: 'easeInOut' },
          { id: 'w5', frame: 30, value: Math.PI / 2 + 0.4, easing: 'easeInOut' },
          { id: 'w6', frame: 60, value: Math.PI / 2 - 0.4, easing: 'easeInOut' }
        ]
      },
      {
        targetId: 'spine',
        keyframes: [
          { id: 'w7', frame: 0, value: -Math.PI / 2 + 0.05, easing: 'easeInOut' },
          { id: 'w8', frame: 15, value: -Math.PI / 2 - 0.05, easing: 'easeInOut' },
          { id: 'w9', frame: 30, value: -Math.PI / 2 + 0.05, easing: 'easeInOut' },
          { id: 'w10', frame: 45, value: -Math.PI / 2 - 0.05, easing: 'easeInOut' },
          { id: 'w11', frame: 60, value: -Math.PI / 2 + 0.05, easing: 'easeInOut' }
        ]
      }
    ]
  },
  {
    id: 'preset_hand_wave',
    name: 'Friendly Wave',
    category: 'gesture',
    description: 'Waves right hand high to greet audience',
    durationFrames: 45,
    tracks: [
      {
        targetId: 'rightUpperArm',
        keyframes: [
          { id: 'hw1', frame: 0, value: -Math.PI / 1.2, easing: 'easeOut' },
          { id: 'hw2', frame: 45, value: -Math.PI / 1.2, easing: 'linear' }
        ]
      },
      {
        targetId: 'rightForearm',
        keyframes: [
          { id: 'hw3', frame: 0, value: -0.8, easing: 'easeInOut' },
          { id: 'hw4', frame: 12, value: 0.4, easing: 'easeInOut' },
          { id: 'hw5', frame: 24, value: -0.8, easing: 'easeInOut' },
          { id: 'hw6', frame: 36, value: 0.4, easing: 'easeInOut' },
          { id: 'hw7', frame: 45, value: -0.4, easing: 'easeInOut' }
        ]
      }
    ]
  },
  {
    id: 'preset_idle_breath',
    name: 'Idle Breathing & Sway',
    category: 'idle',
    description: 'Subtle chest expansion and natural body posture shift',
    durationFrames: 60,
    tracks: [
      {
        targetId: 'spine',
        keyframes: [
          { id: 'b1', frame: 0, value: -Math.PI / 2, easing: 'easeInOut' },
          { id: 'b2', frame: 30, value: -Math.PI / 2 + 0.08, easing: 'easeInOut' },
          { id: 'b3', frame: 60, value: -Math.PI / 2, easing: 'easeInOut' }
        ]
      },
      {
        targetId: 'neck',
        keyframes: [
          { id: 'b4', frame: 0, value: 0, easing: 'easeInOut' },
          { id: 'b5', frame: 30, value: -0.05, easing: 'easeInOut' },
          { id: 'b6', frame: 60, value: 0, easing: 'easeInOut' }
        ]
      }
    ]
  }
];
