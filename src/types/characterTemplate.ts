import { Skeleton } from './skeleton';

export interface CharacterTemplate {
  id: string;
  name: string;
  category: 'humanoid' | 'chibi' | 'cartoon' | 'creature';
  description: string;
  colorScheme: {
    skin: number;
    shirt: number;
    pants: number;
    hair: number;
    accent: number;
  };
  headRadius: number;
  eyeSize: number;
  hairStyle: 'spiky' | 'bob' | 'curly' | 'wavy';
}

export const CHARACTER_TEMPLATES: CharacterTemplate[] = [
  {
    id: 'hero_humanoid',
    name: 'Hero Explorer (Alex)',
    category: 'humanoid',
    description: 'Adventurer protagonist with blue jacket, sneakers, and spiky hair.',
    colorScheme: {
      skin: 0xffdfba,
      shirt: 0x3b82f6,
      pants: 0x1e293b,
      hair: 0x854d0e,
      accent: 0xef4444
    },
    headRadius: 26,
    eyeSize: 4,
    hairStyle: 'spiky'
  },
  {
    id: 'chibi_scout',
    name: 'Chibi Anime Scout (Mia)',
    category: 'chibi',
    description: 'Expressive cute anime-style character with oversized eyes and colorful outfit.',
    colorScheme: {
      skin: 0xffe4e6,
      shirt: 0xec4899,
      pants: 0x475569,
      hair: 0xa855f7,
      accent: 0xfacc15
    },
    headRadius: 32,
    eyeSize: 6,
    hairStyle: 'bob'
  },
  {
    id: 'tech_creator',
    name: 'Tech Presenter (Sam)',
    category: 'cartoon',
    description: 'Modern YouTuber explainer host with glasses, dark hoodie, and sneakers.',
    colorScheme: {
      skin: 0xfcd34d,
      shirt: 0x10b981,
      pants: 0x334155,
      hair: 0x18181b,
      accent: 0x6366f1
    },
    headRadius: 28,
    eyeSize: 4,
    hairStyle: 'curly'
  },
  {
    id: 'cyber_bot',
    name: 'Mecha Cyber Bot (Unit-01)',
    category: 'creature',
    description: 'Futuristic sci-fi robot with glowing visor and mechanical joints.',
    colorScheme: {
      skin: 0x94a3b8,
      shirt: 0x475569,
      pants: 0x0f172a,
      hair: 0x06b6d4,
      accent: 0x22c55e
    },
    headRadius: 24,
    eyeSize: 3,
    hairStyle: 'spiky'
  }
];
