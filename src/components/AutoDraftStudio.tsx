import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  FolderOpen, 
  Layers, 
  Sparkles, 
  Video, 
  Mic, 
  Music,
  Image as ImageIcon, 
  Type, 
  ChevronLeft, 
  Edit3, 
  History, 
  Save, 
  Settings, 
  Download
} from 'lucide-react';
import { AUTODRAFT_CHARACTERS, AUTODRAFT_TEMPLATES, AUTODRAFT_ACTIONS, getActionsForCharacter } from '../data/autodraftData';
import { CharacterItem, CharacterActionType, CharacterAngle, SceneTemplate, ActiveCanvasCharacter, ActiveCanvasMediaLayer, CameraTimelineTrack, BackgroundTimelineTrack, StudioScene } from '../types/autodraft';
import { AutoDraftTemplateModal } from './AutoDraftTemplateModal';
import { AutoDraftCharacterDrawer } from './AutoDraftCharacterDrawer';
import { AutoDraftMediaDrawer, MediaAssetItem } from './AutoDraftMediaDrawer';
import { AutoDraftAudioDrawer } from './AutoDraftAudioDrawer';
import { AutoDraftEffectsDrawer } from './AutoDraftEffectsDrawer';
import { AutoDraftCanvasStage } from './AutoDraftCanvasStage';
import { AutoDraftTimeline } from './AutoDraftTimeline';
import { AutoDraftRightPanel } from './AutoDraftRightPanel';
import { AutoDraftPropsDrawer } from './AutoDraftPropsDrawer';
import { PropSlotKey } from '../data/autodraftProps';
import { ActiveAudioTrack, VisualOverlayEffect } from '../types/audio';
import { AutoDraftExportModal } from './AutoDraftExportModal';
import { AUTODRAFT_STOCK_AUDIO } from '../utils/audioLibrary';

import { fetchSpineAnimation } from '../utils/spineEngine';

export const AutoDraftStudio: React.FC = () => {
  // 1. Template Modal State (Click Templates button to open, or pass ?modal=templates)
  const urlParams = new URLSearchParams(window.location.search);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(
    urlParams.get('modal') === 'templates'
  );

  const [currentTemplate, setCurrentTemplate] = useState<SceneTemplate | null>(() => {
    const tplParam = urlParams.get('template');
    if (tplParam) {
      const found = AUTODRAFT_TEMPLATES.find(
        (t) => t.id === tplParam || t.name.toLowerCase().includes(tplParam.toLowerCase())
      );
      if (found) return found;
    }
    return null;
  });

  // 2. Left Icon Bar Active Tool
  const [activeLeftTool, setActiveLeftTool] = useState<'character' | 'props' | 'media' | 'audio' | 'effects' | 'templates' | 'image_gen' | 'video_gen' | 'ai_voice' | 'text'>(
    (urlParams.get('tool') as any) || 'character'
  );

  // 3. Active Character & Action State (Default to Pandit 2 New or ?character=)
  const defaultChar = (() => {
    const charParam = urlParams.get('character');
    if (charParam) {
      const f = AUTODRAFT_CHARACTERS.find(
        (c) => c.id === charParam || c.name.toLowerCase() === charParam.toLowerCase() || c.name.toLowerCase().includes(charParam.toLowerCase())
      );
      if (f) return f;
    }
    return AUTODRAFT_CHARACTERS.find((c) => c.name.toLowerCase().includes('pandit 2 new') || c.id === '811550') || AUTODRAFT_CHARACTERS[0];
  })();
  const initialAngle: CharacterAngle = '3/4 FRONT';
  const initialActions = getActionsForCharacter(defaultChar, initialAngle);
  const actionParam = urlParams.get('action');
  const matchedAction = actionParam
    ? initialActions.find(
        (a) => a.id.toLowerCase() === actionParam.toLowerCase() || a.label.toLowerCase() === actionParam.toLowerCase()
      )
    : null;
  const initialAction = matchedAction || initialActions[0] || {
    id: actionParam || 'Idle',
    label: actionParam || 'Idle',
    jsonUrl: '/animations/json/kid/Sitting_On_Knees.json'
  };

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterItem>(defaultChar);
  const [selectedAngle, setSelectedAngle] = useState<CharacterAngle>(initialAngle);
  const [selectedAction, setSelectedAction] = useState<CharacterActionType>(initialAction.id);

  // Active Spine 2D Track indicator (mimics AutoDraft Network calls)
  const [activeSpineTrack, setActiveSpineTrack] = useState<{
    actionId: string;
    label: string;
    jsonUrl: string;
    boneCount: number;
    duration: number;
  } | null>({
    actionId: initialAction.id,
    label: initialAction.label,
    jsonUrl: initialAction.jsonUrl || '/animations/json/kid/Sitting_On_Knees.json',
    boneCount: 19,
    duration: 1.5
  });

  // 4. Characters On Canvas (Auto-load template sample characters, custom character from URL, or empty for default white canvas)
  const [charactersOnStage, setCharactersOnStage] = useState<ActiveCanvasCharacter[]>(() => {
    const charParam = urlParams.get('character');
    const scaleParam = urlParams.get('scale') ? parseFloat(urlParams.get('scale')!) : (charParam ? 1.2 : 1.1);
    if (charParam) {
      return [
        {
          instanceId: 'char_inst_custom',
          characterId: defaultChar.id,
          name: defaultChar.name,
          x: 50,
          y: 75,
          scale: scaleParam,
          flipH: false,
          angle: initialAngle,
          action: initialAction.id,
          jsonUrl: initialAction.jsonUrl,
          speed: 1.0,
          isPlaying: true
        }
      ];
    }
    const tplParam = urlParams.get('template');
    if (tplParam) {
      const found = AUTODRAFT_TEMPLATES.find(
        (t) => t.id === tplParam || t.name.toLowerCase().includes(tplParam.toLowerCase())
      );
      if (found && found.sampleCharacters && found.sampleCharacters.length > 0) {
        return found.sampleCharacters.map((c) => ({ ...c, isLocked: true }));
      }
    }
    return [];
  });
  const [selectedCharInstanceId, setSelectedCharInstanceId] = useState<string | null>(() => {
    const charParam = urlParams.get('character');
    if (charParam) return 'char_inst_custom';
    const tplParam = urlParams.get('template');
    if (tplParam) {
      const found = AUTODRAFT_TEMPLATES.find(
        (t) => t.id === tplParam || t.name.toLowerCase().includes(tplParam.toLowerCase())
      );
      if (found && found.sampleCharacters && found.sampleCharacters.length > 0) {
        return found.sampleCharacters[0].instanceId;
      }
    }
    return null;
  });

  // 4b. Custom Media & Background State
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string | null>(null);
  const [backgroundTrack, setBackgroundTrack] = useState<BackgroundTimelineTrack | null>(null);
  const [canvasMediaLayers, setCanvasMediaLayers] = useState<ActiveCanvasMediaLayer[]>(() => {
    if (urlParams.get('media') === '1' || urlParams.get('audio') === '140') {
      return [{
        instanceId: 'media_rathh_1',
        mediaId: 'rathh_horses',
        name: 'Rathh with Divine Horses',
        url: '/characters/rigs/pandit_2_fix/atlas.webp',
        type: 'image',
        x: 50,
        y: 45,
        scale: 1.2,
        startTime: 0,
        duration: 140,
        zIndex: 12
      }];
    }
    return [];
  });
  const [selectedMediaInstanceId, setSelectedMediaInstanceId] = useState<string | null>(null);

  // 4c. Active Timeline Audio Tracks State & Export Modal State
  const [audioTracks, setAudioTracks] = useState<ActiveAudioTrack[]>(() => {
    if (urlParams.get('audio') === '140' || urlParams.get('audio') === 'geeta') {
      return [{
        id: 'geeta_audio_140',
        name: 'Shri Krishna Geeta Updesh & Flute (Long)',
        url: AUTODRAFT_STOCK_AUDIO[0]?.url || '',
        duration: 140,
        volume: 0.9,
        isMuted: false,
        startTime: 0,
        category: 'music'
      }];
    }
    if (urlParams.get('audio') === '1' || urlParams.get('audio') === 'flute') {
      const flute = AUTODRAFT_STOCK_AUDIO[0];
      return [{
        id: flute.id,
        name: flute.name,
        url: flute.url || (flute.generate ? flute.generate() : ''),
        duration: flute.durationSeconds,
        volume: 0.8,
        isMuted: false,
        startTime: 0,
        category: 'music'
      }];
    }
    return [];
  });
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(
    urlParams.get('modal') === 'export'
  );
  const audioElementsRef = React.useRef<Map<string, HTMLAudioElement>>(new Map());
  const [selectedAudioTrackId, setSelectedAudioTrackId] = useState<string | null>(null);
  const selectedAudioTrack = useMemo(
    () => audioTracks.find((t) => t.id === selectedAudioTrackId) || null,
    [audioTracks, selectedAudioTrackId]
  );

  // 5. Playback Loop (Defaults to True so animations play immediately on load)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState<number>(() => {
    const maxAudio = audioTracks.reduce((acc, t) => Math.max(acc, (t.startTime || 0) + (t.duration || 15)), 15);
    return Math.max(15, Math.ceil(maxAudio));
  });

  // 5b. Multi-Scene Project State
  const [scenes, setScenes] = useState<StudioScene[]>(() => [
    {
      id: 'scene_1',
      name: 'Scene 1',
      duration: 15,
      currentTime: 0,
      characters: charactersOnStage,
      audioTracks: audioTracks,
      canvasMediaLayers: canvasMediaLayers,
      backgroundTrack: backgroundTrack,
      currentTemplate: currentTemplate,
      customBackgroundUrl: customBackgroundUrl
    }
  ]);
  const [activeSceneId, setActiveSceneId] = useState<string>('scene_1');

  // Keep active scene synchronized with live stage & timeline states
  useEffect(() => {
    setScenes((prev) =>
      prev.map((sc) =>
        sc.id === activeSceneId
          ? {
              ...sc,
              characters: charactersOnStage,
              audioTracks,
              canvasMediaLayers,
              backgroundTrack,
              currentTemplate,
              customBackgroundUrl,
              duration: totalDurationSeconds
            }
          : sc
      )
    );
  }, [
    activeSceneId,
    charactersOnStage,
    audioTracks,
    canvasMediaLayers,
    backgroundTrack,
    currentTemplate,
    customBackgroundUrl,
    totalDurationSeconds
  ]);

  const handleSelectScene = (newSceneId: string) => {
    if (newSceneId === activeSceneId) return;
    const targetScene = scenes.find((s) => s.id === newSceneId);
    if (!targetScene) return;

    setActiveSceneId(newSceneId);
    setCharactersOnStage(targetScene.characters || []);
    setAudioTracks(targetScene.audioTracks || []);
    setCanvasMediaLayers(targetScene.canvasMediaLayers || []);
    setBackgroundTrack(targetScene.backgroundTrack || null);
    setCurrentTemplate(targetScene.currentTemplate || null);
    setCustomBackgroundUrl(targetScene.customBackgroundUrl || null);
    setTotalDurationSeconds(targetScene.duration || 15);
    setCurrentTimeSeconds(0);
    setSelectedCharInstanceId(targetScene.characters?.[0]?.instanceId || null);
    setSelectedMediaInstanceId(null);
    setSelectedAudioTrackId(null);
  };

  const handleAddScene = () => {
    const newSceneId = `scene_${Date.now()}`;
    const newNum = scenes.length + 1;
    const newScene: StudioScene = {
      id: newSceneId,
      name: `Scene ${newNum}`,
      duration: 10,
      currentTime: 0,
      characters: [],
      audioTracks: [],
      canvasMediaLayers: [],
      backgroundTrack: null,
      currentTemplate: null,
      customBackgroundUrl: null
    };

    setScenes((prev) => [...prev, newScene]);
    setActiveSceneId(newSceneId);
    setCharactersOnStage([]);
    setAudioTracks([]);
    setCanvasMediaLayers([]);
    setBackgroundTrack(null);
    setCurrentTemplate(null);
    setCustomBackgroundUrl(null);
    setTotalDurationSeconds(10);
    setCurrentTimeSeconds(0);
    setSelectedCharInstanceId(null);
    setSelectedMediaInstanceId(null);
    setSelectedAudioTrackId(null);
  };

  const handleDuplicateScene = (sceneId: string) => {
    const srcScene = scenes.find((s) => s.id === sceneId);
    if (!srcScene) return;

    const newSceneId = `scene_${Date.now()}`;
    const duplicatedScene: StudioScene = {
      id: newSceneId,
      name: `Scene ${scenes.length + 1}`,
      duration: srcScene.duration || 10,
      currentTime: 0,
      characters: (srcScene.characters || []).map((c, i) => ({
        ...c,
        instanceId: `char_dup_${Date.now()}_${i}`
      })),
      audioTracks: (srcScene.audioTracks || []).map((a, i) => ({
        ...a,
        id: `audio_dup_${Date.now()}_${i}`
      })),
      canvasMediaLayers: (srcScene.canvasMediaLayers || []).map((m, i) => ({
        ...m,
        instanceId: `media_dup_${Date.now()}_${i}`
      })),
      backgroundTrack: srcScene.backgroundTrack ? { ...srcScene.backgroundTrack, id: `bg_dup_${Date.now()}` } : null,
      currentTemplate: srcScene.currentTemplate,
      customBackgroundUrl: srcScene.customBackgroundUrl
    };

    const targetIdx = scenes.findIndex((s) => s.id === sceneId);
    const updated = [...scenes];
    updated.splice(targetIdx + 1, 0, duplicatedScene);

    const renumbered = updated.map((sc, i) => ({
      ...sc,
      name: sc.name.startsWith('Scene ') ? `Scene ${i + 1}` : sc.name
    }));

    setScenes(renumbered);
    setActiveSceneId(newSceneId);
    setCharactersOnStage(duplicatedScene.characters);
    setAudioTracks(duplicatedScene.audioTracks);
    setCanvasMediaLayers(duplicatedScene.canvasMediaLayers);
    setBackgroundTrack(duplicatedScene.backgroundTrack);
    setCurrentTemplate(duplicatedScene.currentTemplate);
    setCustomBackgroundUrl(duplicatedScene.customBackgroundUrl);
    setTotalDurationSeconds(duplicatedScene.duration);
    setCurrentTimeSeconds(0);
    setSelectedCharInstanceId(duplicatedScene.characters[0]?.instanceId || null);
  };

  const handleDeleteScene = (sceneId: string) => {
    if (scenes.length <= 1) return;
    const remaining = scenes.filter((s) => s.id !== sceneId);
    const renumbered = remaining.map((sc, i) => ({
      ...sc,
      name: sc.name.startsWith('Scene ') ? `Scene ${i + 1}` : sc.name
    }));
    setScenes(renumbered);

    if (activeSceneId === sceneId) {
      const nextActive = renumbered[0];
      setActiveSceneId(nextActive.id);
      setCharactersOnStage(nextActive.characters || []);
      setAudioTracks(nextActive.audioTracks || []);
      setCanvasMediaLayers(nextActive.canvasMediaLayers || []);
      setBackgroundTrack(nextActive.backgroundTrack || null);
      setCurrentTemplate(nextActive.currentTemplate || null);
      setCustomBackgroundUrl(nextActive.customBackgroundUrl || null);
      setTotalDurationSeconds(nextActive.duration || 10);
      setCurrentTimeSeconds(0);
      setSelectedCharInstanceId(nextActive.characters?.[0]?.instanceId || null);
    }
  };

  const handleReorderScenes = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= scenes.length || toIndex < 0 || toIndex >= scenes.length) {
      return;
    }
    const reordered = [...scenes];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    // Auto-update sequential names: Scene 1, Scene 2, Scene 3...
    const renumbered = reordered.map((sc, i) => ({
      ...sc,
      name: sc.name.startsWith('Scene ') ? `Scene ${i + 1}` : sc.name
    }));
    setScenes(renumbered);
  };

  const handleRenameScene = (sceneId: string, newName: string) => {
    setScenes((prev) =>
      prev.map((sc) => (sc.id === sceneId ? { ...sc, name: newName } : sc))
    );
  };

  // Keep HTML5 Audio elements strictly synchronized with audioTracks state and time window
  useEffect(() => {
    const currentMap = audioElementsRef.current;
    // Remove deleted tracks
    for (const [id, audioEl] of currentMap.entries()) {
      if (!audioTracks.some((t) => t.id === id)) {
        audioEl.pause();
        audioEl.src = '';
        currentMap.delete(id);
      }
    }
    // Add or update tracks
    audioTracks.forEach((track) => {
      let audioEl = currentMap.get(track.id);
      if (!audioEl) {
        audioEl = new Audio(track.url);
        currentMap.set(track.id, audioEl);
      } else if (audioEl.src !== track.url && track.url) {
        audioEl.src = track.url;
      }
      audioEl.volume = track.isMuted ? 0 : (track.volume ?? 1);
      audioEl.playbackRate = (track.speed || 1.0) * playbackSpeed;

      const start = track.startTime || 0;
      const dur = track.duration || 15;
      const inWindow = currentTimeSeconds >= start && currentTimeSeconds <= start + dur;

      if (isPlaying && inWindow && !track.isMuted) {
        const targetTime = currentTimeSeconds - start + (track.offset || 0);
        if (Math.abs(audioEl.currentTime - targetTime) > 0.3) {
          try {
            audioEl.currentTime = targetTime;
          } catch (_) {}
        }
        if (audioEl.paused) {
          audioEl.play().catch(() => {});
        }
      } else {
        if (!audioEl.paused) {
          audioEl.pause();
        }
      }
    });
  }, [audioTracks, isPlaying, Math.floor(currentTimeSeconds * 4) / 4]);

  // Automated character lip-sync during audio playback
  useEffect(() => {
    if (!isPlaying) return;
    const activeLipSyncTrack = audioTracks.find((t) => {
      const start = t.startTime || 0;
      const dur = t.duration || 15;
      const inWindow = currentTimeSeconds >= start && currentTimeSeconds <= start + dur;
      return t.lipSyncEnabled && inWindow && !t.isMuted;
    });

    if (activeLipSyncTrack) {
      const targetInstId = activeLipSyncTrack.targetCharacterId || charactersOnStage[0]?.instanceId;
      if (targetInstId) {
        setCharactersOnStage((prev) =>
          prev.map((inst) => {
            if (inst.instanceId === targetInstId) {
              const currentAction = inst.action.toLowerCase();
              if (!currentAction.includes('lipsing') && !currentAction.includes('talk')) {
                return {
                  ...inst,
                  action: 'Lipsing_Loop'
                };
              }
            }
            return inst;
          })
        );
      }
    }
  }, [isPlaying, Math.floor(currentTimeSeconds * 4) / 4, audioTracks]);

  const handleSeek = (sec: number) => {
    setCurrentTimeSeconds(sec);
    audioTracks.forEach((track) => {
      const audioEl = audioElementsRef.current.get(track.id);
      if (!audioEl) return;
      const start = track.startTime || 0;
      const dur = track.duration || 15;
      const inWindow = sec >= start && sec <= start + dur;
      if (inWindow && !track.isMuted) {
        try {
          audioEl.currentTime = sec - start + (track.offset || 0);
          if (isPlaying && audioEl.paused) audioEl.play().catch(() => {});
        } catch (_) {}
      } else {
        audioEl.pause();
      }
    });
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (!next) {
        // Paused: pause all audio elements
        audioElementsRef.current.forEach((audioEl) => {
          audioEl.pause();
        });
      }
      return next;
    });
  };

  const handleResetPlayback = () => {
    setCurrentTimeSeconds(0);
    audioTracks.forEach((track) => {
      const audioEl = audioElementsRef.current.get(track.id);
      if (!audioEl) return;
      try {
        audioEl.currentTime = track.offset || 0;
        if ((track.startTime || 0) === 0 && isPlaying && !track.isMuted) {
          audioEl.play().catch(() => {});
        } else {
          audioEl.pause();
        }
      } catch (_) {}
    });
  };

  const handleAddAudioTrack = (track: ActiveAudioTrack) => {
    setAudioTracks((prev) => {
      if (prev.some((t) => t.id === track.id)) return prev;
      return [...prev, track];
    });
    const trackEnd = (track.startTime || 0) + (track.duration || 15);
    setTotalDurationSeconds((prev) => Math.max(prev, Math.ceil(trackEnd)));
  };

  const handleUpdateAudioTrack = (trackId: string, updates: Partial<ActiveAudioTrack>) => {
    setAudioTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, ...updates } : t))
    );
    if (updates.startTime !== undefined || updates.duration !== undefined) {
      setTotalDurationSeconds((prev) => {
        const track = audioTracks.find((t) => t.id === trackId);
        if (!track) return prev;
        const start = updates.startTime !== undefined ? updates.startTime : (track.startTime || 0);
        const dur = updates.duration !== undefined ? updates.duration : (track.duration || 15);
        return Math.max(prev, Math.ceil(start + dur));
      });
    }
  };

  const handleDeleteAudioTrack = (trackId: string) => {
    setAudioTracks((prev) => prev.filter((t) => t.id !== trackId));
  };

  const handleSplitAudioTrack = (trackId: string, splitTime: number) => {
    setAudioTracks((prev) => {
      const track = prev.find((t) => t.id === trackId);
      if (!track) return prev;
      const firstDur = splitTime - track.startTime;
      const secondDur = track.duration - firstDur;
      if (firstDur <= 0.2 || secondDur <= 0.2) return prev;
      const updatedFirst = { ...track, duration: firstDur };
      const secondClip: ActiveAudioTrack = {
        ...track,
        id: `${track.id}_split_${Date.now()}`,
        name: `${track.name} (Part 2)`,
        startTime: splitTime,
        duration: secondDur,
        offset: (track.offset || 0) + firstDur
      };
      return prev.map((t) => (t.id === trackId ? updatedFirst : t)).concat(secondClip);
    });
  };

  // Camera Track State (Brown track in AutoDraft screenshots) - Null by default!
  const [cameraTrack, setCameraTrack] = useState<CameraTimelineTrack | null>(null);

  const handleAddCameraTrack = () => {
    setCameraTrack({
      id: 'camera_main',
      name: 'Camera',
      startTime: 0,
      duration: Math.min(15, totalDurationSeconds),
      isVisible: true,
      isLocked: false
    });
  };

  const handleDeleteCameraTrack = () => {
    setCameraTrack(null);
  };

  const handleUpdateCameraTrack = (updates: Partial<CameraTimelineTrack>) => {
    setCameraTrack((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updates };
      if (updates.startTime !== undefined || updates.duration !== undefined) {
        setTotalDurationSeconds((t) => Math.max(t, Math.ceil(next.startTime + next.duration)));
      }
      return next;
    });
  };

  const handleUpdateCharacterTimeline = (instanceId: string, updates: Partial<ActiveCanvasCharacter>) => {
    setCharactersOnStage((prev) =>
      prev.map((c) => (c.instanceId === instanceId ? { ...c, ...updates } : c))
    );
    if (updates.startTime !== undefined || updates.duration !== undefined) {
      setTotalDurationSeconds((prev) => {
        const char = charactersOnStage.find((c) => c.instanceId === instanceId);
        if (!char) return prev;
        const start = updates.startTime !== undefined ? updates.startTime : (char.startTime || 0);
        const dur = updates.duration !== undefined ? updates.duration : (char.duration || 15);
        return Math.max(prev, Math.ceil(start + dur));
      });
    }
  };

  // Enhanced transport actions from AutoDraft screenshot
  const handleRewind5s = () => {
    handleSeek(Math.max(0, currentTimeSeconds - 5));
  };

  const handleForward5s = () => {
    handleSeek(Math.min(totalDurationSeconds, currentTimeSeconds + 5));
  };

  const handleJumpToStart = () => {
    handleSeek(0);
  };

  const handleJumpToEnd = () => {
    handleSeek(totalDurationSeconds);
  };

  // 4d. Visual Overlay Effects State
  const [activeEffects, setActiveEffects] = useState<VisualOverlayEffect[]>([]);

  const handleAddEffect = (effect: VisualOverlayEffect) => {
    setActiveEffects((prev) => {
      if (prev.some((e) => e.id === effect.id)) return prev;
      return [...prev, effect];
    });
  };

  const handleRemoveEffect = (effectId: string | number) => {
    setActiveEffects((prev) => prev.filter((e) => e.id !== effectId));
  };

  const handleUpdateEffectOpacity = (effectId: string | number, opacity: number) => {
    setActiveEffects((prev) =>
      prev.map((e) => (e.id === effectId ? { ...e, opacity } : e))
    );
  };

  // On mount: Fetch initial Spine animation JSON so Network tab registers 200 OK immediately
  useEffect(() => {
    if (initialAction.jsonUrl) {
      fetchSpineAnimation(initialAction.jsonUrl).then((track) => {
        setActiveSpineTrack({
          actionId: initialAction.id,
          label: initialAction.label,
          jsonUrl: initialAction.jsonUrl!,
          boneCount: track.activeBoneCount,
          duration: track.duration
        });
      });
    }
    if (currentTemplate && canvasMediaLayers.length === 0) {
      handleApplyTemplate(currentTemplate);
    }
  }, []);

  // Accurate real-time wall-clock playback loop (smooth 1:1 second progression)
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const elapsedMs = now - lastTime;
      // Update at smooth ~30fps (every 33ms) so React re-renders stay lightweight,
      // while using EXACT elapsed wall-clock milliseconds so 1 real second = 1.000s in timeline!
      if (elapsedMs >= 33) {
        const deltaSec = (elapsedMs / 1000) * playbackSpeed;
        lastTime = now;

        setCurrentTimeSeconds((prev) => {
          const next = prev + deltaSec;
          if (next >= totalDurationSeconds) {
            return 0; // loop back to 0
          }
          return next;
        });
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed, totalDurationSeconds]);

  // Handlers
  const handleSelectCharacter = (char: CharacterItem) => {
    setSelectedCharacter(char);
    const availableActions = getActionsForCharacter(char, selectedAngle);
    const nextActionObj = availableActions[0];
    const nextAction = nextActionObj?.id || 'Idle';
    const jsonUrl = nextActionObj?.jsonUrl;

    if (jsonUrl) {
      fetchSpineAnimation(jsonUrl).then((track) => {
        setActiveSpineTrack({
          actionId: nextAction,
          label: nextActionObj?.label || nextAction,
          jsonUrl,
          boneCount: track.activeBoneCount,
          duration: track.duration
        });
      });
    }

    setSelectedAction(nextAction);
    setCharactersOnStage((prev) => {
      const exists = prev.find((inst) => inst.instanceId === selectedCharInstanceId);
      if (exists) {
        return prev.map((inst) =>
          inst.instanceId === selectedCharInstanceId
            ? { ...inst, characterId: char.id, name: char.name, action: nextAction, jsonUrl }
            : inst
        );
      } else {
        const newInstId = `char_inst_${Date.now()}`;
        setSelectedCharInstanceId(newInstId);
        return [
          ...prev,
          {
            instanceId: newInstId,
            characterId: char.id,
            name: char.name,
            x: 50,
            y: 55,
            scale: 1.0,
            flipH: false,
            angle: selectedAngle,
            action: nextAction,
            jsonUrl,
            speed: 1.0,
            isPlaying: true
          }
        ];
      }
    });
  };

  const handleSelectAngle = (angle: CharacterAngle) => {
    setSelectedAngle(angle);
    const availableActions = getActionsForCharacter(selectedCharacter, angle);
    const existingMatch = availableActions.find(
      (a) => a.id.toLowerCase() === selectedAction.toLowerCase()
    );
    const nextActionObj = existingMatch || availableActions[0];
    const nextAction = nextActionObj?.id || 'Idle';
    const jsonUrl = nextActionObj?.jsonUrl;

    if (jsonUrl) {
      fetchSpineAnimation(jsonUrl).then((track) => {
        setActiveSpineTrack({
          actionId: nextAction,
          label: nextActionObj?.label || nextAction,
          jsonUrl,
          boneCount: track.activeBoneCount,
          duration: track.duration
        });
      });
    }

    setSelectedAction(nextAction);
    setCharactersOnStage((prev) =>
      prev.map((inst) =>
        inst.instanceId === selectedCharInstanceId
          ? { ...inst, angle, action: nextAction, jsonUrl }
          : inst
      )
    );
  };

  const handleSelectAction = (action: CharacterActionType, explicitJsonUrl?: string) => {
    setSelectedAction(action);
    const availableActions = getActionsForCharacter(selectedCharacter, selectedAngle);
    const matched = availableActions.find((a) => a.id === action);
    const jsonUrl = explicitJsonUrl || matched?.jsonUrl || availableActions[0]?.jsonUrl;

    if (jsonUrl) {
      fetchSpineAnimation(jsonUrl).then((track) => {
        setActiveSpineTrack({
          actionId: action,
          label: matched?.label || action,
          jsonUrl,
          boneCount: track.activeBoneCount,
          duration: track.duration
        });
      });
    }

    setCharactersOnStage((prev) =>
      prev.map((inst) =>
        inst.instanceId === selectedCharInstanceId
          ? { ...inst, action, jsonUrl }
          : inst
      )
    );
  };

  const handleApplyTemplate = (template: SceneTemplate | null) => {
    setCurrentTemplate(template);
    setCustomBackgroundUrl(null);
    setBackgroundTrack(null);
    if (!template) {
      setCharactersOnStage([]);
      setSelectedCharInstanceId(null);
      setCanvasMediaLayers((prev) => prev.filter((m) => !m.isTemplateLayer));
      return;
    }

    // 1. Load Raw Multi-Layers (e.g. Kirana Shop Closed with trees, buildings, hut, bench)
    if (template.bgLayers && template.bgLayers.length > 0) {
      const templateMediaLayers: ActiveCanvasMediaLayer[] = template.bgLayers.map((b, idx) => ({
        instanceId: `layer_${b.id || idx}_${Date.now()}_${idx}`,
        mediaId: b.id,
        name: b.name.replace(/_/g, ' '),
        url: b.url,
        type: 'image',
        x: b.x,
        y: b.y,
        scale: b.scaleX || 1,
        scaleX: b.scaleX,
        scaleY: b.scaleY,
        flipH: Boolean(b.flipX),
        flipX: Boolean(b.flipX),
        rotation: b.rotation || 0,
        opacity: b.opacity ?? 1,
        zIndex: idx + 1,
        startTime: 0,
        duration: totalDurationSeconds || 15,
        isVisible: true,
        isLocked: true,
        isTemplateLayer: true
      }));
      setCanvasMediaLayers((prev) => [...prev.filter((m) => !m.isTemplateLayer), ...templateMediaLayers]);
    } else if (template.jsonUrl) {
      fetch(template.jsonUrl)
        .then((r) => r.json())
        .then((data) => {
          const sc0 = data.scenes?.[0];
          if (sc0 && sc0.bgLayers && sc0.bgLayers.length > 0) {
            const flatOrder = sc0.drawOrder ? sc0.drawOrder.flat() : [];
            const sortedBgs = sc0.bgLayers.slice().sort((a: any, b: any) => {
              const idxA = flatOrder.indexOf(a.id);
              const idxB = flatOrder.indexOf(b.id);
              return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
            });
            const dynamicLayers: ActiveCanvasMediaLayer[] = sortedBgs.map((b: any, idx: number) => {
              const node = b.timeline?.animations?.[0]?.nodes?.[0] || {};
              return {
                instanceId: `layer_${b.id || idx}_${Date.now()}_${idx}`,
                mediaId: b.id,
                name: (b.name || `Layer ${idx + 1}`).replace(/_/g, ' '),
                url: b.url,
                type: 'image',
                x: node.position?.x || 0,
                y: node.position?.y || 0,
                scale: node.scaleX !== undefined ? node.scaleX : 1,
                scaleX: node.scaleX !== undefined ? node.scaleX : 1,
                scaleY: node.scaleY !== undefined ? node.scaleY : 1,
                flipH: Boolean(node.flipX),
                flipX: Boolean(node.flipX),
                rotation: node.rotation || 0,
                opacity: node.opacity !== undefined ? node.opacity : 1,
                zIndex: idx + 1,
                startTime: 0,
                duration: totalDurationSeconds || 15,
                isVisible: true,
                isLocked: true,
                isTemplateLayer: true
              };
            });
            setCanvasMediaLayers((prev) => [...prev.filter((m) => !m.isTemplateLayer), ...dynamicLayers]);
          }
        })
        .catch(() => {});
    } else {
      setCanvasMediaLayers((prev) => prev.filter((m) => !m.isTemplateLayer));
    }

    // 2. If template has official sample characters, auto apply all of them on the canvas!
    if (template.sampleCharacters && template.sampleCharacters.length > 0) {
      const lockedSampleCharacters = template.sampleCharacters.map((c) => ({
        ...c,
        isLocked: true
      }));
      setCharactersOnStage(lockedSampleCharacters);
      const firstChar = lockedSampleCharacters[0];
      setSelectedCharInstanceId(firstChar.instanceId);
      const found = AUTODRAFT_CHARACTERS.find((c) => c.id === firstChar.characterId);
      if (found) {
        setSelectedCharacter(found);
        setSelectedAction(firstChar.action);
        setSelectedAngle(firstChar.angle);
      }
      return;
    }

    // 3. Fallback to template.layers
    if (template.layers) {
      const charLayer = template.layers.find((l) => l.type === 'character');
      if (charLayer && charLayer.characterConfig) {
        const found = AUTODRAFT_CHARACTERS.find((c) => c.id === charLayer.characterConfig?.characterId);
        if (found) {
          setSelectedCharacter(found);
          setSelectedAction(charLayer.characterConfig.action);
          setSelectedAngle(charLayer.characterConfig.angle);
          setCharactersOnStage([
            {
              instanceId: 'char_inst_1',
              characterId: found.id,
              name: found.name,
              x: charLayer.initialX || 370,
              y: charLayer.initialY || 200,
              scale: charLayer.scale || 1.1,
              flipH: false,
              angle: charLayer.characterConfig.angle,
              action: charLayer.characterConfig.action,
              speed: 1.0,
              isPlaying: true,
              isLocked: true
            }
          ]);
          setSelectedCharInstanceId('char_inst_1');
        }
      }
    }
  };

  const handleUpdateCharacterPosition = (instanceId: string, x: number, y: number) => {
    setCharactersOnStage((prev) =>
      prev.map((inst) => (inst.instanceId === instanceId ? { ...inst, x, y } : inst))
    );
  };

  const handleUpdateScale = (scale: number) => {
    setCharactersOnStage((prev) =>
      prev.map((inst) => (inst.instanceId === selectedCharInstanceId ? { ...inst, scale } : inst))
    );
  };

  const handleToggleFlip = () => {
    setCharactersOnStage((prev) =>
      prev.map((inst) => (inst.instanceId === selectedCharInstanceId ? { ...inst, flipH: !inst.flipH } : inst))
    );
  };

  const handleFlipCharacter = (instanceId: string) => {
    setCharactersOnStage((prev) =>
      prev.map((inst) => (inst.instanceId === instanceId ? { ...inst, flipH: !inst.flipH } : inst))
    );
  };

  const handleDeleteCharacter = (instanceId: string) => {
    setCharactersOnStage((prev) => prev.filter((inst) => inst.instanceId !== instanceId));
    if (selectedCharInstanceId === instanceId) {
      setSelectedCharInstanceId(null);
    }
  };

  const handleUpdateCharacterScale = (instanceId: string, scale: number) => {
    setCharactersOnStage((prev) =>
      prev.map((inst) => (inst.instanceId === instanceId ? { ...inst, scale } : inst))
    );
  };

  const handleUpdateCharacterRotation = (instanceId: string, rotation: number) => {
    setCharactersOnStage((prev) =>
      prev.map((inst) => (inst.instanceId === instanceId ? { ...inst, rotation } : inst))
    );
  };

  const handleUpdateCharacterSpeed = (instanceId: string, speed: number) => {
    setCharactersOnStage((prev) =>
      prev.map((inst) => (inst.instanceId === instanceId ? { ...inst, speed } : inst))
    );
  };

  const handleUpdateCharacterAdjust = (instanceId: string, filters: any) => {
    setCharactersOnStage((prev) =>
      prev.map((inst) => (inst.instanceId === instanceId ? { ...inst, filters } : inst))
    );
  };

  const handleUpdateCharacterMask = (instanceId: string, mask: any) => {
    setCharactersOnStage((prev) =>
      prev.map((inst) => (inst.instanceId === instanceId ? { ...inst, mask } : inst))
    );
  };

  const handleUpdateCharacterPath = (instanceId: string, motionPath: any) => {
    setCharactersOnStage((prev) =>
      prev.map((inst) => (inst.instanceId === instanceId ? { ...inst, motionPath } : inst))
    );
  };

  const handleSortCharacter = (instanceId: string, action: 'front' | 'back' | 'forward' | 'backward') => {
    setCharactersOnStage((prev) => {
      const idx = prev.findIndex((c) => c.instanceId === instanceId);
      if (idx === -1) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      if (action === 'front') copy.push(item);
      else if (action === 'back') copy.unshift(item);
      else if (action === 'forward') copy.splice(Math.min(copy.length, idx + 1), 0, item);
      else if (action === 'backward') copy.splice(Math.max(0, idx - 1), 0, item);
      return copy;
    });
  };

  const handleAttachProp = (slot: PropSlotKey, propId: string) => {
    if (!selectedCharInstanceId) return;
    setCharactersOnStage((prev) =>
      prev.map((c) =>
        c.instanceId === selectedCharInstanceId
          ? { ...c, props: { ...(c.props || {}), [slot]: propId } }
          : c
      )
    );
  };

  const handleRemoveProp = (slot: PropSlotKey) => {
    if (!selectedCharInstanceId) return;
    setCharactersOnStage((prev) =>
      prev.map((c) => {
        if (c.instanceId !== selectedCharInstanceId) return c;
        const nextProps = { ...(c.props || {}) };
        delete nextProps[slot];
        return { ...c, props: nextProps };
      })
    );
  };

  const handleAIAnimate = (prompt: string) => {
    const p = prompt.toLowerCase();
    let targetAct = 'Idle';
    if (p.includes('walk')) targetAct = 'Walk';
    else if (p.includes('run')) targetAct = 'Run';
    else if (p.includes('namaste') || p.includes('greet') || p.includes('salute')) targetAct = 'Greeting';
    else if (p.includes('knee')) targetAct = 'Sitting_On_Knees';
    else if (p.includes('sit')) targetAct = 'Sitting';
    else if (p.includes('dance')) targetAct = 'Idle Happy';
    else if (p.includes('angry')) targetAct = 'Angry';
    handleSelectAction(targetAct);
  };

  const handleAddMediaToStage = (media: MediaAssetItem) => {
    const newLayer: ActiveCanvasMediaLayer = {
      instanceId: `media_inst_${Date.now()}`,
      mediaId: media.id || `media_${Date.now()}`,
      name: media.name,
      url: media.url,
      type: media.type === 'video' ? 'video' : 'image',
      x: 50,
      y: 50,
      scale: 1,
      zIndex: 15,
      startTime: 0,
      duration: totalDurationSeconds
    };
    setCanvasMediaLayers((prev) => [...prev, newLayer]);
    setSelectedMediaInstanceId(newLayer.instanceId);
  };

  const handleSetStageBackground = (url: string, name?: string) => {
    setCustomBackgroundUrl(url);
    const bgDur = Math.max(15, totalDurationSeconds);
    setBackgroundTrack({
      id: `bg_${Date.now()}`,
      name: name || 'Background',
      url,
      startTime: 0,
      duration: bgDur,
      isVisible: true,
      isLocked: false
    });
  };

  const handleUpdateBackgroundTrack = (updates: Partial<BackgroundTimelineTrack>) => {
    setBackgroundTrack((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updates };
      if (updates.startTime !== undefined || updates.duration !== undefined) {
        setTotalDurationSeconds((t) => Math.max(t, Math.ceil(next.startTime + next.duration)));
      }
      return next;
    });
  };

  const handleDeleteBackgroundTrack = () => {
    setBackgroundTrack(null);
    setCustomBackgroundUrl(null);
  };

  const handleToggleTrackVisibility = (
    trackType: 'camera' | 'audio' | 'character' | 'media' | 'background',
    id: string
  ) => {
    if (trackType === 'camera') {
      setCameraTrack((prev) => prev ? { ...prev, isVisible: prev.isVisible === false ? true : false } : null);
    } else if (trackType === 'background') {
      setBackgroundTrack((prev) => prev ? { ...prev, isVisible: prev.isVisible === false ? true : false } : null);
    } else if (trackType === 'audio') {
      setAudioTracks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isMuted: !t.isMuted } : t))
      );
    } else if (trackType === 'character') {
      setCharactersOnStage((prev) =>
        prev.map((c) => (c.instanceId === id ? { ...c, isVisible: c.isVisible === false ? true : false } : c))
      );
    } else if (trackType === 'media') {
      setCanvasMediaLayers((prev) =>
        prev.map((m) => (m.instanceId === id ? { ...m, isVisible: m.isVisible === false ? true : false } : m))
      );
    }
  };

  const handleToggleTrackLock = (
    trackType: 'camera' | 'audio' | 'character' | 'media' | 'background',
    id: string
  ) => {
    if (trackType === 'camera') {
      setCameraTrack((prev) => prev ? { ...prev, isLocked: !prev.isLocked } : null);
    } else if (trackType === 'background') {
      setBackgroundTrack((prev) => prev ? { ...prev, isLocked: !prev.isLocked } : null);
    } else if (trackType === 'audio') {
      setAudioTracks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isLocked: !t.isLocked } : t))
      );
    } else if (trackType === 'character') {
      setCharactersOnStage((prev) =>
        prev.map((c) => (c.instanceId === id ? { ...c, isLocked: !c.isLocked } : c))
      );
    } else if (trackType === 'media') {
      setCanvasMediaLayers((prev) =>
        prev.map((m) => (m.instanceId === id ? { ...m, isLocked: !m.isLocked } : m))
      );
    }
  };

  const handleUpdateMediaPosition = (instanceId: string, x: number, y: number) => {
    setCanvasMediaLayers((prev) =>
      prev.map((m) => (m.instanceId === instanceId ? { ...m, x, y } : m))
    );
  };

  const handleUpdateMediaLayer = (instanceId: string, updates: Partial<ActiveCanvasMediaLayer>) => {
    setCanvasMediaLayers((prev) =>
      prev.map((m) => (m.instanceId === instanceId ? { ...m, ...updates } : m))
    );
    if (updates.startTime !== undefined || updates.duration !== undefined) {
      setTotalDurationSeconds((prev) => {
        const m = canvasMediaLayers.find((layer) => layer.instanceId === instanceId);
        if (!m) return prev;
        const start = updates.startTime !== undefined ? updates.startTime : (m.startTime || 0);
        const dur = updates.duration !== undefined ? updates.duration : (m.duration || 15);
        return Math.max(prev, Math.ceil(start + dur));
      });
    }
  };

  const handleDeleteMediaLayer = (instanceId: string) => {
    setCanvasMediaLayers((prev) => prev.filter((m) => m.instanceId !== instanceId));
    if (selectedMediaInstanceId === instanceId) {
      setSelectedMediaInstanceId(null);
    }
  };

  const activeStageChar = charactersOnStage.find((c) => c.instanceId === selectedCharInstanceId) || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0e1017] text-white overflow-hidden select-none font-sans">
      {/* ============================================================ */}
      {/* 1. TOP HEADER (MATCHING SCREENSHOTS 1, 2, 3, 4)              */}
      {/* ============================================================ */}
      <header className="h-12 bg-[#161822] border-b border-[#262b3a] px-4 flex items-center justify-between z-30">
        {/* Left: Back & Project Name */}
        <div className="flex items-center space-x-3">
          <button className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#222736]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-white tracking-wide">New Project</span>
            <Edit3 className="w-3.5 h-3.5 text-gray-400 hover:text-white cursor-pointer" />
          </div>
          <span className="text-[11px] text-gray-400 bg-[#222736] px-2 py-0.5 rounded border border-[#333a50]">
            ID: 19113159
          </span>
          <button className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded flex items-center space-x-1">
            <span>Report</span>
          </button>
          <span className="text-[11px] text-gray-400 bg-[#222736] px-1.5 py-0.5 rounded">
            IN
          </span>
        </div>

        {/* Center: Active Spine 2D Animation Track Network Badge */}
        {activeSpineTrack && (
          <div className="hidden md:flex items-center space-x-2 bg-[#1a2333] border border-blue-500/40 px-2.5 py-1 rounded-md text-[11px] text-blue-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-emerald-400 font-bold text-[10px]">200 OK</span>
            <span className="text-gray-500">•</span>
            {selectedCharacter.id === '811550' || selectedCharacter.name.toLowerCase().includes('pandit') ? (
              <span className="font-semibold text-emerald-300 flex items-center space-x-1">
                <span>Spine FK Kinematics:</span>
                <span className="text-white font-mono text-[10px]">
                  {selectedAction} (47 bones • Torso Y: 236px • Knees: 130°)
                </span>
              </span>
            ) : (
              <>
                <span className="font-semibold text-white truncate max-w-[170px]" title={activeSpineTrack.jsonUrl}>
                  {activeSpineTrack.jsonUrl.split('/').pop()}
                </span>
                <span className="text-blue-400/80 text-[10px]">
                  ({activeSpineTrack.boneCount} bones • {activeSpineTrack.duration}s)
                </span>
              </>
            )}
          </div>
        )}

        {/* Right: History, Save, Download, Settings, Credits */}
        <div className="flex items-center space-x-3 text-xs">
          <button className="flex items-center space-x-1 text-gray-400 hover:text-white">
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
          <button className="flex items-center space-x-1 text-gray-400 hover:text-white">
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-md"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Templates</span>
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center space-x-1.5 shadow-md shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          <button className="p-1.5 text-gray-400 hover:text-white">
            <Settings className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-1 bg-[#222736] px-2.5 py-1 rounded-lg border border-[#333a50] text-gray-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">20</span>
          </div>
          <button className="text-[11px] font-bold text-white bg-gradient-to-r from-amber-600 to-amber-500 px-3 py-1 rounded-lg shadow">
            Upgrade
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. MIDDLE BODY (LEFT ICON BAR + DRAWER + CANVAS + RIGHT BAR) */}
      {/* ============================================================ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Extreme Left Icon Bar (Screenshot 2 & 3) */}
        <div className="w-16 bg-[#12141c] border-r border-[#262b3a] flex flex-col items-center py-3 space-y-4 shrink-0">
          <button
            onClick={() => setActiveLeftTool('character')}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all ${
              activeLeftTool === 'character'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-[#1f2330]'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[9px] font-semibold">Character</span>
          </button>

          <button
            onClick={() => setActiveLeftTool('media')}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all ${
              activeLeftTool === 'media'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-[#1f2330]'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span className="text-[9px] font-semibold">Media</span>
          </button>

          <button
            onClick={() => setActiveLeftTool('audio')}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all ${
              activeLeftTool === 'audio' || activeLeftTool === 'ai_voice'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-gray-400 hover:text-white hover:bg-[#1f2330]'
            }`}
            title="Audio & Sound Effects"
          >
            <Music className="w-4 h-4" />
            <span className="text-[9px] font-semibold">Audio</span>
          </button>

          <button
            onClick={() => setActiveLeftTool('effects')}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all ${
              activeLeftTool === 'effects'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-gray-400 hover:text-white hover:bg-[#1f2330]'
            }`}
            title="Visual Effects & Transitions"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[9px] font-semibold">Effects</span>
          </button>

          <button
            onClick={() => {
              setActiveLeftTool('templates');
              setIsTemplateModalOpen(true);
            }}
            className="flex flex-col items-center space-y-1 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1f2330] transition-all"
          >
            <Layers className="w-4 h-4" />
            <span className="text-[9px] font-semibold">Templates</span>
          </button>

          <button
            onClick={() => setActiveLeftTool('image_gen')}
            className="flex flex-col items-center space-y-1 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1f2330] transition-all"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="text-[9px] font-semibold">AI Image</span>
          </button>

          <button
            onClick={() => setActiveLeftTool('audio')}
            className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all ${
              activeLeftTool === 'ai_voice'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-gray-400 hover:text-white hover:bg-[#1f2330]'
            }`}
            title="AI Voice & Narration"
          >
            <Mic className="w-4 h-4" />
            <span className="text-[9px] font-semibold">AI Voice</span>
          </button>

          <button
            onClick={() => setActiveLeftTool('text')}
            className="flex flex-col items-center space-y-1 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1f2330] transition-all"
          >
            <Type className="w-4 h-4" />
            <span className="text-[9px] font-semibold">Text</span>
          </button>
        </div>

        {/* Character & Action Selection Drawer (Screenshots 3 & 4) */}
        {activeLeftTool === 'character' && (
          <AutoDraftCharacterDrawer
            selectedCharacter={selectedCharacter}
            selectedAngle={selectedAngle}
            selectedAction={selectedAction}
            onSelectCharacter={handleSelectCharacter}
            onSelectAngle={handleSelectAngle}
            onSelectAction={handleSelectAction}
          />
        )}

        {/* Media Drawer (AutoDraft Local File Uploads & Stock Library) */}
        {activeLeftTool === 'media' && (
          <AutoDraftMediaDrawer
            onClose={() => setActiveLeftTool('character')}
            onAddMediaToStage={handleAddMediaToStage}
            onSetAsBackground={handleSetStageBackground}
          />
        )}

        {/* Audio Drawer (Stock Music, SFX & Uploads) */}
        {(activeLeftTool === 'audio' || activeLeftTool === 'ai_voice') && (
          <AutoDraftAudioDrawer
            onClose={() => setActiveLeftTool('character')}
            activeAudioTracks={audioTracks}
            onAddAudioTrack={handleAddAudioTrack}
            onDeleteAudioTrack={handleDeleteAudioTrack}
            onUpdateAudioTrack={handleUpdateAudioTrack}
          />
        )}

        {/* Visual Overlay Effects Drawer (AutoDraft 301 Effects, Filters, Transitions) */}
        {activeLeftTool === 'effects' && (
          <AutoDraftEffectsDrawer
            onClose={() => setActiveLeftTool('character')}
            activeEffects={activeEffects}
            onAddEffect={handleAddEffect}
            onRemoveEffect={handleRemoveEffect}
            onUpdateEffectOpacity={handleUpdateEffectOpacity}
          />
        )}

        {/* Dedicated Props Drawer (Screenshots 1 & 2) */}
        {activeLeftTool === 'props' && activeStageChar && (
          <AutoDraftPropsDrawer
            selectedCharacter={activeStageChar}
            onClose={() => setActiveLeftTool('character')}
            onAttachProp={handleAttachProp}
            onRemoveProp={handleRemoveProp}
          />
        )}

        {/* Center 16:9 Canvas Stage (Screenshot 2) */}
        <AutoDraftCanvasStage
          currentTemplate={currentTemplate}
          characters={charactersOnStage}
          selectedCharInstanceId={selectedCharInstanceId}
          isPlaying={isPlaying}
          currentTimeSeconds={currentTimeSeconds}
          customBackgroundUrl={customBackgroundUrl}
          backgroundTrack={backgroundTrack}
          canvasMediaLayers={canvasMediaLayers}
          selectedMediaInstanceId={selectedMediaInstanceId}
          onSelectMediaInstance={setSelectedMediaInstanceId}
          onUpdateMediaPosition={handleUpdateMediaPosition}
          onUpdateMediaLayer={handleUpdateMediaLayer}
          onDeleteMediaLayer={handleDeleteMediaLayer}
          onSelectCharacterInstance={(id) => {
            setSelectedCharInstanceId(id);
            if (id) {
              const charInst = charactersOnStage.find((c) => c.instanceId === id);
              if (charInst) {
                const found = AUTODRAFT_CHARACTERS.find((c) => c.id === charInst.characterId);
                if (found) {
                  setSelectedCharacter(found);
                  setSelectedAction(charInst.action);
                  setSelectedAngle(charInst.angle);
                }
              }
            }
          }}
          onUpdateCharacterPosition={handleUpdateCharacterPosition}
          onFlipCharacter={handleFlipCharacter}
          onDeleteCharacter={handleDeleteCharacter}
          onUpdateCharacterScale={handleUpdateCharacterScale}
          onUpdateCharacterRotation={handleUpdateCharacterRotation}
          onUpdateCharacterSpeed={handleUpdateCharacterSpeed}
          onUpdateCharacterAdjust={handleUpdateCharacterAdjust}
          onUpdateCharacterMask={handleUpdateCharacterMask}
          onUpdateCharacterPath={handleUpdateCharacterPath}
          onSortCharacter={handleSortCharacter}
          onOpenProps={() => setActiveLeftTool('props')}
          onAIAnimate={handleAIAnimate}
          activeEffects={activeEffects}
        />

        {/* AutoDraft Extreme Right Panel (Properties, Background Music, Sound Effects) */}
        <AutoDraftRightPanel
          selectedCharacter={activeStageChar}
          onUpdateScale={handleUpdateScale}
          onToggleFlip={handleToggleFlip}
          activeAudioTracks={audioTracks}
          onAddAudioTrack={handleAddAudioTrack}
          onDeleteAudioTrack={handleDeleteAudioTrack}
          selectedAudioTrack={selectedAudioTrack}
          onUpdateAudioTrack={handleUpdateAudioTrack}
          onSplitAudioTrack={(id) => handleSplitAudioTrack(id, currentTimeSeconds)}
          stageCharacters={charactersOnStage}
        />
      </div>

      {/* ============================================================ */}
      {/* 3. BOTTOM TIMELINE & TRANSPORT (SCREENSHOT 2)                */}
      {/* ============================================================ */}
      <AutoDraftTimeline
        currentTemplate={currentTemplate}
        characters={charactersOnStage}
        selectedCharInstanceId={selectedCharInstanceId}
        onSelectCharacterInstance={(id) => {
          setSelectedCharInstanceId(id);
          if (id) {
            const charInst = charactersOnStage.find((c) => c.instanceId === id);
            if (charInst) {
              const found = AUTODRAFT_CHARACTERS.find((c) => c.id === charInst.characterId);
              if (found) {
                setSelectedCharacter(found);
                setSelectedAction(charInst.action);
                setSelectedAngle(charInst.angle);
              }
            }
          }
        }}
        onUpdateCharacterTimeline={handleUpdateCharacterTimeline}
        onDeleteCharacter={handleDeleteCharacter}
        mediaLayers={canvasMediaLayers}
        selectedMediaInstanceId={selectedMediaInstanceId}
        onSelectMediaLayer={setSelectedMediaInstanceId}
        onUpdateMediaLayer={handleUpdateMediaLayer}
        onDeleteMediaLayer={handleDeleteMediaLayer}
        backgroundTrack={backgroundTrack}
        onUpdateBackgroundTrack={handleUpdateBackgroundTrack}
        onDeleteBackgroundTrack={handleDeleteBackgroundTrack}
        cameraTrack={cameraTrack}
        onAddCameraTrack={handleAddCameraTrack}
        onUpdateCameraTrack={handleUpdateCameraTrack}
        onDeleteCameraTrack={handleDeleteCameraTrack}
        audioTracks={audioTracks}
        isPlaying={isPlaying}
        currentTimeSeconds={currentTimeSeconds}
        totalDurationSeconds={totalDurationSeconds}
        playbackSpeed={playbackSpeed}
        onUpdatePlaybackSpeed={setPlaybackSpeed}
        onUpdateTotalDuration={(newDur) => setTotalDurationSeconds(Math.max(5, Math.min(3600, newDur)))}
        onTogglePlay={handleTogglePlay}
        onReset={handleResetPlayback}
        onSeek={handleSeek}
        onRewind5s={handleRewind5s}
        onForward5s={handleForward5s}
        onJumpToStart={handleJumpToStart}
        onJumpToEnd={handleJumpToEnd}
        onUpdateAudioTrack={handleUpdateAudioTrack}
        onDeleteAudioTrack={handleDeleteAudioTrack}
        onOpenAudioDrawer={() => setActiveLeftTool('audio')}
        onSplitAudioTrack={handleSplitAudioTrack}
        onToggleTrackVisibility={handleToggleTrackVisibility}
        onToggleTrackLock={handleToggleTrackLock}
        selectedAudioTrackId={selectedAudioTrackId}
        onSelectAudioTrack={setSelectedAudioTrackId}
        scenes={scenes}
        activeSceneId={activeSceneId}
        onSelectScene={handleSelectScene}
        onAddScene={handleAddScene}
        onReorderScenes={handleReorderScenes}
        onDeleteScene={handleDeleteScene}
        onDuplicateScene={handleDuplicateScene}
        onRenameScene={handleRenameScene}
      />

      {/* ============================================================ */}
      {/* 4. TEMPLATE CHOOSER MODAL (SCREENSHOT 1)                     */}
      {/* ============================================================ */}
      <AutoDraftTemplateModal
        isOpen={isTemplateModalOpen}
        selectedTemplateId={currentTemplate?.id || 'village_walk'}
        onClose={() => setIsTemplateModalOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* ============================================================ */}
      {/* 5. 1080p FULL VIDEO EXPORT MODAL                             */}
      {/* ============================================================ */}
      <AutoDraftExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setIsPlaying(false);
          setCurrentTimeSeconds(0);
        }}
        audioTracks={audioTracks}
        totalDurationSeconds={totalDurationSeconds}
        scenes={scenes}
        activeSceneId={activeSceneId}
        onSelectScene={handleSelectScene}
        onStartExport={() => {
          setSelectedCharInstanceId(null);
          setSelectedMediaInstanceId(null);
          setCurrentTimeSeconds(0);
          setIsPlaying(true);
        }}
        onExportSeek={(sec) => {
          setCurrentTimeSeconds(sec);
        }}
        onEndExport={() => {
          setIsPlaying(false);
          setCurrentTimeSeconds(0);
        }}
      />
    </div>
  );
};
