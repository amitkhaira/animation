import { CharacterPuppet } from './skeleton';
import { AnimationTrack } from './animation';
import { AudioTrack } from './lipsync';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
}

export interface ProjectScene {
  id: string;
  name: string;
  fps: number;
  totalFrames: number;
  currentFrame: number;
  camera: CameraState;
  puppets: CharacterPuppet[];
  tracks: AnimationTrack[];
  audioTracks: AudioTrack[];
  backgroundUrl?: string;
}

export interface AnimCraftProject {
  id: string;
  title: string;
  scenes: ProjectScene[];
  activeSceneId: string;
}
