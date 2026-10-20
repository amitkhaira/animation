// Spine 3.8 Animation Parsing & Dynamic Hardware-Accelerated CSS Keyframe Engine
// Replicates AutoDraft's exact animation loading behavior (Network fetch of .json files)

export interface SpineKeyframe {
  pct: number;
  x: number;
  y: number;
  rot: number;
}

export interface SpineTrackData {
  animKey: string;
  duration: number;
  activeBoneCount: number;
  jsonUrl: string;
  frames: SpineKeyframe[];
  animationClassName: string;
}

const spineCache = new Map<string, SpineTrackData>();
const injectedStyles = new Set<string>();

function sampleAngle(track: any[], t: number): number {
  if (!track || track.length === 0) return 0;
  if (track.length === 1) return track[0].angle !== undefined ? track[0].angle : (track[0].value || 0);
  for (let i = 0; i < track.length - 1; i++) {
    const p = track[i], n = track[i + 1];
    const pt = p.time || 0, nt = n.time || 0;
    if (t >= pt && t <= nt) {
      const dt = nt - pt;
      const progress = dt > 0 ? (t - pt) / dt : 0;
      const pVal = p.angle !== undefined ? p.angle : (p.value || 0);
      const nVal = n.angle !== undefined ? n.angle : (n.value || 0);
      return pVal + (nVal - pVal) * progress;
    }
  }
  const last = track[track.length - 1];
  return last.angle !== undefined ? last.angle : (last.value || 0);
}

function sampleTranslate(track: any[], t: number): { x: number; y: number } {
  if (!track || track.length === 0) return { x: 0, y: 0 };
  if (track.length === 1) return { x: track[0].x || 0, y: track[0].y || 0 };
  for (let i = 0; i < track.length - 1; i++) {
    const p = track[i], n = track[i + 1];
    const pt = p.time || 0, nt = n.time || 0;
    if (t >= pt && t <= nt) {
      const dt = nt - pt;
      const progress = dt > 0 ? (t - pt) / dt : 0;
      return {
        x: (p.x || 0) + ((n.x || 0) - (p.x || 0)) * progress,
        y: (p.y || 0) + ((n.y || 0) - (p.y || 0)) * progress
      };
    }
  }
  const last = track[track.length - 1];
  return { x: last.x || 0, y: last.y || 0 };
}

export function parseSpineData(json: any, jsonUrl: string): SpineTrackData {
  const animKey = Object.keys(json)[0] || 'Idle';
  const anim = json[animKey] || {};
  const bones = anim.bones || {};

  let duration = 1.0;
  for (const b of Object.values(bones) as any[]) {
    for (const track of ['rotate', 'translate', 'scale']) {
      if (Array.isArray(b[track])) {
        for (const kf of b[track]) {
          if (kf.time && kf.time > duration) duration = kf.time;
        }
      }
    }
  }
  // Clamp duration to realistic animation cycles (0.4s to 4.0s)
  duration = Math.max(0.4, Math.min(4.0, duration));

  // Find moving bones
  const activeBones: { name: string; bone: any; hasRot: boolean; hasTrans: boolean }[] = [];
  for (const [name, bone] of Object.entries(bones) as [string, any][]) {
    const hasRot = (bone.rotate || []).some((k: any) => (k.angle || k.value) !== undefined && (k.angle || k.value) !== 0);
    const hasTrans = (bone.translate || []).some((k: any) => (k.x || k.y) !== undefined && (k.x || k.y) !== 0);
    if (hasRot || hasTrans) {
      activeBones.push({ name, bone, hasRot, hasTrans });
    }
  }

  // Baseline coordinates at t=0 so animations represent relative movements rather than absolute offsets
  let baseRot = 0;
  let baseX = 0;
  let baseY = 0;
  let cRot = 0;
  let cTrans = 0;
  for (const item of activeBones) {
    if (item.hasRot) {
      baseRot += sampleAngle(item.bone.rotate, 0);
      cRot++;
    }
    if (item.hasTrans) {
      const tr = sampleTranslate(item.bone.translate, 0);
      baseX += tr.x;
      baseY += tr.y;
      cTrans++;
    }
  }
  baseRot = cRot > 0 ? baseRot / cRot : 0;
  baseX = cTrans > 0 ? baseX / cTrans : 0;
  baseY = cTrans > 0 ? baseY / cTrans : 0;

  // Sample 6 keyframe positions across the cycle
  const steps = [0, 20, 40, 60, 80, 100];
  const frames: SpineKeyframe[] = steps.map((pct) => {
    const t = (pct / 100) * duration;
    let totalRot = 0;
    let totalX = 0;
    let totalY = 0;
    let countRot = 0;
    let countTrans = 0;

    for (const item of activeBones) {
      if (item.hasRot) {
        totalRot += sampleAngle(item.bone.rotate, t);
        countRot++;
      }
      if (item.hasTrans) {
        const tr = sampleTranslate(item.bone.translate, t);
        totalX += tr.x;
        totalY += tr.y;
        countTrans++;
      }
    }

    const curRot = countRot > 0 ? totalRot / countRot : 0;
    const curX = countTrans > 0 ? totalX / countTrans : 0;
    const curY = countTrans > 0 ? totalY / countTrans : 0;

    // Deltas relative to frame 0
    const deltaRot = curRot - baseRot;
    const deltaX = (curX - baseX) * 0.45;
    const deltaY = (curY - baseY) * 0.45;

    // Normalizing Spine deltas into CSS viewport offsets
    const clampX = Math.max(-18, Math.min(18, deltaX));
    const clampY = Math.max(-18, Math.min(18, deltaY));
    const clampRot = Math.max(-15, Math.min(15, deltaRot));

    return {
      pct,
      x: Number(clampX.toFixed(2)),
      y: Number(clampY.toFixed(2)),
      rot: Number(clampRot.toFixed(2))
    };
  });

  // Generate safe class and keyframe name
  const safeName = jsonUrl.replace(/[^a-zA-Z0-9]/g, '_');
  const animationClassName = `spine_track_${safeName}`;

  // Inject CSS Keyframes dynamically into DOM
  if (typeof document !== 'undefined' && !injectedStyles.has(animationClassName)) {
    const keyframeCSS = `
      @keyframes ${animationClassName} {
        ${frames.map((f) => `${f.pct}% { transform: translate3d(${f.x}px, ${f.y}px, 0) rotate(${f.rot}deg); }`).join('\n        ')}
      }
      .${animationClassName} {
        animation: ${animationClassName} ${duration.toFixed(2)}s infinite ease-in-out;
      }
    `;
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-spine-track', animationClassName);
    styleEl.innerHTML = keyframeCSS;
    document.head.appendChild(styleEl);
    injectedStyles.add(animationClassName);
  }

  const result: SpineTrackData = {
    animKey,
    duration,
    activeBoneCount: activeBones.length,
    jsonUrl,
    frames,
    animationClassName
  };

  spineCache.set(jsonUrl, result);
  return result;
}

export async function fetchSpineAnimation(jsonUrl: string): Promise<SpineTrackData> {
  if (spineCache.has(jsonUrl)) {
    return spineCache.get(jsonUrl)!;
  }

  try {
    // Real browser fetch request, triggers 200 OK in Network DevTools
    const response = await fetch(jsonUrl);
    if (!response.ok) {
      throw new Error(`Failed to load Spine animation JSON from ${jsonUrl}: ${response.statusText}`);
    }
    const json = await response.json();
    return parseSpineData(json, jsonUrl);
  } catch (err) {
    console.warn(`[SpineEngine] Could not load ${jsonUrl}, using fallback.`, err);
    // Provide a default subtle bounce track if file is unavailable
    const fallbackData: SpineTrackData = {
      animKey: 'Fallback',
      duration: 1.2,
      activeBoneCount: 4,
      jsonUrl,
      frames: [
        { pct: 0, x: 0, y: 0, rot: 0 },
        { pct: 50, x: 0, y: -6, rot: 1.5 },
        { pct: 100, x: 0, y: 0, rot: 0 }
      ],
      animationClassName: 'anim-human-walk'
    };
    spineCache.set(jsonUrl, fallbackData);
    return fallbackData;
  }
}
