import { ActiveAudioTrack } from './audio';

export type CharacterAngle = 'FRONT' | '3/4 FRONT' | '3/4 BACK';

export type CharacterActionType = string;

export type CharacterStructureType = 'human' | 'kid' | 'bird' | 'animal' | 'car' | string;

export interface CharacterItem {
  id: string;
  name: string;
  category: 'Desi' | 'Western' | 'Village' | 'Animals' | 'Birds' | 'Horror' | 'Religious' | string;
  tags?: string[];
  structureType?: CharacterStructureType;
  avatarUrl?: string;
  availableAngles: CharacterAngle[];
  colors?: {
    skin: string;
    shirt: string;
    bottom: string;
    hair: string;
    accent: string;
  };
  details?: {
    gender: 'male' | 'female' | 'kid' | 'elder' | string;
    headwear?: 'pagri' | 'cap' | 'none' | string;
    outfit?: string;
  };
  structures?: Array<{
    id?: number;
    type?: string;
    pose?: string;
    metadata?: any;
    [key: string]: any;
  }>;
}

export interface CharacterAction {
  id: CharacterActionType;
  label: string;
  category: 'basic' | 'emotion' | 'movement' | string;
  thumbnailUrl?: string;
  iconSilhouette?: string;
  durationSeconds: number;
  angles?: CharacterAngle[];
  jsonUrl?: string;
  tab?: 'PRIMARY' | 'HAND' | 'EXPRESSION' | 'LEGS' | string;
}

export interface SceneTemplate {
  id: string;
  name: string;
  category: 'All Templates' | 'Village' | 'Horror' | 'Moral' | 'Office' | 'Story' | 'Explainer' | 'Kids' | 'Fairy Tales' | string;
  tags: string[];
  thumbnailUrl: string;
  backgroundUrl?: string;
  jsonUrl?: string;
  bgLayers?: Array<{
    id: string;
    name: string;
    url: string;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    flipX?: boolean;
    rotation?: number;
    opacity?: number;
    zIndex?: number;
  }> | null;
  sampleCharacters?: ActiveCanvasCharacter[];
  description: string;
  isPremium?: boolean;
  layers?: {
    id: string;
    name: string;
    type: 'background' | 'middleground' | 'foreground' | 'character' | 'prop';
    zIndex: number;
    svgArtType: string;
    initialX: number;
    initialY: number;
    scale: number;
    characterConfig?: {
      characterId: string;
      action: CharacterActionType;
      angle: CharacterAngle;
    };
  }[];
}

export interface ActiveCanvasCharacter {
  instanceId: string;
  characterId: string;
  name: string;
  x: number; // percentage 0-100 or canvas px
  y: number;
  scale: number;
  flipH: boolean;
  angle: CharacterAngle;
  action: CharacterActionType;
  jsonUrl?: string;
  speed: number;
  isPlaying: boolean;
  rotation?: number;
  zIndex?: number;
  filters?: {
    brightness: number; // 0 - 200 (default 100)
    contrast: number; // 0 - 200 (default 100)
    saturation: number; // 0 - 200 (default 100)
    hue: number; // 0 - 360 (default 0)
    opacity: number; // 0 - 100 (default 100)
  };
  mask?: 'none' | 'circle' | 'rounded' | 'horizon';
  motionPath?: {
    type: 'linear' | 'arc' | 'wave' | 'custom';
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    duration?: number;
    delay?: number;
    startScale?: number;
    endScale?: number;
  };
  props?: {
    left_hand?: string;
    right_hand?: string;
    torso?: string;
    head?: string;
    back?: string;
  };
  startTime?: number;
  duration?: number;
  isLocked?: boolean;
  isVisible?: boolean;
}

export interface ActiveCanvasMediaLayer {
  instanceId: string;
  mediaId: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  x: number;
  y: number;
  width?: number;
  height?: number;
  scale: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  flipH?: boolean;
  flipX?: boolean;
  zIndex?: number;
  opacity?: number;
  startTime?: number;
  duration?: number;
  isLocked?: boolean;
  isVisible?: boolean;
  isTemplateLayer?: boolean;
}

export interface CameraTimelineTrack {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  isLocked?: boolean;
  isVisible?: boolean;
}

export interface BackgroundTimelineTrack {
  id: string;
  name: string;
  url: string;
  startTime: number;
  duration: number;
  isLocked?: boolean;
  isVisible?: boolean;
}

export interface StudioScene {
  id: string;
  name: string;
  duration: number;
  currentTime: number;
  characters: ActiveCanvasCharacter[];
  audioTracks: ActiveAudioTrack[];
  canvasMediaLayers: ActiveCanvasMediaLayer[];
  backgroundTrack: BackgroundTimelineTrack | null;
  currentTemplate: SceneTemplate | null;
  customBackgroundUrl: string | null;
}

