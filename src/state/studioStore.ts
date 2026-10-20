import { AnimCraftProject, ProjectScene, CameraState } from '../types/project';
import { CharacterPuppet } from '../types/skeleton';
import { AnimationTrack, Keyframe } from '../types/animation';
import { AudioTrack, VisemeCue } from '../types/lipsync';
import { createDefaultBipedSkeleton } from '../engine/skeleton/skeleton';
import { sampleTrackValue } from '../engine/animation/interpolator';

export type ToolMode = 'select' | 'bone_rotate' | 'ik_drag' | 'pan_canvas';

export interface StudioState {
  project: AnimCraftProject;
  activeSceneId: string;
  selectedPuppetId: string | null;
  selectedBoneId: string | null;
  selectedTrackId: string | null;
  toolMode: ToolMode;
  isPlaying: boolean;
  playbackSpeed: number;
}

// Initial state creator
export function createInitialStudioState(): StudioState {
  const initialPuppet: CharacterPuppet = {
    id: 'puppet_1',
    name: 'Hero Character',
    templateId: 'hero_humanoid',
    skeleton: createDefaultBipedSkeleton()
  };

  const initialTracks: AnimationTrack[] = [
    {
      id: 'track_spine_rot',
      targetType: 'boneRotation',
      targetId: 'spine',
      name: 'Spine Breathing',
      keyframes: [
        { id: 'k0', frame: 0, value: -Math.PI / 2, easing: 'easeInOut' },
        { id: 'k1', frame: 30, value: -Math.PI / 2 + 0.08, easing: 'easeInOut' },
        { id: 'k2', frame: 60, value: -Math.PI / 2, easing: 'easeInOut' }
      ]
    },
    {
      id: 'track_arm_rot',
      targetType: 'boneRotation',
      targetId: 'rightForearm',
      name: 'Right Arm Wave',
      keyframes: [
        { id: 'k3', frame: 0, value: -0.2, easing: 'easeInOut' },
        { id: 'k4', frame: 15, value: -1.2, easing: 'easeInOut' },
        { id: 'k5', frame: 30, value: -0.2, easing: 'easeInOut' },
        { id: 'k6', frame: 45, value: -1.2, easing: 'easeInOut' },
        { id: 'k7', frame: 60, value: -0.2, easing: 'easeInOut' }
      ]
    }
  ];

  const sampleAudio: AudioTrack = {
    id: 'audio_voice_1',
    name: 'Dialogue Voice Track',
    audioUrl: '',
    durationSeconds: 2.0,
    sampleRate: 44100,
    cues: [
      { id: 'c0', startFrame: 0, endFrame: 10, viseme: 'X', intensity: 0.1 },
      { id: 'c1', startFrame: 10, endFrame: 22, viseme: 'C', intensity: 0.8 },
      { id: 'c2', startFrame: 22, endFrame: 35, viseme: 'D', intensity: 0.9 },
      { id: 'c3', startFrame: 35, endFrame: 45, viseme: 'E', intensity: 0.7 },
      { id: 'c4', startFrame: 45, endFrame: 60, viseme: 'X', intensity: 0.1 }
    ]
  };

  const initialScene: ProjectScene = {
    id: 'scene_1',
    name: 'Scene 01: Hero Introduction',
    fps: 30,
    totalFrames: 120,
    currentFrame: 0,
    camera: { x: 0, y: 0, zoom: 1.0, rotation: 0 },
    puppets: [initialPuppet],
    tracks: initialTracks,
    audioTracks: [sampleAudio]
  };

  return {
    project: {
      id: 'proj_1',
      title: 'My 2D AI Animation',
      scenes: [initialScene],
      activeSceneId: 'scene_1'
    },
    activeSceneId: 'scene_1',
    selectedPuppetId: 'puppet_1',
    selectedBoneId: 'spine',
    selectedTrackId: 'track_spine_rot',
    toolMode: 'select',
    isPlaying: false,
    playbackSpeed: 1.0
  };
}

/**
 * Evaluates puppet bone rotations at the current timeline frame.
 */
export function evaluateSceneAtFrame(scene: ProjectScene, frame: number): void {
  for (const puppet of scene.puppets) {
    for (const track of scene.tracks) {
      if (track.targetType === 'boneRotation') {
        const bone = puppet.skeleton.bones[track.targetId];
        if (bone) {
          bone.rotation = sampleTrackValue(track, frame, bone.rotation);
        }
      }
    }
  }
}
