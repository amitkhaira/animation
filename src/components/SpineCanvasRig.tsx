import React, { useRef, useEffect, useState } from 'react';
import { SpineKinematicsModel } from '../engine/spine/SpineKinematicsEngine';
import { CharacterAngle } from '../types/autodraft';
import { AUTODRAFT_CHARACTERS, getCharacterStructures } from '../data/autodraftData';

interface SpineCanvasRigProps {
  characterId: string;
  characterName?: string;
  angle?: CharacterAngle;
  action: string;
  jsonUrl?: string;
  isPlaying?: boolean;
  currentTimeSeconds?: number;
  speed?: number;
  scale?: number;
  flipH?: boolean;
  width?: number;
  height?: number;
  onKinematicsUpdate?: (info: {
    activeAnimation: string;
    boneCount: number;
    torsoY: number;
    kneeAngle: number;
    duration: number;
  }) => void;
  fallbackAvatarUrl?: string;
}

// Global cache so skeleton and atlas are parsed only once
const rigModelCache = new Map<string, SpineKinematicsModel>();
const loadingPromises = new Map<string, Promise<SpineKinematicsModel | null>>();

import localRigManifestRaw from '../data/localRigManifest.json';

interface RigInfo {
  hasFront: boolean;
  hasBack: boolean;
  defaultImg?: string;
  frontImg?: string;
  backImg?: string;
}
const rigManifest = localRigManifestRaw as Record<string, RigInfo>;

function resolveRigDir(charId: string, charName?: string): string | null {
  const cid = String(charId || '').toLowerCase();
  const cname = String(charName || '').toLowerCase();
  const cleanName = cname.replace(/[^a-z0-9]/g, '_').replace(/_+$/, '');
  const cleanId = cid.replace(/[^a-z0-9]/g, '_').replace(/_+$/, '');

  // 1. Direct match
  if (rigManifest[cleanName]) return cleanName;
  if (rigManifest[cleanId]) return cleanId;

  // Specific canonical mappings
  if (cname.includes('krishna') || cid.includes('krishna')) return 'krishna';
  if (cname.includes('vishnu') || cid.includes('vishnu')) return 'vishnu_ji';
  if (cname.includes('shiva') || cid.includes('shiva')) return 'god_shiva';
  if (cname.includes('durga') || cid.includes('durga')) return 'maa_durga';
  if (cname.includes('ravana') || cid.includes('ravana')) return 'ravana';
  if (cname.includes('ganesh') || cid.includes('ganesh') || cid === '598131') return 'ganesh';
  if (cname.includes('radha') || cid.includes('radha')) return 'radha';
  if (cname.includes('kaali') || cid.includes('kaali')) return 'maa_kaali';
  if (cname.includes('parvati') || cid.includes('parvati')) return 'maa_parvati';
  if (cname.includes('saraswati') || cid.includes('saraswati')) return 'maa_saraswati';
  if (cname.includes('lakshmi') || cid.includes('lakshmi') || cid === '789705') return 'maa_lakshmi';
  if (cname.includes('queen sita') || cid === '608256') return 'queen_sita';
  if (cname.includes('sita') || cid.includes('sita')) return 'maa_sita';
  if (cname.includes('king rama') || cid === '690169') return 'king_rama';
  if (cname.includes('prince rama') || cid === '618483') return 'prince_rama';
  if (cname.includes('ram') || cid.includes('ram')) return 'ram';
  if (cname.includes('lakshman') || cid.includes('lakshman')) return 'lakshman';
  if (cname.includes('brahma') || cid.includes('brahma')) return 'brahma_ji';
  if (cname.includes('indra') || cid.includes('indra')) return 'indra_dev';
  if (cname.includes('surya') || cid.includes('surya')) return 'surya_dev';
  if (cname.includes('kartikeya') || cid.includes('kartikeya')) return 'kartikeya';
  if (cname.includes('narad') || cid.includes('narad')) return 'narad_muni';
  if (cname.includes('panjurli') || cid === '648008') return 'panjurli';
  if (cname.includes('guliga') || cid.includes('guliga')) return 'guliga';
  if (cname.includes('mahishasur') || cid.includes('mahishasur')) return 'mahishasur';
  if (cname.includes('kumbhakarna') || cid.includes('kumbhakarna')) return 'kumbhakarna';
  if (cname.includes('pandit') || cid.includes('pandit') || cid === '811550') return 'pandit_2_fix';
  if (cname.includes('sadhu 3') || cid === '797153') return 'sadhu_3';
  if (cname.includes('sadhu 2') || cid === '364715') return 'sadhu_2';
  if (cname.includes('sadhu')) return 'sadhu';
  if (cname.includes('hanuman') || cid.includes('hanuman')) return 'hanuman';
  if (cname.includes('baba')) return 'baba';
  if (cname.includes('kabir') || cid === '679540') return 'kabir';

  // 2. Substring search
  const available = Object.keys(rigManifest);
  for (const d of available) {
    if (cleanName.includes(d) || d.includes(cleanName) || cleanId.includes(d) || d.includes(cleanId)) return d;
  }

  // 3. Stripped search
  const strippedName = cleanName.replace(/_/g, '');
  for (const d of available) {
    if (d.replace(/_/g, '').includes(strippedName) || strippedName.includes(d.replace(/_/g, ''))) return d;
  }

  return null;
}

function getRigFileUrls(charId: string, charName?: string, angle: CharacterAngle = '3/4 FRONT') {
  const matchedDir = resolveRigDir(charId, charName);
  if (matchedDir && rigManifest[matchedDir]) {
    const info = rigManifest[matchedDir];
    const rigDir = `/characters/rigs/${matchedDir}`;

    if (angle === 'FRONT' && (info.hasFront || info.frontImg)) {
      return {
        skelUrl: `${rigDir}/skeleton_front.json`,
        atlasUrl: `${rigDir}/skeleton_front.atlas`,
        imgUrl: `${rigDir}/${info.frontImg || 'atlas_front.webp'}`
      };
    } else if (angle === '3/4 BACK' && (info.hasBack || info.backImg)) {
      return {
        skelUrl: `${rigDir}/skeleton_back.json`,
        atlasUrl: `${rigDir}/skeleton_back.atlas`,
        imgUrl: `${rigDir}/${info.backImg || 'atlas_back.webp'}`
      };
    } else {
      return {
        skelUrl: `${rigDir}/skeleton.json`,
        atlasUrl: `${rigDir}/skeleton.atlas`,
        imgUrl: `${rigDir}/${info.defaultImg || 'atlas.webp'}`
      };
    }
  }

  // Universal fallback to Pandit 2 Fix
  const fallbackDir = `/characters/rigs/pandit_2_fix`;
  return {
    skelUrl: `${fallbackDir}/skeleton.json`,
    atlasUrl: `${fallbackDir}/skeleton.atlas`,
    imgUrl: `${fallbackDir}/atlas.webp`
  };
}

async function loadRigModel(charId: string, charName?: string, angle: CharacterAngle = '3/4 FRONT'): Promise<SpineKinematicsModel | null> {
  const cacheKey = `${charId}_${charName || ''}_${angle}`;
  if (rigModelCache.has(cacheKey)) {
    return rigModelCache.get(cacheKey)!;
  }
  if (loadingPromises.has(cacheKey)) {
    return loadingPromises.get(cacheKey)!;
  }

  const promise = (async () => {
    try {
      const urls = getRigFileUrls(charId, charName, angle);
      if (!urls) {
        return null;
      }

      const [skelRes, atlasRes] = await Promise.all([
        fetch(urls.skelUrl),
        fetch(urls.atlasUrl)
      ]);

      if (!skelRes.ok || !atlasRes.ok) {
        throw new Error(`Spine files not found for ${charId} at ${angle}`);
      }

      const skelJson = await skelRes.json();
      const atlasText = await atlasRes.text();

      // Load Atlas Texture
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
        img.src = urls.imgUrl;
      });

      const model = new SpineKinematicsModel();
      model.loadFromData(skelJson, atlasText, img, charId);

      // Register official AutoDraft Sitting_On_Knees animation track if present
      if (urls.skelUrl.includes('pandit_2_fix') && angle === '3/4 FRONT') {
        try {
          const animRes = await fetch('/characters/rigs/pandit_2_fix/Sitting_On_Knees.json');
          if (animRes.ok) {
            const animObj = await animRes.json();
            const k = Object.keys(animObj)[0];
            if (k) model.registerAnimation(k, animObj[k]);
          }
        } catch (_) {}
      }

      rigModelCache.set(cacheKey, model);
      return model;
    } catch (err) {
      console.warn(`[SpineCanvasRig] Could not load Spine model for ${charId}:`, err);
      return null;
    } finally {
      loadingPromises.delete(cacheKey);
    }
  })();

  loadingPromises.set(cacheKey, promise);
  return promise;
}

const SpineCanvasRigComponent: React.FC<SpineCanvasRigProps> = ({
  characterId,
  characterName = 'Character',
  angle = '3/4 FRONT',
  action,
  jsonUrl,
  isPlaying = true,
  currentTimeSeconds,
  speed = 1.0,
  scale = 1.0,
  flipH = false,
  width,
  height,
  onKinematicsUpdate,
  fallbackAvatarUrl
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [model, setModel] = useState<SpineKinematicsModel | null>(null);
  const [loadFailed, setLoadFailed] = useState<boolean>(false);
  const animTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const rafRef = useRef<number | null>(null);
  const [, setRegisteredCount] = useState<number>(0);

  // Cap DPR to 1.25 for crisp preview without quadrupling software rasterizer load
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.25) : 1;
  const isKneeling = action.toLowerCase().includes('knee') || action.toLowerCase().includes('sit');
  const targetWidth = width || 260;
  const targetHeight = height || (isKneeling ? 270 : 320);
  const pixelWidth = Math.round(targetWidth * dpr);
  const pixelHeight = Math.round(targetHeight * dpr);

  const currentTimeSecondsRef = useRef<number | undefined>(currentTimeSeconds);
  currentTimeSecondsRef.current = currentTimeSeconds;
  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  // Load Model whenever characterId, characterName, or angle changes
  useEffect(() => {
    let active = true;
    loadRigModel(characterId, characterName, angle).then((loadedModel) => {
      if (!active) return;
      if (loadedModel) {
        setModel(loadedModel);
        setLoadFailed(false);
      } else {
        setLoadFailed(true);
      }
    });
    return () => {
      active = false;
    };
  }, [characterId, characterName, angle]);

  // Dynamically load & register custom animation track if provided via jsonUrl
  useEffect(() => {
    if (!model || !jsonUrl) return;
    const existing = model.skeletonData?.findAnimation(action);
    if (existing) return;

    let active = true;
    fetch(jsonUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((animData) => {
        if (!active || !animData) return;
        const key = Object.keys(animData)[0] || action;
        model.registerAnimation(action, animData[key] || animData);
        setRegisteredCount((c) => c + 1);
      })
      .catch((err) => {
        console.warn(`[SpineCanvasRig] Failed to load custom action from ${jsonUrl}:`, err);
      });

    return () => {
      active = false;
    };
  }, [model, action, jsonUrl]);

  // Determine matching Spine animation track name
  const effectiveAnimName = React.useMemo(() => {
    if (!model) return 'Idle';
    const names = model.getAnimationNames();
    const cleanAct = action.replace(/[\s-]/g, '_');

    // 1. Direct exact match
    if (names.includes(action)) return action;
    if (names.includes(cleanAct)) return cleanAct;

    // 2. Case-insensitive search
    const foundCi = names.find((n) => n.toLowerCase() === cleanAct.toLowerCase() || n.toLowerCase() === action.toLowerCase());
    if (foundCi) return foundCi;

    // 3. Sitting on knees specific aliases
    if (action.toLowerCase().includes('knee') || cleanAct.toLowerCase().includes('kneel') || cleanAct.toLowerCase().includes('sitting_on_knee')) {
      const sittingKnees = names.find((n) => n.includes('Sitting_On_Knees') || n.includes('Sit_On_Knee'));
      if (sittingKnees) return sittingKnees;
    }

    // 4. Sitting aliases
    if (action.toLowerCase().includes('sit')) {
      const sit = names.find((n) => n === 'Sitting' || n.includes('Sitting_Floor') || n.includes('Sitting_Idle'));
      if (sit) return sit;
    }

    // 5. Walk aliases
    if (action.toLowerCase().includes('walk')) {
      const walk = names.find((n) => n === 'Walk' || n === 'Walk_EB');
      if (walk) return walk;
    }

    // 6. Run aliases
    if (action.toLowerCase().includes('run')) {
      const run = names.find((n) => n === 'Run' || n === 'Run_EB');
      if (run) return run;
    }

    // 7. Greeting / Namaskar
    if (action.toLowerCase().includes('greet') || action.toLowerCase().includes('namaste')) {
      const greet = names.find((n) => n === 'Namaskar' || n === 'Namaste');
      if (greet) return greet;
    }

    // 8. Flight / Fly / Flapping aliases for birds
    if (action.toLowerCase().includes('fly') || action.toLowerCase().includes('soar') || action.toLowerCase().includes('wing')) {
      const fly = names.find((n) => n === 'Flying' || n === 'Flying_High' || n === 'Fly' || n.toLowerCase().includes('fly'));
      if (fly) return fly;
    }

    // 9. Eating / Pecking aliases for animals & birds
    if (action.toLowerCase().includes('eat') || action.toLowerCase().includes('peck') || action.toLowerCase().includes('feed')) {
      const eat = names.find((n) => n === 'Eating' || n === 'Eating2' || n.toLowerCase().includes('eat'));
      if (eat) return eat;
    }

    // 10. Dance aliases
    if (action.toLowerCase().includes('dance')) {
      const dance = names.find((n) => n === 'Dance' || n === 'Dance2' || n.toLowerCase().includes('dance'));
      if (dance) return dance;
    }

    // 11. Looking around / alert
    if (action.toLowerCase().includes('look') || action.toLowerCase().includes('alert')) {
      const look = names.find((n) => n === 'Lookaround' || n === 'Look_Up' || n.toLowerCase().includes('look'));
      if (look) return look;
    }

    // 12. Vehicle / Car aliases
    if (action.toLowerCase().includes('drive') || action.toLowerCase().includes('ride')) {
      const drive = names.find((n) => n.toLowerCase().includes('drive'));
      if (drive) return drive;
    }
    if (action.toLowerCase().includes('accelerat')) {
      const acc = names.find((n) => n.toLowerCase().includes('accelerat'));
      if (acc) return acc;
    }
    if (action.toLowerCase().includes('drift')) {
      const drf = names.find((n) => n.toLowerCase().includes('drift'));
      if (drf) return drf;
    }
    if (action.toLowerCase().includes('coast')) {
      const cst = names.find((n) => n.toLowerCase().includes('coast'));
      if (cst) return cst;
    }
    if (action.toLowerCase().includes('collis') || action.toLowerCase().includes('crash')) {
      const cls = names.find((n) => n.toLowerCase().includes('collis'));
      if (cls) return cls;
    }
    if (action.toLowerCase().includes('brak') || action.toLowerCase().includes('stop')) {
      const brk = names.find((n) => n.toLowerCase().includes('brak'));
      if (brk) return brk;
    }
    if (action.toLowerCase().includes('revers')) {
      const rev = names.find((n) => n.toLowerCase().includes('revers'));
      if (rev) return rev;
    }
    if (action.toLowerCase().includes('smoke')) {
      const smk = names.find((n) => n.toLowerCase().includes('smoke'));
      if (smk) return smk;
    }

    // 13. Idle fallback
    const idle = names.find((n) => n === 'Idle' || n === 'Idle2' || n.toLowerCase().includes('idle')) || names[0] || 'Idle';
    return idle;
  }, [model, action]);

  // Render & Animation Loop
  useEffect(() => {
    if (!model || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const renderFrame = (now: number) => {
      if (!isRunning) return;

      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (currentTimeSecondsRef.current !== undefined && isPlayingRef.current) {
        animTimeRef.current = currentTimeSecondsRef.current * speed;
      } else if (isPlayingRef.current) {
        animTimeRef.current += dt * speed;
      } else if (currentTimeSecondsRef.current !== undefined) {
        animTimeRef.current = currentTimeSecondsRef.current * speed;
      }

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw with true 2D forward bone kinematics with DPR scale for crisp high-DPI rendering
      model.renderToCanvas(
        ctx,
        effectiveAnimName,
        animTimeRef.current,
        canvas.width,
        canvas.height,
        0.28 * scale * dpr,
        flipH
      );
      ctx.restore();

      // Report live bone kinematics data back to parent
      if (onKinematicsUpdate) {
        const solved = model.solveKinematics(effectiveAnimName, animTimeRef.current);
        const torso = solved.get('TORSO');
        const knee = solved.get('3') || solved.get('bone4');
        onKinematicsUpdate({
          activeAnimation: effectiveAnimName,
          boneCount: model.bones.length,
          torsoY: torso ? Math.round(torso.worldY) : 0,
          kneeAngle: knee ? Math.round(knee.worldRotation) : 0,
          duration: model.getAnimationDuration(effectiveAnimName)
        });
      }

      // Only request next frame if active playback is running
      if (isPlayingRef.current) {
        rafRef.current = requestAnimationFrame(renderFrame);
      }
    };

    lastTimeRef.current = performance.now();
    renderFrame(lastTimeRef.current);

    return () => {
      isRunning = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [model, effectiveAnimName, isPlaying, speed, scale, flipH, pixelWidth, pixelHeight, dpr, onKinematicsUpdate, currentTimeSeconds]);

  if (loadFailed || !model) {
    // Graceful fallback to image preview while loading or if no rig
    const act = (action || '').toLowerCase();
    let fallbackAnimClass = 'anim-idle-breathe';
    if (act.includes('greet') || act.includes('namaste') || act.includes('namaskar') || act.includes('pranam') || act.includes('pray')) {
      fallbackAnimClass = 'anim-human-greeting';
    } else if (act.includes('dance')) {
      fallbackAnimClass = 'anim-dance-groove';
    } else if (act.includes('clap') || act.includes('cheer') || act.includes('bye') || act.includes('tataa')) {
      fallbackAnimClass = 'anim-human-cheer';
    } else if (act.includes('angry') || act.includes('punch') || act.includes('kick')) {
      fallbackAnimClass = 'anim-human-angry';
    } else if (act.includes('run') || act.includes('sprint')) {
      fallbackAnimClass = 'anim-human-run';
    } else if (act.includes('walk') || act.includes('jog') || act.includes('stride') || act.includes('sneak')) {
      fallbackAnimClass = 'anim-human-walk';
    } else if (act.includes('talk') || act.includes('lipsing') || act.includes('sing') || act.includes('expression')) {
      fallbackAnimClass = 'anim-talk-gesture';
    } else if (act.includes('happy') || act.includes('laugh')) {
      fallbackAnimClass = 'anim-idle-happy';
    } else if (act.includes('knee') || act.includes('kneel')) {
      fallbackAnimClass = 'anim-sitting-knees';
    } else if (act.includes('sit')) {
      fallbackAnimClass = 'anim-sitting-floor';
    }

    return fallbackAvatarUrl ? (
      <img
        src={fallbackAvatarUrl}
        alt={characterName}
        className={`object-contain pointer-events-none drop-shadow-lg ${isPlaying ? fallbackAnimClass : ''}`}
        style={{ width: `${targetWidth}px`, height: `${targetHeight}px` }}
      />
    ) : (
      <div
        style={{ width: `${targetWidth}px`, height: `${targetHeight}px` }}
        className="flex items-center justify-center text-xs text-gray-500 animate-pulse"
      >
        Loading Spine Rig...
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center select-none">
      <canvas
        ref={canvasRef}
        width={pixelWidth}
        height={pixelHeight}
        style={{
          width: `${targetWidth}px`,
          height: `${targetHeight}px`
        }}
        className="pointer-events-none drop-shadow-xl"
      />
    </div>
  );
};

export const SpineCanvasRig = React.memo(SpineCanvasRigComponent);
