import React, { useState, useEffect } from 'react';
import { CharacterItem, CharacterAngle, CharacterActionType } from '../types/autodraft';
import { fetchSpineAnimation, SpineTrackData } from '../utils/spineEngine';
import { SpineCanvasRig } from './SpineCanvasRig';
import { getCharacterStructures } from '../data/autodraftData';

interface CharacterAvatarPreviewProps {
  character: CharacterItem;
  angle: CharacterAngle;
  action: CharacterActionType;
  jsonUrl?: string;
  isPlaying: boolean;
  currentTimeSeconds?: number;
  scale?: number;
}

export const CharacterAvatarPreview: React.FC<CharacterAvatarPreviewProps> = ({
  character,
  angle,
  action,
  jsonUrl,
  isPlaying,
  currentTimeSeconds,
  scale = 1.0
}) => {
  const [spineTrack, setSpineTrack] = useState<SpineTrackData | null>(null);
  const [imageError, setImageError] = useState(false);

  // Reset image error on character change
  useEffect(() => {
    setImageError(false);
  }, [character.id, character.avatarUrl]);

  // Load real Spine JSON animation track whenever jsonUrl or action changes
  useEffect(() => {
    let isCancelled = false;
    if (jsonUrl) {
      fetchSpineAnimation(jsonUrl).then((track) => {
        if (!isCancelled) {
          setSpineTrack(track);
        }
      });
    } else {
      setSpineTrack(null);
    }
    return () => {
      isCancelled = true;
    };
  }, [jsonUrl, action]);

  // Detect character species and category
  const cname = (character.name || '').toLowerCase();
  const cid = (character.id || '').toLowerCase();
  const cat = (character.category || '').toLowerCase();

  const isBird =
    cat.includes('bird') ||
    ['bird', 'sparrow', 'pigeon', 'eagle', 'owl', 'crow', 'peacock', 'chick', 'parrot'].some((b) =>
      cname.includes(b) || cid.includes(b)
    );

  const isAnimal =
    !isBird &&
    (cat.includes('animal') ||
      character.structureType === 'animal' ||
      ['dog', 'cat', 'cow', 'goat', 'lion', 'bear', 'elephant', 'horse', 'tiger', 'deer', 'monkey', 'rabbit', 'donkey', 'bull', 'camel', 'fox', 'wolf', 'pig', 'sheep', 'snake', 'crocodile', 'turtle', 'zebra', 'giraffe', 'cheetah', 'leopard', 'buffalo', 'hippo', 'rhino', 'panda', 'hyena', 'yak'].some((a) =>
        cname.includes(a) || cid.includes(a)
      ));

  // Full native Spine skeletal rig is enabled for all characters (Humans, Deities, Animals, Birds, Vehicles)
  const hasSpineRig = true;

  if (hasSpineRig) {
    return (
      <div className="relative flex flex-col items-center select-none">
        <SpineCanvasRig
          characterId={character.id}
          characterName={character.name}
          angle={angle}
          action={action}
          jsonUrl={jsonUrl}
          isPlaying={isPlaying}
          currentTimeSeconds={currentTimeSeconds}
          scale={scale}
          fallbackAvatarUrl={character.avatarUrl}
        />
      </div>
    );
  }

  const colors = character.colors || {
    skin: '#F5D0A9',
    hair: '#1F2937',
    shirt: '#3B82F6',
    bottom: '#1E293B',
    accent: '#F59E0B'
  };
  const details = character.details || {
    gender: 'male',
    headwear: 'none',
    outfit: 'kurta',
  };
  const avatarUrl = character.avatarUrl;

  // Action animation mapping
  const act = (action || '').toLowerCase();
  
  let animationClass = 'anim-idle-breathe';

  // Posture detection: kneeling on knees vs sitting floor vs standing
  const isKneeling = act.includes('knee') || act.includes('kneel') || act === 'sitting_on_knees';
  const isSittingFloor = !isKneeling && (act.includes('sit') || act.includes('floor'));

  // 1. Birds
  if (isBird) {
    if (act.includes('peck') || act.includes('eat') || act.includes('nibble')) {
      animationClass = 'anim-bird-peck';
    } else if (act.includes('idle') || act.includes('perch') || act.includes('sit') || act.includes('rest') || act.includes('look')) {
      animationClass = 'anim-bird-idle';
    } else {
      animationClass = 'anim-bird-fly';
    }
  }
  // 2. Animals & Quadrupeds
  else if (isAnimal) {
    if (act.includes('run') || act.includes('gallop') || act.includes('sprint')) {
      animationClass = 'anim-quadruped-run';
    } else if (act.includes('walk') || act.includes('trot') || act.includes('stride') || act.includes('slither') || act.includes('stalk') || act.includes('prowl')) {
      animationClass = 'anim-animal-walk';
    } else if (act.includes('bark')) {
      animationClass = 'anim-dog-bark';
    } else if (act.includes('roar') || act.includes('attack') || act.includes('swipe') || act.includes('charge') || act.includes('strike')) {
      animationClass = 'anim-predator-attack';
    } else if (act.includes('trumpet')) {
      animationClass = 'anim-elephant-trumpet';
    } else if (act.includes('eat') || act.includes('graze') || act.includes('chew') || act.includes('nibble')) {
      animationClass = 'anim-animal-eat';
    } else if (act.includes('jump') || act.includes('hop') || act.includes('pounce') || act.includes('rearing') || act.includes('prance') || act.includes('leap')) {
      animationClass = 'anim-animal-jump';
    } else if (act.includes('drink') || act.includes('water') || act.includes('fishing')) {
      animationClass = 'anim-animal-drink';
    } else {
      // Resting, sitting, sniffing, tail wagging, idle
      animationClass = 'anim-animal-sniff-wag';
    }
  }
  // 3. Vehicles
  else if (act.includes('drift')) {
    animationClass = 'anim-car-drift';
  } else if (act.includes('reverse')) {
    animationClass = 'anim-car-reverse';
  } else if (act.includes('drive') || act.includes('accelerat') || act.includes('coasting') || act.includes('collision')) {
    animationClass = 'anim-car-drive';
  }
  // 4. Humans & Kids
  else if (act.includes('greet') || act.includes('namaste') || act.includes('namaskar') || act.includes('pranam') || act.includes('pray') || act.includes('pooja') || act.includes('present')) {
    animationClass = 'anim-human-greeting';
  } else if (act.includes('dance')) {
    animationClass = 'anim-dance-groove';
  } else if (act.includes('clap') || act.includes('cheer') || act.includes('bye') || act.includes('tataa') || act.includes('hi') || act.includes('wave')) {
    animationClass = 'anim-human-cheer';
  } else if (act.includes('angry') || act.includes('fight') || act.includes('punch') || act.includes('kick') || act.includes('slap')) {
    animationClass = 'anim-human-angry';
  } else if (act.includes('run') || act.includes('sprint')) {
    animationClass = 'anim-human-run';
  } else if (act.includes('walk') || act.includes('jog') || act.includes('stride') || act.includes('sneak') || act.includes('toe_walk')) {
    animationClass = 'anim-human-walk';
  } else if (act.includes('talk') || act.includes('lipsing') || act.includes('sing') || act.includes('chirp') || act.includes('chatter') || act.includes('yell') || act.includes('shout') || act.includes('expression')) {
    animationClass = 'anim-talk-gesture';
  } else if (act.includes('happy') || act.includes('bounce') || act.includes('laugh') || act.includes('giggle')) {
    animationClass = 'anim-idle-happy';
  } else if (isKneeling) {
    animationClass = 'anim-sitting-knees';
  } else if (isSittingFloor) {
    animationClass = 'anim-sitting-floor';
  } else if (act.includes('idle') || act.includes('rest') || act.includes('sleep') || act.includes('think') || act.includes('look')) {
    animationClass = 'anim-idle-breathe';
  }

  // 3D Perspective Turnaround based on Angle
  let angleTransform = 'perspective(1000px) rotateY(0deg) scaleX(1)';
  let angleFilter = 'none';

  if (angle === 'FRONT') {
    angleTransform = 'perspective(1000px) rotateY(0deg) scaleX(1)';
    angleFilter = 'brightness(1.03) contrast(1.02)';
  } else if (angle === '3/4 FRONT') {
    angleTransform = 'perspective(1000px) rotateY(20deg) scaleX(1)';
    angleFilter = 'none';
  } else if (angle === '3/4 BACK') {
    angleTransform = 'perspective(1000px) rotateY(162deg) scaleX(-1)';
    angleFilter = 'brightness(0.90) contrast(0.95) saturate(0.92)';
  }

  // Determine active animation class: prioritize real Spine track if loaded
  const effectiveAnimClass = spineTrack?.animationClassName || animationClass;

  // If character has official AutoDraft WebP asset, render the real official illustration with animations
  if (avatarUrl && !imageError) {
    return (
      <div
        style={{
          transform: `scale(${scale})`,
          animationPlayState: isPlaying ? 'running' : 'paused'
        }}
        className={`relative flex flex-col items-center select-none transition-all ${effectiveAnimClass}`}
      >
        <div
          style={{
            transform: angleTransform,
            filter: angleFilter,
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease',
            transformStyle: 'preserve-3d',
            transformOrigin: isKneeling || isSittingFloor ? 'bottom center' : 'center center'
          }}
          className="relative flex flex-col items-center"
        >
          {/* Posture Morphing & Lower Limb Folding for Kneeling / Floor Sit */}
          <div
            style={{
              transformOrigin: 'bottom center',
              transform: isKneeling
                ? 'translateY(18px) scaleY(0.70) scaleX(1.10)'
                : isSittingFloor
                ? 'translateY(12px) scaleY(0.78) scaleX(1.06)'
                : 'none',
              transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            className="relative flex flex-col items-center"
          >
            <img
              src={avatarUrl}
              alt={character.name}
              onError={() => setImageError(true)}
              className={`${
                isAnimal ? 'max-h-32 max-w-48 w-auto h-auto' : isBird ? 'max-h-24 max-w-28 w-auto h-auto' : 'h-40 w-auto'
              } object-contain pointer-events-none drop-shadow-lg`}
              loading="lazy"
            />

            {/* Shaded back overlay for 3/4 BACK angle */}
            {angle === '3/4 BACK' && (
              <div className="absolute inset-0 bg-slate-950/20 mix-blend-multiply rounded pointer-events-none" />
            )}

            {/* Ground contact shadow for Kneeling & Floor Sitting */}
            {(isKneeling || isSittingFloor) && (
              <div className="absolute -bottom-1.5 w-28 h-4 bg-black/35 rounded-full blur-[2.5px] pointer-events-none" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback vector puppet helpers
  const isBack = angle === '3/4 BACK';
  const is34Front = angle === '3/4 FRONT';
  const isWalking = act.includes('walk');
  const isRunning = act.includes('run') || act.includes('gallop') || act.includes('sprint');
  const isTalking = act.includes('talk') || act.includes('sing') || act.includes('expression');
  const isIdleHappy = act.includes('happy') || act.includes('bounce');
  const isIdle = act.includes('idle') || act.includes('rest');
  const isGreeting = act.includes('greet') || act.includes('namaste');
  const isSitting = act.includes('sit');

  // Fallback vector puppet
  return (
    <div
      style={{ transform: `scale(${scale})` }}
      className={`relative flex flex-col items-center select-none transition-all ${
        isWalking ? 'anim-walk-bob' : isRunning ? 'anim-run-bob' : isIdle ? 'anim-idle-breathe' : isIdleHappy ? 'anim-idle-happy' : ''
      }`}
    >
      {/* 1. HEAD & FACE */}
      <div
        className="w-12 h-12 rounded-full border border-black/20 shadow-md relative flex flex-col items-center justify-center z-20"
        style={{ backgroundColor: colors.skin }}
      >
        {!isBack ? (
          <>
            <div
              className="absolute -top-1.5 w-12 h-5 rounded-t-full shadow-sm"
              style={{ backgroundColor: colors.hair }}
            />
            {details.headwear === 'pagri' && (
              <div
                className="absolute -top-3 w-14 h-6 rounded-t-full border-b border-black/20 shadow-md"
                style={{ backgroundColor: colors.accent }}
              />
            )}
            {details.headwear === 'cap' && (
              <div className="absolute -top-3 w-14 h-5 rounded-t-lg bg-amber-900 border-b-2 border-yellow-500 shadow" />
            )}

            <div className={`flex gap-2.5 mt-1.5 ${is34Front ? 'translate-x-1' : ''}`}>
              <div className="w-2 h-2 rounded-full bg-slate-900 relative">
                <div className="w-0.5 h-0.5 bg-white rounded-full absolute top-0.5 left-0.5" />
              </div>
              <div className="w-2 h-2 rounded-full bg-slate-900 relative">
                <div className="w-0.5 h-0.5 bg-white rounded-full absolute top-0.5 left-0.5" />
              </div>
            </div>

            {details.gender === 'male' && (
              <div className={`w-5 h-1.5 bg-slate-900 rounded-full mt-0.5 shadow-sm ${is34Front ? 'translate-x-1' : ''}`} />
            )}

            <div
              className={`w-3 h-1.5 rounded-full bg-rose-700 mt-0.5 transition-all ${
                isTalking ? 'anim-talk-mouth' : ''
              } ${is34Front ? 'translate-x-1' : ''}`}
            />
          </>
        ) : (
          <div
            className="w-full h-full rounded-full border border-black/30 shadow-inner"
            style={{ backgroundColor: colors.hair }}
          >
            {details.headwear === 'pagri' && (
              <div
                className="w-full h-8 -mt-2 rounded-t-full shadow"
                style={{ backgroundColor: colors.accent }}
              />
            )}
          </div>
        )}
      </div>

      {/* 2. TORSO & DRESS */}
      <div className="relative flex justify-center z-10 -mt-1">
        <div
          className={`absolute top-1 -left-4 w-4 h-16 rounded-full shadow-sm ${
            isWalking
              ? 'anim-walk-arm-l'
              : isRunning
              ? 'anim-run-arm-l'
              : isGreeting
              ? 'anim-wave-arm'
              : isTalking
              ? 'anim-talk-gesture'
              : ''
          }`}
          style={{
            backgroundColor: details.outfit === 'banyan_dhoti' ? colors.skin : colors.shirt,
            transformOrigin: 'top center'
          }}
        >
          <div
            className="w-3.5 h-3.5 rounded-full absolute -bottom-1 left-0.5 border border-black/10"
            style={{ backgroundColor: colors.skin }}
          />
        </div>

        <div
          className="w-16 h-20 rounded-t-xl rounded-b-md shadow-md relative overflow-hidden flex flex-col items-center justify-between"
          style={{ backgroundColor: colors.shirt }}
        >
          {details.outfit === 'saree' && (
            <div className="absolute inset-0 w-8 bg-amber-500/25 transform rotate-12 -translate-x-1 border-r border-amber-400/40" />
          )}
          {colors.accent && (details.gender === 'male' || details.gender === 'elder') && (
            <div
              className="w-3 h-full absolute left-1 shadow-sm opacity-90"
              style={{ backgroundColor: colors.accent }}
            />
          )}
          <div className="w-1.5 h-10 bg-black/15 mt-1 rounded" />
        </div>

        <div
          className={`absolute top-1 -right-4 w-4 h-16 rounded-full shadow-sm ${
            isWalking ? 'anim-walk-arm-r' : isRunning ? 'anim-run-arm-r' : ''
          }`}
          style={{
            backgroundColor: details.outfit === 'banyan_dhoti' ? colors.skin : colors.shirt,
            transformOrigin: 'top center'
          }}
        >
          <div
            className="w-3.5 h-3.5 rounded-full absolute -bottom-1 left-0.5 border border-black/10"
            style={{ backgroundColor: colors.skin }}
          />
        </div>
      </div>

      {/* 3. LEGS & DHOTI */}
      <div className="relative -mt-1.5 z-0 flex justify-center">
        {isKneeling ? (
          <div className="flex flex-col items-center">
            <div className="w-20 h-7 rounded-t-md rounded-b-xl shadow-md -mt-1" style={{ backgroundColor: colors.bottom }} />
            <div className="flex gap-2 -mt-1">
              <div className="w-8 h-3 rounded-full shadow bg-amber-950/80" />
              <div className="w-8 h-3 rounded-full shadow bg-amber-950/80" />
            </div>
          </div>
        ) : isSitting ? (
          <div className="flex flex-col items-center">
            <div className="w-18 h-6 rounded shadow-md" style={{ backgroundColor: colors.bottom }} />
            <div className="flex gap-4 -mt-1">
              <div className="w-4 h-14 rounded-b shadow" style={{ backgroundColor: colors.bottom }} />
              <div className="w-4 h-14 rounded-b shadow" style={{ backgroundColor: colors.bottom }} />
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <div
              className={`w-5 h-20 rounded-b shadow-md flex flex-col justify-end items-center ${
                isWalking ? 'anim-walk-leg-l' : isRunning ? 'anim-run-leg-l' : ''
              }`}
              style={{ backgroundColor: colors.bottom, transformOrigin: 'top center' }}
            >
              <div className="w-6 h-2.5 bg-amber-950 rounded-sm shadow-sm -mb-0.5" />
            </div>

            <div
              className={`w-5 h-20 rounded-b shadow-md flex flex-col justify-end items-center ${
                isWalking ? 'anim-walk-leg-r' : isRunning ? 'anim-run-leg-r' : ''
              }`}
              style={{ backgroundColor: colors.bottom, transformOrigin: 'top center' }}
            >
              <div className="w-6 h-2.5 bg-amber-950 rounded-sm shadow-sm -mb-0.5" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
