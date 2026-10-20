import { CharacterItem, CharacterAction, SceneTemplate, CharacterAngle } from '../types/autodraft';
import rawCharacters from './autodraftAllCharacters.json';
import rawTemplates from './autodraftAllTemplates.json';
import categorizedActions from './autodraftCategorizedActions.json';

// 1,057 Cloned Official AutoDraft Characters with local WebP assets
export const AUTODRAFT_CHARACTERS: CharacterItem[] = rawCharacters as CharacterItem[];

// Global structure mapping connecting characters and normalized names to AutoDraft Spine rigs (covers 987+ characters)
const characterStructuresMap = new Map<string, any[]>();
(rawCharacters as CharacterItem[]).forEach((c) => {
  if (c.structures && c.structures.length > 0) {
    characterStructuresMap.set(c.id, c.structures);
    const norm = (c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (norm && !characterStructuresMap.has(norm)) {
      characterStructuresMap.set(norm, c.structures);
    }
  }
});

export function getCharacterStructures(charOrId: CharacterItem | string | undefined | null): any[] | null {
  if (!charOrId) return null;
  if (typeof charOrId === 'string') {
    const cid = charOrId.toLowerCase();
    if (characterStructuresMap.has(cid)) return characterStructuresMap.get(cid)!;
    const norm = cid.replace(/[^a-z0-9]/g, '');
    if (characterStructuresMap.has(norm)) return characterStructuresMap.get(norm)!;
    const found = AUTODRAFT_CHARACTERS.find((c) => c.id === charOrId || c.name.toLowerCase() === cid);
    if (found) return getCharacterStructures(found);
    return null;
  }
  if (charOrId.structures && charOrId.structures.length > 0) {
    return charOrId.structures;
  }
  if (characterStructuresMap.has(charOrId.id)) {
    return characterStructuresMap.get(charOrId.id)!;
  }
  const norm = (charOrId.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return characterStructuresMap.get(norm) || null;
}

// Standard base actions for fallback
export const AUTODRAFT_ACTIONS: CharacterAction[] = [
  {
    id: 'Walk',
    label: 'Walk',
    category: 'movement',
    durationSeconds: 1.5
  },
  {
    id: 'Run',
    label: 'Run',
    category: 'movement',
    durationSeconds: 1.0
  },
  {
    id: 'Talking',
    label: 'Talking',
    category: 'basic',
    durationSeconds: 2.5
  },
  {
    id: 'Sitting',
    label: 'Sitting',
    category: 'basic',
    durationSeconds: 3.0
  },
  {
    id: 'Idle',
    label: 'Idle',
    category: 'basic',
    durationSeconds: 2.0
  },
  {
    id: 'Idle Happy',
    label: 'Idle Happy',
    category: 'emotion',
    durationSeconds: 2.0
  },
  {
    id: 'Greeting',
    label: 'Greeting',
    category: 'basic',
    durationSeconds: 2.0
  },
  {
    id: 'Angry',
    label: 'Angry',
    category: 'emotion',
    durationSeconds: 2.0
  },
  {
    id: 'Thinking',
    label: 'Thinking',
    category: 'basic',
    durationSeconds: 2.5
  }
];

// Actions categorized by character structure type (bird, animal, car, human, kid)
export const ACTIONS_BY_TYPE: Record<string, CharacterAction[]> = categorizedActions as Record<string, CharacterAction[]>;

import officialStructureAnimationsRaw from './officialStructureAnimations.json';

interface StructureActionRaw {
  id: string;
  label: string;
  tab?: string;
  thumbnailUrl?: string;
}

interface StructureGroupRaw {
  id: string;
  type: string;
  pose: string;
  normPose: string;
  actions: StructureActionRaw[];
}

interface OfficialStructureAnimationsDatabase {
  byId: Record<string, StructureGroupRaw>;
  byArchetype: Record<string, StructureGroupRaw>;
}

const OFFICIAL_ANIMATIONS_DB = officialStructureAnimationsRaw as unknown as OfficialStructureAnimationsDatabase;

function formatActionLabel(animName: string): string {
  return animName.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

function categorizeAction(animName: string): 'movement' | 'emotion' | 'basic' | 'action' {
  const low = animName.toLowerCase();
  if (['walk', 'run', 'fly', 'flying', 'drive', 'accelerate', 'coasting', 'drifting', 'jump', 'jumping', 'crawl', 'hop'].some((w) => low.includes(w))) {
    return 'movement';
  }
  if (['angry', 'smile', 'crying', 'cry', 'happy', 'laugh', 'sad', 'fear', 'surprised', 'astonished', 'evil', 'roar'].some((w) => low.includes(w))) {
    return 'emotion';
  }
  if (['talk', 'talking', 'lipsing', 'idle', 'eyeblink', 'stand', 'rest', 'breathe', 'look'].some((w) => low.includes(w))) {
    return 'basic';
  }
  return 'action';
}

// Helper to get authentic AutoDraft structure animations for any specific character with angle support
export const getActionsForCharacter = (char: CharacterItem, angle?: CharacterAngle): CharacterAction[] => {
  const ang: CharacterAngle = angle || '3/4 FRONT';
  const name = (char.name || '').toLowerCase();
  const cat = (char.category || '').toLowerCase();

  // Pose key mapping for AutoDraft structure poses
  const poseMap: Record<CharacterAngle, string> = {
    'FRONT': 'front',
    '3/4 FRONT': 'front-side',
    '3/4 BACK': 'back'
  };
  const targetPose = poseMap[ang] || 'front-side';

  let rawActions: StructureActionRaw[] = [];
  let sourceArch = char.structureType || 'human';

  // Determine Archetype
  if (cat.includes('vehic') || name.includes('car') || name.includes('chariot') || name.includes('cart') || name.includes('truck')) {
    sourceArch = 'car';
  } else if (cat.includes('bird') || name.includes('crow') || name.includes('peacock') || name.includes('eagle') || name.includes('owl')) {
    sourceArch = 'bird';
  } else if (cat.includes('anim') || name.includes('horse') || name.includes('lion') || name.includes('tiger') || name.includes('turtle') || name.includes('elephant')) {
    sourceArch = 'animal';
  } else if (cat.includes('kid') || name.includes('apple') || name.includes('boy') || name.includes('girl')) {
    sourceArch = 'kid';
  }

  // 1. Exact match via Character's structures array
  const charStructures = getCharacterStructures(char) || char.structures;
  if (charStructures && charStructures.length > 0) {
    const matchedStruct = charStructures.find((s) => s.pose === targetPose);
    if (matchedStruct && matchedStruct.id && OFFICIAL_ANIMATIONS_DB.byId[String(matchedStruct.id)]) {
      const s = OFFICIAL_ANIMATIONS_DB.byId[String(matchedStruct.id)];
      if (s.actions && s.actions.length > 0) {
        rawActions = s.actions;
      }
    }
  }

  // 2. Direct lookup in byArchetype with requested angle
  if (rawActions.length === 0) {
    const archKey = `${sourceArch}:${ang}`;
    if (OFFICIAL_ANIMATIONS_DB.byArchetype[archKey]?.actions?.length) {
      rawActions = OFFICIAL_ANIMATIONS_DB.byArchetype[archKey].actions;
    }
  }

  // 3. Archetype variants (expressive_animal, real_bird, etc.)
  if (rawActions.length === 0) {
    if (sourceArch === 'animal') {
      const expKey = `expressive_animal:${ang}`;
      if (OFFICIAL_ANIMATIONS_DB.byArchetype[expKey]?.actions?.length) {
        rawActions = OFFICIAL_ANIMATIONS_DB.byArchetype[expKey].actions;
      }
    } else if (sourceArch === 'bird') {
      const realBirdKey = `real_bird:${ang}`;
      if (OFFICIAL_ANIMATIONS_DB.byArchetype[realBirdKey]?.actions?.length) {
        rawActions = OFFICIAL_ANIMATIONS_DB.byArchetype[realBirdKey].actions;
      }
    }
  }

  // 4. Fallback for angles that don't have separate back poses (Animals, Birds, Vehicles don't have 3/4 BACK in AutoDraft)
  if (rawActions.length === 0 && ang === '3/4 BACK') {
    const frontSideKey = `${sourceArch}:3/4 FRONT`;
    if (OFFICIAL_ANIMATIONS_DB.byArchetype[frontSideKey]?.actions?.length) {
      rawActions = OFFICIAL_ANIMATIONS_DB.byArchetype[frontSideKey].actions;
    }
  }

  // 5. Fallback to human angle
  if (rawActions.length === 0) {
    const humanKey = `human:${ang}`;
    if (OFFICIAL_ANIMATIONS_DB.byArchetype[humanKey]?.actions?.length) {
      rawActions = OFFICIAL_ANIMATIONS_DB.byArchetype[humanKey].actions;
    }
  }

  // Format into rich CharacterAction objects with working animated GIFs and tabs
  return rawActions.map((a) => {
    let thumb = a.thumbnailUrl || '';
    if (!thumb) {
      if (sourceArch === 'bird') {
        thumb = `https://assets.autodraft.in/canvas-animations/thumbnails/bird/${a.id}.gif`;
      } else if (sourceArch === 'car') {
        thumb = `https://assets.autodraft.in/canvas-animations/thumbnails/car/${a.id}.gif`;
      } else if (sourceArch === 'animal') {
        thumb = `https://assets.autodraft.in/canvas-animations/thumbnails/animal/${a.id}.gif`;
      } else if (sourceArch === 'kid') {
        thumb = `https://assets.autodraft.in/canvas-animations/thumbnails/compressed/${a.id}.gif`;
      } else {
        const poseSub = ang === 'FRONT' ? 'front/compressed' : (ang === '3/4 BACK' ? 'back-2' : 'compressed');
        thumb = `https://assets.autodraft.in/canvas-animations/thumbnails/${poseSub}/${a.id}.gif`;
      }
    }

    return {
      id: a.id,
      label: a.label || formatActionLabel(a.id),
      category: categorizeAction(a.id),
      tab: a.tab || 'PRIMARY',
      thumbnailUrl: thumb,
      durationSeconds: 2.0
    };
  });
};

// 359 Cloned Official AutoDraft Scene Templates with high-res thumbnails & backgrounds
export const AUTODRAFT_TEMPLATES: SceneTemplate[] = rawTemplates as SceneTemplate[];

// Helper to look up character by ID or fallback
export const getCharacterById = (id: string): CharacterItem => {
  return (
    AUTODRAFT_CHARACTERS.find((c) => c.id === id || c.name.toLowerCase() === id.toLowerCase()) ||
    AUTODRAFT_CHARACTERS[0]
  );
};

// Helper to look up template by ID or fallback
export const getTemplateById = (id: string): SceneTemplate => {
  return (
    AUTODRAFT_TEMPLATES.find((t) => t.id === id) ||
    AUTODRAFT_TEMPLATES[0]
  );
};
