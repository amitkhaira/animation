export interface AutoDraftProp {
  id: string;
  name: string;
  category: 'Normal Props' | 'Generated Props';
  imageUrl: string;
  defaultSlot: 'left_hand' | 'right_hand' | 'torso' | 'head' | 'back';
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
  isAnimated?: boolean;
}

// Clean Transparent SVG Data URIs for Props (100% Offline & Sharp)
const mashaalSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200" width="100" height="200">
  <defs>
    <radialGradient id="fire" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff700"/>
      <stop offset="50%" stop-color="#ff7b00"/>
      <stop offset="100%" stop-color="#e60000"/>
    </radialGradient>
  </defs>
  <!-- Flame -->
  <path d="M50,10 C65,40 85,55 75,90 C70,110 50,115 50,115 C50,115 30,110 25,90 C15,55 35,40 50,10 Z" fill="url(#fire)"/>
  <path d="M50,35 C58,55 70,65 65,85 C60,98 50,102 50,102 C50,102 40,98 35,85 C30,65 42,55 50,35 Z" fill="#ffff99"/>
  <!-- Torch Head -->
  <polygon points="35,110 65,110 60,130 40,130" fill="#4a2e18" stroke="#2b1a0d" stroke-width="3"/>
  <rect x="38" y="125" width="24" height="6" fill="#8c6239" rx="2"/>
  <!-- Wooden Handle -->
  <path d="M44,130 L42,195 C42,197 44,199 47,199 L53,199 C56,199 58,197 58,195 L56,130 Z" fill="#6d4c2b" stroke="#3d2814" stroke-width="2"/>
  <!-- Grip Wraps -->
  <line x1="43" y1="150" x2="57" y2="153" stroke="#d4b483" stroke-width="3"/>
  <line x1="43" y1="165" x2="57" y2="168" stroke="#d4b483" stroke-width="3"/>
  <line x1="42" y1="180" x2="58" y2="183" stroke="#d4b483" stroke-width="3"/>
</svg>
`)}`;

const lanternSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 160" width="100" height="160">
  <!-- Top Handle Ring -->
  <ellipse cx="50" cy="20" rx="18" ry="14" fill="none" stroke="#2d3748" stroke-width="4"/>
  <!-- Top Cap -->
  <path d="M35,35 L65,35 L75,50 L25,50 Z" fill="#1a202c" stroke="#4a5568" stroke-width="2"/>
  <!-- Glass Globe with Glow -->
  <path d="M28,50 L72,50 L80,105 L20,105 Z" fill="rgba(255,220,100,0.4)" stroke="#4a5568" stroke-width="2"/>
  <circle cx="50" cy="80" r="14" fill="#ffcc00" opacity="0.9"/>
  <ellipse cx="50" cy="80" rx="6" ry="10" fill="#ffffff"/>
  <!-- Metal Cage Bars -->
  <line x1="50" y1="50" x2="50" y2="105" stroke="#2d3748" stroke-width="3"/>
  <path d="M35,50 C32,75 32,90 35,105" fill="none" stroke="#2d3748" stroke-width="2.5"/>
  <path d="M65,50 C68,75 68,90 65,105" fill="none" stroke="#2d3748" stroke-width="2.5"/>
  <!-- Bottom Tank Base -->
  <rect x="22" y="105" width="56" height="16" fill="#1a202c" rx="4" stroke="#4a5568" stroke-width="2"/>
  <rect x="18" y="120" width="64" height="10" fill="#171923" rx="3"/>
</svg>
`)}`;

const juteSackSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" width="120" height="140">
  <!-- Tied Neck Top -->
  <path d="M45,15 C40,5 50,2 60,5 C70,2 80,5 75,15 C72,22 68,26 60,26 C52,26 48,22 45,15 Z" fill="#d4a373" stroke="#8c5828" stroke-width="2"/>
  <!-- Rope Tie -->
  <rect x="46" y="24" width="28" height="6" fill="#7f5539" rx="2" stroke="#583101" stroke-width="1.5"/>
  <!-- Sack Body -->
  <path d="M48,28 C25,35 15,65 15,95 C15,125 35,135 60,135 C85,135 105,125 105,95 C105,65 95,35 72,28 Z" fill="#b07d4b" stroke="#7f5539" stroke-width="3"/>
  <!-- Patch -->
  <rect x="35" y="70" width="22" height="18" fill="#8c5828" rx="2" stroke="#ddb892" stroke-dasharray="3,2" stroke-width="1.5"/>
  <!-- Folds/Creases -->
  <path d="M30,55 C45,70 45,100 40,115" fill="none" stroke="#7f5539" stroke-width="2.5" opacity="0.6"/>
  <path d="M90,55 C75,70 75,100 80,115" fill="none" stroke="#7f5539" stroke-width="2.5" opacity="0.6"/>
</svg>
`)}`;

const stickSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 200" width="40" height="200">
  <!-- Bamboo / Wooden Walking Stick -->
  <path d="M18,5 L22,5 L22,195 C22,197 20,199 18,199 C16,199 14,197 14,195 L18,5 Z" fill="#8c6239" stroke="#5c3d1e" stroke-width="2"/>
  <!-- Bamboo Nodes -->
  <ellipse cx="18" cy="40" rx="5" ry="2" fill="#5c3d1e"/>
  <ellipse cx="18" cy="80" rx="5" ry="2" fill="#5c3d1e"/>
  <ellipse cx="18" cy="120" rx="5" ry="2" fill="#5c3d1e"/>
  <ellipse cx="18" cy="160" rx="5" ry="2" fill="#5c3d1e"/>
  <!-- Carved Top Knob -->
  <circle cx="20" cy="12" r="8" fill="#a07850" stroke="#5c3d1e" stroke-width="2"/>
</svg>
`)}`;

const toteBagSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" width="120" height="140">
  <!-- Shoulder Straps -->
  <path d="M35,55 C35,15 50,10 60,10 C70,10 85,15 85,55" fill="none" stroke="#78350f" stroke-width="4.5" stroke-linecap="round"/>
  <!-- Bag Body -->
  <path d="M25,50 L95,50 L90,130 C90,133 87,135 83,135 L37,135 C33,135 30,133 30,130 Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="2.5"/>
  <!-- Indian Embroidered Patterns -->
  <rect x="27" y="65" width="66" height="20" fill="#d97706"/>
  <circle cx="40" cy="75" r="4" fill="#fef08a"/>
  <circle cx="60" cy="75" r="4" fill="#fef08a"/>
  <circle cx="80" cy="75" r="4" fill="#fef08a"/>
  <rect x="29" y="95" width="62" height="15" fill="#047857"/>
  <polygon points="35,118 45,126 55,118 65,126 75,118 85,126" fill="none" stroke="#fef08a" stroke-width="2.5"/>
</svg>
`)}`;

const trishulSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 220" width="80" height="220">
  <!-- Central Shaft -->
  <rect x="37" y="60" width="6" height="155" fill="#b45309" stroke="#78350f" stroke-width="1.5"/>
  <!-- Trident Center Spike -->
  <path d="M40,5 L46,30 L40,65 L34,30 Z" fill="#f59e0b" stroke="#b45309" stroke-width="2"/>
  <!-- Left Prong -->
  <path d="M40,60 C25,55 12,35 15,15 C17,15 22,25 35,42 Z" fill="#f59e0b" stroke="#b45309" stroke-width="2"/>
  <!-- Right Prong -->
  <path d="M40,60 C55,55 68,35 65,15 C63,15 58,25 45,42 Z" fill="#f59e0b" stroke="#b45309" stroke-width="2"/>
  <!-- Mini Damru on Shaft -->
  <polygon points="30,85 50,85 43,97 50,110 30,110 37,97" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/>
  <circle cx="40" cy="97" r="2.5" fill="#fef08a"/>
  <!-- Red Cloth / Ribbon -->
  <path d="M43,97 Q55,105 60,125" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
</svg>
`)}`;

const gadaSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 180" width="80" height="180">
  <!-- Golden Gada Mace -->
  <!-- Handle -->
  <rect x="37" y="65" width="6" height="110" fill="#d97706" stroke="#92400e" stroke-width="1.5"/>
  <circle cx="40" cy="172" r="5" fill="#f59e0b" stroke="#92400e" stroke-width="1.5"/>
  <!-- Head Fluted Bulb -->
  <ellipse cx="40" cy="40" rx="28" ry="24" fill="#f59e0b" stroke="#b45309" stroke-width="2.5"/>
  <path d="M18,40 C18,25 40,18 40,18 C40,18 62,25 62,40 C62,55 40,62 40,62 C40,62 18,55 18,40 Z" fill="#fbbf24"/>
  <!-- Top Finial Spike -->
  <polygon points="40,8 44,20 36,20" fill="#fef08a" stroke="#b45309" stroke-width="1.5"/>
</svg>
`)}`;

const mukutSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" width="120" height="100">
  <!-- Golden Vedic Mukut Crown -->
  <path d="M20,70 L25,45 L40,60 L60,15 L80,60 L95,45 L100,70 Z" fill="#f59e0b" stroke="#b45309" stroke-width="2.5"/>
  <!-- Inner Detail Layer -->
  <path d="M30,68 L35,50 L45,60 L60,28 L75,60 L85,50 L90,68 Z" fill="#fbbf24"/>
  <!-- Base Band -->
  <rect x="18" y="70" width="84" height="14" fill="#b45309" rx="3" stroke="#78350f" stroke-width="1.5"/>
  <!-- Jewels -->
  <circle cx="60" cy="45" r="5" fill="#ef4444" stroke="#ffffff" stroke-width="1"/>
  <circle cx="40" cy="77" r="3" fill="#3b82f6"/>
  <circle cx="60" cy="77" r="4" fill="#10b981"/>
  <circle cx="80" cy="77" r="3" fill="#3b82f6"/>
</svg>
`)}`;

const rudrakshaMalaSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <!-- Sacred Rudraksha Mala Garland -->
  <path d="M25,25 Q60,95 95,25" fill="none" stroke="#78350f" stroke-width="2"/>
  <!-- Beads -->
  <circle cx="28" cy="28" r="5" fill="#5c2c16" stroke="#2e1409" stroke-width="1"/>
  <circle cx="34" cy="40" r="5.5" fill="#6d3319" stroke="#2e1409" stroke-width="1"/>
  <circle cx="42" cy="53" r="5.5" fill="#5c2c16" stroke="#2e1409" stroke-width="1"/>
  <circle cx="51" cy="63" r="6" fill="#6d3319" stroke="#2e1409" stroke-width="1"/>
  <circle cx="60" cy="68" r="7" fill="#823c1d" stroke="#f59e0b" stroke-width="1.5"/>
  <circle cx="69" cy="63" r="6" fill="#6d3319" stroke="#2e1409" stroke-width="1"/>
  <circle cx="78" cy="53" r="5.5" fill="#5c2c16" stroke="#2e1409" stroke-width="1"/>
  <circle cx="86" cy="40" r="5.5" fill="#6d3319" stroke="#2e1409" stroke-width="1"/>
  <circle cx="92" cy="28" r="5" fill="#5c2c16" stroke="#2e1409" stroke-width="1"/>
</svg>
`)}`;

const sunglassesSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" width="100" height="40">
  <!-- Black Wayfarer Sunglasses -->
  <path d="M10,12 L45,12 C46,24 38,32 25,32 C12,32 9,24 10,12 Z" fill="#18181b" stroke="#09090b" stroke-width="2"/>
  <path d="M55,12 L90,12 C91,24 88,32 75,32 C62,32 54,24 55,12 Z" fill="#18181b" stroke="#09090b" stroke-width="2"/>
  <line x1="45" y1="16" x2="55" y2="16" stroke="#09090b" stroke-width="3"/>
  <line x1="5" y1="13" x2="10" y2="13" stroke="#09090b" stroke-width="2.5"/>
  <line x1="90" y1="13" x2="95" y2="13" stroke="#09090b" stroke-width="2.5"/>
  <!-- Glare Highlights -->
  <line x1="16" y1="17" x2="26" y2="27" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>
  <line x1="61" y1="17" x2="71" y2="27" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>
</svg>
`)}`;

export const AUTODRAFT_PROPS: AutoDraftProp[] = [
  {
    id: 'mashaal_anim',
    name: 'Mashaal Animated',
    category: 'Normal Props',
    imageUrl: mashaalSvg,
    defaultSlot: 'left_hand',
    width: 48,
    height: 96,
    isAnimated: true
  },
  {
    id: 'lantern_anim',
    name: 'Lantern Animated',
    category: 'Normal Props',
    imageUrl: lanternSvg,
    defaultSlot: 'left_hand',
    width: 48,
    height: 72,
    isAnimated: true
  },
  {
    id: 'jute_sack_1',
    name: 'Jute Sack',
    category: 'Normal Props',
    imageUrl: juteSackSvg,
    defaultSlot: 'back',
    width: 60,
    height: 70
  },
  {
    id: 'props_21_stick',
    name: 'Props 21 (Stick/Broom)',
    category: 'Normal Props',
    imageUrl: stickSvg,
    defaultSlot: 'right_hand',
    width: 20,
    height: 120
  },
  {
    id: 'tribal_tote',
    name: 'Tribal Tote Bag',
    category: 'Normal Props',
    imageUrl: toteBagSvg,
    defaultSlot: 'left_hand',
    width: 50,
    height: 60
  },
  {
    id: 'trishul_divine',
    name: 'Trishul (Trident)',
    category: 'Generated Props',
    imageUrl: trishulSvg,
    defaultSlot: 'right_hand',
    width: 35,
    height: 130
  },
  {
    id: 'gada_golden',
    name: 'Golden Gada (Mace)',
    category: 'Generated Props',
    imageUrl: gadaSvg,
    defaultSlot: 'right_hand',
    width: 45,
    height: 100
  },
  {
    id: 'golden_mukut',
    name: 'Golden Mukut (Crown)',
    category: 'Generated Props',
    imageUrl: mukutSvg,
    defaultSlot: 'head',
    width: 55,
    height: 45
  },
  {
    id: 'mala_rudraksha',
    name: 'Rudraksha Mala Garland',
    category: 'Generated Props',
    imageUrl: rudrakshaMalaSvg,
    defaultSlot: 'torso',
    width: 60,
    height: 60
  },
  {
    id: 'cool_sunglasses',
    name: 'Black Sunglasses Shades',
    category: 'Generated Props',
    imageUrl: sunglassesSvg,
    defaultSlot: 'head',
    width: 44,
    height: 20
  }
];

export type PropSlotKey = 'left_hand' | 'right_hand' | 'torso' | 'head' | 'back';

export interface PropSlotInfo {
  key: PropSlotKey;
  label: string;
  description: string;
}

export const PROP_SLOTS: PropSlotInfo[] = [
  { key: 'left_hand', label: 'Left Hand', description: 'Left Hand Prop Slot' },
  { key: 'right_hand', label: 'Right Hand', description: 'Right Hand Prop Slot' },
  { key: 'torso', label: 'Torso', description: 'Torso Accessory Slot' },
  { key: 'head', label: 'Head', description: 'Head Accessory Slot' },
  { key: 'back', label: 'Back', description: 'Back Accessory Slot' }
];
