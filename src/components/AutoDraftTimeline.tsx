import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Eye, 
  EyeOff,
  Lock, 
  Unlock,
  X, 
  Plus, 
  Scissors, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Music, 
  MoreVertical, 
  FastForward, 
  Radio, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Sliders, 
  Image as ImageIcon,
  Sparkles,
  Camera as CameraIcon,
  Video,
  Copy,
  Layers,
  ChevronLeft,
  ChevronRight,
  Hand,
  RotateCw,
  Undo2,
  Redo2,
  Minus
} from 'lucide-react';
import { 
  SceneTemplate, 
  ActiveCanvasCharacter, 
  ActiveCanvasMediaLayer, 
  CameraTimelineTrack,
  BackgroundTimelineTrack,
  StudioScene
} from '../types/autodraft';
import { ActiveAudioTrack } from '../types/audio';

export interface AutoDraftTimelineProps {
  currentTemplate: SceneTemplate | null;
  characters: ActiveCanvasCharacter[];
  selectedCharInstanceId?: string | null;
  onSelectCharacterInstance?: (instanceId: string) => void;
  onUpdateCharacterTimeline?: (instanceId: string, updates: Partial<ActiveCanvasCharacter>) => void;
  onDeleteCharacter?: (instanceId: string) => void;
  mediaLayers?: ActiveCanvasMediaLayer[];
  selectedMediaInstanceId?: string | null;
  onSelectMediaLayer?: (instanceId: string | null) => void;
  onUpdateMediaLayer?: (instanceId: string, updates: Partial<ActiveCanvasMediaLayer>) => void;
  onDeleteMediaLayer?: (instanceId: string) => void;
  backgroundTrack?: BackgroundTimelineTrack | null;
  onUpdateBackgroundTrack?: (updates: Partial<BackgroundTimelineTrack>) => void;
  onDeleteBackgroundTrack?: () => void;
  cameraTrack?: CameraTimelineTrack | null;
  onAddCameraTrack?: () => void;
  onUpdateCameraTrack?: (updates: Partial<CameraTimelineTrack>) => void;
  onDeleteCameraTrack?: () => void;
  audioTracks?: ActiveAudioTrack[];
  isPlaying: boolean;
  currentTimeSeconds: number;
  totalDurationSeconds: number;
  onUpdateTotalDuration?: (newDuration: number) => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onSeek: (seconds: number) => void;
  onRewind5s?: () => void;
  onForward5s?: () => void;
  onJumpToStart?: () => void;
  onJumpToEnd?: () => void;
  onUpdateAudioTrack?: (trackId: string, updates: Partial<ActiveAudioTrack>) => void;
  onDeleteAudioTrack?: (trackId: string) => void;
  onOpenAudioDrawer?: () => void;
  onSplitAudioTrack?: (trackId: string, splitTime: number) => void;
  onToggleTrackVisibility?: (trackType: 'camera' | 'audio' | 'character' | 'media' | 'background', id: string) => void;
  onToggleTrackLock?: (trackType: 'camera' | 'audio' | 'character' | 'media' | 'background', id: string) => void;
  selectedAudioTrackId?: string | null;
  onSelectAudioTrack?: (trackId: string | null) => void;
  scenes?: StudioScene[];
  activeSceneId?: string;
  onSelectScene?: (sceneId: string) => void;
  onAddScene?: () => void;
  onReorderScenes?: (fromIndex: number, toIndex: number) => void;
  onDeleteScene?: (sceneId: string) => void;
  onDuplicateScene?: (sceneId: string) => void;
  onRenameScene?: (sceneId: string, newName: string) => void;
}

interface DragState {
  mode: 'trim-left' | 'trim-right' | 'move';
  trackType: 'camera' | 'audio' | 'character' | 'media' | 'background';
  id: string;
  startX: number;
  initialStartTime: number;
  initialDuration: number;
}

export const AutoDraftTimeline: React.FC<AutoDraftTimelineProps> = ({
  currentTemplate,
  characters,
  selectedCharInstanceId,
  onSelectCharacterInstance,
  onUpdateCharacterTimeline,
  onDeleteCharacter,
  mediaLayers = [],
  selectedMediaInstanceId,
  onSelectMediaLayer,
  onUpdateMediaLayer,
  onDeleteMediaLayer,
  backgroundTrack,
  onUpdateBackgroundTrack,
  onDeleteBackgroundTrack,
  cameraTrack,
  onAddCameraTrack,
  onUpdateCameraTrack,
  onDeleteCameraTrack,
  audioTracks = [],
  isPlaying,
  currentTimeSeconds,
  totalDurationSeconds = 15,
  onUpdateTotalDuration,
  onTogglePlay,
  onReset,
  onSeek,
  onRewind5s,
  onForward5s,
  onJumpToStart,
  onJumpToEnd,
  onUpdateAudioTrack,
  onDeleteAudioTrack,
  onOpenAudioDrawer,
  onSplitAudioTrack,
  onToggleTrackVisibility,
  onToggleTrackLock,
  selectedAudioTrackId,
  onSelectAudioTrack,
  scenes = [],
  activeSceneId,
  onSelectScene,
  onAddScene,
  onReorderScenes,
  onDeleteScene,
  onDuplicateScene,
  onRenameScene
}) => {
  // Selected unified clip: type + id
  const [selectedClip, setSelectedClip] = useState<{
    type: 'camera' | 'audio' | 'character' | 'media' | 'background';
    id: string;
  } | null>(selectedAudioTrackId ? { type: 'audio', id: selectedAudioTrackId } : null);

  // Sync external audio selection
  useEffect(() => {
    if (selectedAudioTrackId) {
      setSelectedClip({ type: 'audio', id: selectedAudioTrackId });
    }
  }, [selectedAudioTrackId]);

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMultiSelect, setIsMultiSelect] = useState<boolean>(false);

  // Zoom level state (0.5x to 3.0x)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Scene tab management states
  const [activeMenuSceneId, setActiveMenuSceneId] = useState<string | null>(null);
  const [draggedSceneIndex, setDraggedSceneIndex] = useState<number | null>(null);
  const [dragOverSceneIndex, setDragOverSceneIndex] = useState<number | null>(null);

  // Close scene dropdown on window click
  useEffect(() => {
    const handleWinClick = () => setActiveMenuSceneId(null);
    window.addEventListener('click', handleWinClick);
    return () => window.removeEventListener('click', handleWinClick);
  }, []);

  // Pixel scaling: 50px per second base, scaled by zoom
  const BASE_PX_PER_SEC = 50;
  const pxPerSec = Math.max(20, Math.round(BASE_PX_PER_SEC * zoomLevel));
  const totalTrackWidth = Math.max(800, Math.ceil(totalDurationSeconds * pxPerSec));

  // Dragging / Trimming state
  const rulerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Sync external selection (from stage clicks)
  useEffect(() => {
    if (selectedCharInstanceId) {
      setSelectedClip({ type: 'character', id: selectedCharInstanceId });
    } else if (selectedMediaInstanceId) {
      setSelectedClip({ type: 'media', id: selectedMediaInstanceId });
    }
  }, [selectedCharInstanceId, selectedMediaInstanceId]);

  // Check if clip is locked
  const isClipLocked = (type: string, id: string): boolean => {
    if (type === 'background') return Boolean(backgroundTrack?.isLocked);
    if (type === 'camera') return Boolean(cameraTrack?.isLocked);
    if (type === 'audio') return Boolean(audioTracks.find((t) => t.id === id)?.isLocked);
    if (type === 'character') return Boolean(characters.find((c) => c.instanceId === id)?.isLocked);
    if (type === 'media') return Boolean(mediaLayers.find((m) => m.instanceId === id)?.isLocked);
    return false;
  };

  // Split selected audio clip at playhead
  const handleSplitAtPlayhead = () => {
    if (!selectedClip || selectedClip.type !== 'audio') return;
    const targetClip = audioTracks.find((t) => t.id === selectedClip.id);
    if (!targetClip) return;
    const start = targetClip.startTime || 0;
    const dur = targetClip.duration || 15;
    if (currentTimeSeconds > start + 0.1 && currentTimeSeconds < start + dur - 0.1) {
      onSplitAudioTrack?.(targetClip.id, currentTimeSeconds);
    }
  };

  // Keyboard shortcut listener (Space = Play/Pause, S = Split, Delete = Remove)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        handleSplitAtPlayhead();
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (!selectedClip) return;
        e.preventDefault();
        if (selectedClip.type === 'audio') {
          onDeleteAudioTrack?.(selectedClip.id);
        } else if (selectedClip.type === 'media') {
          onDeleteMediaLayer?.(selectedClip.id);
          onSelectMediaLayer?.(null);
        } else if (selectedClip.type === 'character') {
          onDeleteCharacter?.(selectedClip.id);
        } else if (selectedClip.type === 'camera') {
          onDeleteCameraTrack?.();
        } else if (selectedClip.type === 'background') {
          onDeleteBackgroundTrack?.();
        }
        setSelectedClip(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClip, currentTimeSeconds, audioTracks]);

  // Global mousemove and mouseup handler for Trimming & Moving clips
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaSec = (e.clientX - dragState.startX) / pxPerSec;

      if (dragState.mode === 'trim-right') {
        const newDur = Math.max(0.5, Math.round((dragState.initialDuration + deltaSec) * 10) / 10);
        if (dragState.trackType === 'audio') {
          onUpdateAudioTrack?.(dragState.id, { duration: newDur });
        } else if (dragState.trackType === 'media') {
          onUpdateMediaLayer?.(dragState.id, { duration: newDur });
        } else if (dragState.trackType === 'character') {
          onUpdateCharacterTimeline?.(dragState.id, { duration: newDur });
        } else if (dragState.trackType === 'camera') {
          onUpdateCameraTrack?.({ duration: newDur });
        } else if (dragState.trackType === 'background') {
          onUpdateBackgroundTrack?.({ duration: newDur });
        }
        // Auto-expand timeline timeframe if dragged beyond current total duration
        if (dragState.initialStartTime + newDur > totalDurationSeconds) {
          onUpdateTotalDuration?.(Math.ceil(dragState.initialStartTime + newDur));
        }
      } else if (dragState.mode === 'trim-left') {
        const maxStart = dragState.initialStartTime + dragState.initialDuration - 0.5;
        const newStart = Math.max(0, Math.min(maxStart, Math.round((dragState.initialStartTime + deltaSec) * 10) / 10));
        const newDur = Math.max(0.5, Math.round((dragState.initialDuration - (newStart - dragState.initialStartTime)) * 10) / 10);
        if (dragState.trackType === 'audio') {
          onUpdateAudioTrack?.(dragState.id, { startTime: newStart, duration: newDur });
        } else if (dragState.trackType === 'media') {
          onUpdateMediaLayer?.(dragState.id, { startTime: newStart, duration: newDur });
        } else if (dragState.trackType === 'character') {
          onUpdateCharacterTimeline?.(dragState.id, { startTime: newStart, duration: newDur });
        } else if (dragState.trackType === 'camera') {
          onUpdateCameraTrack?.({ startTime: newStart, duration: newDur });
        } else if (dragState.trackType === 'background') {
          onUpdateBackgroundTrack?.({ startTime: newStart, duration: newDur });
        }
      } else if (dragState.mode === 'move') {
        const newStart = Math.max(0, Math.round((dragState.initialStartTime + deltaSec) * 10) / 10);
        if (dragState.trackType === 'audio') {
          onUpdateAudioTrack?.(dragState.id, { startTime: newStart });
        } else if (dragState.trackType === 'media') {
          onUpdateMediaLayer?.(dragState.id, { startTime: newStart });
        } else if (dragState.trackType === 'character') {
          onUpdateCharacterTimeline?.(dragState.id, { startTime: newStart });
        } else if (dragState.trackType === 'camera') {
          onUpdateCameraTrack?.({ startTime: newStart });
        } else if (dragState.trackType === 'background') {
          onUpdateBackgroundTrack?.({ startTime: newStart });
        }
        // Auto-expand timeline timeframe if moved beyond current total duration
        if (newStart + dragState.initialDuration > totalDurationSeconds) {
          onUpdateTotalDuration?.(Math.ceil(newStart + dragState.initialDuration));
        }
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, totalDurationSeconds, pxPerSec]);

  // Format mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Determine active selection details
  const activeAudio = selectedClip?.type === 'audio' ? audioTracks.find((t) => t.id === selectedClip.id) : null;

  // Cycle speed multiplier
  const handleCycleSpeed = () => {
    const speeds = [0.5, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  // Ruler Mouse Down & Scrubbing
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = rulerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left;
    const sec = Math.max(0, Math.min(totalDurationSeconds, clickX / pxPerSec));
    onSeek(Math.round(sec * 10) / 10);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!rulerRef.current) return;
      const r = rulerRef.current.getBoundingClientRect();
      const x = moveEvent.clientX - r.left;
      const s = Math.max(0, Math.min(totalDurationSeconds, x / pxPerSec));
      onSeek(Math.round(s * 10) / 10);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const hasAnyTracks = Boolean(
    cameraTrack ||
    backgroundTrack ||
    audioTracks.length > 0 ||
    characters.length > 0 ||
    mediaLayers.length > 0
  );

  return (
    <div className="h-80 bg-[#161820] border-t border-[#262a38] flex flex-col select-none text-white z-10 font-sans">
      {/* ============================================================ */}
      {/* 1. TOP TRANSPORT & QUICK EDIT TOOLBAR (EXACT MATCH SCREENSHOT)*/}
      {/* ============================================================ */}
      <div className="h-9 border-b border-[#262a38] px-3 flex items-center justify-between bg-[#191c24] text-xs shrink-0">
        {/* Left Tools (Multi Select, Duplicate, Split, Camera, Copy) */}
        <div className="flex items-center space-x-3 text-gray-300">
          <button
            onClick={() => setIsMultiSelect((v) => !v)}
            className={`flex items-center space-x-1 px-1.5 py-0.5 rounded transition-colors ${
              isMultiSelect ? 'text-blue-400 bg-blue-950/60 font-bold' : 'hover:text-white'
            }`}
            title="Multi-select mode"
          >
            <span className="text-[11px] font-medium flex items-center gap-1">
              <span className="w-3 h-3 rounded border border-gray-400 inline-flex items-center justify-center text-[9px]">
                {isMultiSelect ? '✓' : ''}
              </span>
              Multi Select
            </span>
          </button>

          <button className="flex items-center space-x-1 hover:text-white transition-colors" title="Layer Duplicate">
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[11px]">Layer Duplicate</span>
          </button>

          <button className="flex items-center space-x-1 hover:text-white transition-colors" title="Duplicate">
            <Copy className="w-3.5 h-3.5" />
            <span className="text-[11px]">Duplicate</span>
          </button>

          <button
            onClick={handleSplitAtPlayhead}
            disabled={!activeAudio}
            className={`flex items-center space-x-1 transition-colors ${
              activeAudio ? 'text-amber-300 hover:text-amber-200' : 'text-gray-500 opacity-60 cursor-not-allowed'
            }`}
            title="Split selected audio clip at playhead (S)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="text-[11px]">Split</span>
          </button>

          <button
            onClick={() => {
              if (cameraTrack) {
                setSelectedClip({ type: 'camera', id: cameraTrack.id });
              } else {
                onAddCameraTrack?.();
              }
            }}
            className={`flex items-center space-x-1 transition-colors ${
              cameraTrack ? 'text-amber-400 hover:text-amber-300' : 'hover:text-white text-gray-400'
            }`}
            title={cameraTrack ? "Camera Viewport Track" : "Add Camera Track"}
          >
            <CameraIcon className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px]">{cameraTrack ? "Camera" : "+ Camera"}</span>
          </button>

          <button className="flex items-center space-x-1 hover:text-white transition-colors" title="Copy">
            <span className="text-[11px]">Copy</span>
          </button>
        </div>

        {/* Center Transport Controls (|◀, ↺5, ▶, ↻5, ▶|, 00:06, 1x>>) */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onJumpToStart}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Jump to Start"
          >
            <span className="text-[12px] font-bold font-mono">|◀</span>
          </button>

          <button
            onClick={onRewind5s}
            className="p-1 text-gray-400 hover:text-white transition-colors flex items-center space-x-0.5"
            title="Rewind 5s"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold">5</span>
          </button>

          <button
            onClick={onTogglePlay}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-95 ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20'
                : 'bg-white hover:bg-gray-200 text-black shadow-md shadow-white/10'
            }`}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={onForward5s}
            className="p-1 text-gray-400 hover:text-white transition-colors flex items-center space-x-0.5"
            title="Forward 5s"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold">5</span>
          </button>

          <button
            onClick={onJumpToEnd}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Jump to End"
          >
            <span className="text-[12px] font-bold font-mono">▶|</span>
          </button>

          {/* Time Display */}
          <div className="bg-[#12141c] border border-[#2a2f40] px-2 py-0.5 rounded text-[11px] font-mono text-gray-200">
            <span>{formatTime(currentTimeSeconds)}</span>
            <span className="text-gray-500"> / {formatTime(totalDurationSeconds)}</span>
          </div>

          {/* Speed Multiplier */}
          <button
            onClick={handleCycleSpeed}
            className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-[#12141c] border border-[#2a2f40] hover:border-gray-500 text-[10px] font-mono text-gray-300"
            title="Playback Speed"
          >
            <span>{playbackSpeed}x</span>
            <FastForward className="w-2.5 h-2.5 text-gray-400" />
          </button>
        </div>

        {/* Right Tools (Zoom Slider, +, -, Fullscreen) */}
        <div className="flex items-center space-x-2 text-gray-400">
          <button className="p-1 hover:text-white" title="Pan Hand Tool">
            <Hand className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1.5 px-1 bg-[#12141c] rounded border border-[#232838]">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.4, Number((z - 0.2).toFixed(1))))}
              className="p-0.5 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-14 h-1 accent-blue-500 bg-gray-700 rounded cursor-pointer"
              title={`Zoom: ${zoomLevel.toFixed(1)}x (${pxPerSec}px/sec)`}
            />
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, Number((z + 0.2).toFixed(1))))}
              className="p-0.5 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Adjust Total Duration */}
          <button
            onClick={() => onUpdateTotalDuration?.(Math.max(5, totalDurationSeconds - 5))}
            className="p-0.5 hover:text-white"
            title="Decrease 5s"
          >
            <Minus className="w-3 h-3" />
          </button>

          <button
            onClick={() => onUpdateTotalDuration?.(totalDurationSeconds + 5)}
            className="p-0.5 hover:text-white"
            title="Increase 5s"
          >
            <Plus className="w-3 h-3" />
          </button>

          <button className="p-1 hover:text-white" title="Fullscreen">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. SCENE TABS HEADER (DYNAMIC, DRAGGABLE & REORDERABLE)      */}
      {/* ============================================================ */}
      <div className="h-7 border-b border-[#262a38] px-3 flex items-center justify-between bg-[#13151b] text-xs shrink-0">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button className="text-gray-500 hover:text-gray-300 px-1">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Dynamic Scene Tabs */}
          {(scenes.length > 0 ? scenes : [{ id: 'scene_default', name: 'Scene 1' }]).map((scene, idx) => {
            const isActive = activeSceneId ? scene.id === activeSceneId : idx === 0;
            const isMenuOpen = activeMenuSceneId === scene.id;
            const isDragging = draggedSceneIndex === idx;
            const isDragOver = dragOverSceneIndex === idx;

            return (
              <div
                key={scene.id}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', String(idx));
                  setDraggedSceneIndex(idx);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverSceneIndex !== idx) {
                    setDragOverSceneIndex(idx);
                  }
                }}
                onDragLeave={() => {
                  setDragOverSceneIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                  if (!isNaN(fromIdx) && fromIdx !== idx) {
                    onReorderScenes?.(fromIdx, idx);
                  }
                  setDraggedSceneIndex(null);
                  setDragOverSceneIndex(null);
                }}
                onClick={() => onSelectScene?.(scene.id)}
                className={`relative flex items-center space-x-1.5 px-3 py-0.5 rounded-t font-semibold text-xs transition-all cursor-pointer select-none group ${
                  isActive
                    ? 'bg-white text-black shadow-sm'
                    : 'bg-[#181a24] text-gray-400 hover:text-white hover:bg-[#202330]'
                } ${isDragging ? 'opacity-40 scale-95' : ''} ${
                  isDragOver ? 'border-l-2 border-indigo-500 pl-2' : ''
                }`}
                title="Click to switch scene • Drag to reorder"
              >
                <span className="truncate max-w-[90px]">{scene.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuSceneId(isMenuOpen ? null : scene.id);
                  }}
                  className="p-0.5 hover:bg-gray-400/20 rounded transition-colors"
                  title="Scene Options"
                >
                  <MoreVertical className={`w-3 h-3 ${isActive ? 'text-gray-700' : 'text-gray-400'}`} />
                </button>

                {/* Three Dots Context Dropdown Menu */}
                {isMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 mt-1 w-36 bg-[#161822] border border-[#2d3345] rounded-lg shadow-2xl py-1 z-50 text-xs text-gray-200 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <button
                      onClick={() => {
                        onDuplicateScene?.(scene.id);
                        setActiveMenuSceneId(null);
                      }}
                      className="w-full px-2.5 py-1.5 text-left hover:bg-indigo-600 hover:text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Duplicate</span>
                    </button>
                    <button
                      onClick={() => {
                        const newName = prompt('Enter new scene name:', scene.name);
                        if (newName && newName.trim()) {
                          onRenameScene?.(scene.id, newName.trim());
                        }
                        setActiveMenuSceneId(null);
                      }}
                      className="w-full px-2.5 py-1.5 text-left hover:bg-indigo-600 hover:text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Rename</span>
                    </button>
                    {scenes.length > 1 && (
                      <button
                        onClick={() => {
                          onDeleteScene?.(scene.id);
                          setActiveMenuSceneId(null);
                        }}
                        className="w-full px-2.5 py-1.5 text-left hover:bg-red-600 hover:text-white text-red-400 flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add New Scene Button */}
          <button
            onClick={() => onAddScene?.()}
            className="flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs text-gray-400 hover:text-white hover:bg-[#202330] transition-colors cursor-pointer shrink-0"
            title="Create New Animation Scene"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>New Scene</span>
          </button>

          <button className="text-gray-500 hover:text-gray-300 px-1">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center space-x-3 text-gray-500 text-[11px]">
          {selectedClip && (
            <span className="text-indigo-300 font-mono">
              Selected: <b>{selectedClip.type.toUpperCase()}</b> ({selectedClip.id})
            </span>
          )}
          <Lock className="w-3 h-3" />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MULTI-TRACK TIMELINE GRID & TRACKS (PIXEL-ACCURATE SCROLL) */}
      {/* ============================================================ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Track Column (Track Names, 👁, 🔒, ✕) */}
        <div className="w-36 border-r border-[#262a38] bg-[#14161f] flex flex-col overflow-y-auto shrink-0 select-none">
          {/* Header */}
          <div className="h-6 border-b border-[#262a38] px-2 flex items-center justify-between text-[10px] font-mono text-gray-500 italic">
            <span>Tracks</span>
            <span className="text-[9px] text-gray-600 font-sans">{pxPerSec}px/s</span>
          </div>

          {/* Empty Tracks Hint */}
          {!hasAnyTracks && (
            <div className="p-3 text-[11px] text-gray-500 italic text-center">
              No tracks added yet. Add characters, media, background or audio to timeline.
            </div>
          )}

          {/* 1. Camera Track Header (Only if camera track exists) */}
          {cameraTrack && (
            <div
              onClick={() => setSelectedClip({ type: 'camera', id: cameraTrack.id })}
              className={`h-8 border-b border-[#222530] px-2 flex items-center justify-between text-[11px] cursor-pointer transition-colors ${
                selectedClip?.type === 'camera' ? 'bg-[#853e1a]/40 text-amber-200' : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-1 truncate max-w-[70px]">
                <span className="text-gray-500 text-[10px]">⋮⋮</span>
                <span className="truncate font-semibold">{cameraTrack.name || 'Camera'}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-500" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onToggleTrackVisibility?.('camera', cameraTrack.id)}
                  className="hover:text-white"
                  title={cameraTrack.isVisible === false ? "Show" : "Hide"}
                >
                  {cameraTrack.isVisible === false ? <EyeOff className="w-2.5 h-2.5 text-gray-600" /> : <Eye className="w-2.5 h-2.5" />}
                </button>
                <button
                  onClick={() => onToggleTrackLock?.('camera', cameraTrack.id)}
                  className="hover:text-white"
                  title={cameraTrack.isLocked ? "Unlock" : "Lock"}
                >
                  {cameraTrack.isLocked ? <Lock className="w-2.5 h-2.5 text-amber-400" /> : <Unlock className="w-2.5 h-2.5" />}
                </button>
                <button
                  onClick={() => {
                    onDeleteCameraTrack?.();
                    if (selectedClip?.type === 'camera') setSelectedClip(null);
                  }}
                  className="hover:text-red-400"
                  title="Delete Camera Track"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          )}

          {/* 2. Background Track Header (Only if background track exists) */}
          {backgroundTrack && (
            <div
              onClick={() => setSelectedClip({ type: 'background', id: backgroundTrack.id })}
              className={`h-8 border-b border-[#222530] px-2 flex items-center justify-between text-[11px] cursor-pointer transition-colors ${
                selectedClip?.type === 'background' ? 'bg-purple-950/60 text-purple-200' : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-1 truncate max-w-[70px]">
                <span className="text-gray-500 text-[10px]">⋮⋮</span>
                <span className="truncate font-medium">{backgroundTrack.name || 'Background'}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-500" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onToggleTrackVisibility?.('background', backgroundTrack.id)}
                  className="hover:text-white"
                  title={backgroundTrack.isVisible === false ? "Show on Stage" : "Hide from Stage"}
                >
                  {backgroundTrack.isVisible === false ? <EyeOff className="w-2.5 h-2.5 text-gray-600" /> : <Eye className="w-2.5 h-2.5" />}
                </button>
                <button
                  onClick={() => onToggleTrackLock?.('background', backgroundTrack.id)}
                  className="hover:text-white"
                  title={backgroundTrack.isLocked ? "Unlock Track" : "Lock Track"}
                >
                  {backgroundTrack.isLocked ? <Lock className="w-2.5 h-2.5 text-amber-400" /> : <Unlock className="w-2.5 h-2.5" />}
                </button>
                <button
                  onClick={() => {
                    onDeleteBackgroundTrack?.();
                    if (selectedClip?.type === 'background') setSelectedClip(null);
                  }}
                  className="hover:text-red-400"
                  title="Delete Background"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          )}

          {/* 3. Audio Tracks Headers */}
          {audioTracks.map((audio) => {
            const isSelected = selectedClip?.type === 'audio' && selectedClip.id === audio.id;
            return (
              <div
                key={audio.id}
                onClick={() => {
                  setSelectedClip({ type: 'audio', id: audio.id });
                  onSelectAudioTrack?.(audio.id);
                }}
                className={`h-8 border-b border-[#222530] px-2 flex items-center justify-between text-[11px] cursor-pointer transition-colors ${
                  isSelected ? 'bg-emerald-950/60 text-emerald-200' : 'text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-1 truncate max-w-[70px]">
                  <span className="text-gray-500 text-[10px]">⋮⋮</span>
                  <span className="truncate font-semibold">{audio.name}</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-500" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleTrackVisibility?.('audio', audio.id)}
                    className="hover:text-white"
                    title={audio.isMuted ? "Unmute" : "Mute"}
                  >
                    {audio.isMuted ? <VolumeX className="w-2.5 h-2.5 text-gray-600" /> : <Volume2 className="w-2.5 h-2.5" />}
                  </button>
                  <button
                    onClick={() => onToggleTrackLock?.('audio', audio.id)}
                    className="hover:text-white"
                    title={audio.isLocked ? "Unlock" : "Lock"}
                  >
                    {audio.isLocked ? <Lock className="w-2.5 h-2.5 text-amber-400" /> : <Unlock className="w-2.5 h-2.5" />}
                  </button>
                  <button
                    onClick={() => {
                      onDeleteAudioTrack?.(audio.id);
                      if (selectedClip?.id === audio.id) setSelectedClip(null);
                    }}
                    className="hover:text-red-400"
                    title="Delete Audio"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* 4. Character Tracks Headers */}
          {characters.map((char) => {
            const isSelected = selectedClip?.type === 'character' && selectedClip.id === char.instanceId;
            return (
              <div
                key={char.instanceId}
                onClick={() => {
                  setSelectedClip({ type: 'character', id: char.instanceId });
                  onSelectCharacterInstance?.(char.instanceId);
                }}
                className={`h-8 border-b border-[#222530] px-2 flex items-center justify-between text-[11px] cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-950/60 text-blue-200' : 'text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-1 truncate max-w-[70px]">
                  <span className="text-gray-500 text-[10px]">⋮⋮</span>
                  <span className="truncate font-medium">{char.name}</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-500" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleTrackVisibility?.('character', char.instanceId)}
                    className="hover:text-white"
                    title={char.isVisible === false ? "Show on Stage" : "Hide from Stage"}
                  >
                    {char.isVisible === false ? <EyeOff className="w-2.5 h-2.5 text-gray-600" /> : <Eye className="w-2.5 h-2.5" />}
                  </button>
                  <button
                    onClick={() => onToggleTrackLock?.('character', char.instanceId)}
                    className="hover:text-white"
                    title={char.isLocked ? "Unlock" : "Lock"}
                  >
                    {char.isLocked ? <Lock className="w-2.5 h-2.5 text-amber-400" /> : <Unlock className="w-2.5 h-2.5" />}
                  </button>
                  <button
                    onClick={() => {
                      onDeleteCharacter?.(char.instanceId);
                      if (selectedClip?.id === char.instanceId) setSelectedClip(null);
                    }}
                    className="hover:text-red-400"
                    title="Delete Character"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* 5. Media / Image Tracks Headers */}
          {mediaLayers.map((media) => {
            const isSelected = selectedClip?.type === 'media' && selectedClip.id === media.instanceId;
            return (
              <div
                key={media.instanceId}
                onClick={() => {
                  setSelectedClip({ type: 'media', id: media.instanceId });
                  onSelectMediaLayer?.(media.instanceId);
                }}
                className={`h-8 border-b border-[#222530] px-2 flex items-center justify-between text-[11px] cursor-pointer transition-colors ${
                  isSelected ? 'bg-teal-950/60 text-teal-200' : 'text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-1 truncate max-w-[70px]">
                  <span className="text-gray-500 text-[10px]">⋮⋮</span>
                  <span className="truncate">{media.name}</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-500" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleTrackVisibility?.('media', media.instanceId)}
                    className="hover:text-white"
                    title={media.isVisible === false ? "Show on Stage" : "Hide from Stage"}
                  >
                    {media.isVisible === false ? <EyeOff className="w-2.5 h-2.5 text-gray-600" /> : <Eye className="w-2.5 h-2.5" />}
                  </button>
                  <button
                    onClick={() => onToggleTrackLock?.('media', media.instanceId)}
                    className="hover:text-white"
                    title={media.isLocked ? "Unlock" : "Lock"}
                  >
                    {media.isLocked ? <Lock className="w-2.5 h-2.5 text-amber-400" /> : <Unlock className="w-2.5 h-2.5" />}
                  </button>
                  <button
                    onClick={() => {
                      onDeleteMediaLayer?.(media.instanceId);
                      if (selectedClip?.id === media.instanceId) setSelectedClip(null);
                    }}
                    className="hover:text-red-400"
                    title="Delete Media"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Time Ruler & Multi-Track Clips Area (Horizontally Scrollable) */}
        <div ref={scrollContainerRef} className="flex-1 flex flex-col overflow-x-auto relative bg-[#0f1118]">
          <div style={{ width: `${totalTrackWidth}px`, minWidth: '100%' }} className="relative flex flex-col flex-1">
            {/* Time Ruler (0, 1, 2, 3 ... 140s) */}
            <div
              ref={rulerRef}
              onMouseDown={handleRulerMouseDown}
              className="h-6 border-b border-[#262a38] bg-[#12141c] relative cursor-pointer flex items-center select-none"
            >
              {/* Ticks for each second */}
              {Array.from({ length: totalDurationSeconds + 1 }).map((_, s) => {
                const leftPx = s * pxPerSec;
                const showLabel = pxPerSec >= 35 || s % 5 === 0;
                return (
                  <div
                    key={s}
                    className="absolute top-0 bottom-0 flex flex-col justify-end pointer-events-none"
                    style={{ left: `${leftPx}px` }}
                  >
                    {showLabel && (
                      <span className="text-[9px] font-mono text-gray-400 mb-0.5 -translate-x-1/2 select-none">
                        {s}s
                      </span>
                    )}
                    <div className={`w-px ${s % 5 === 0 ? 'h-2 bg-gray-400' : 'h-1.5 bg-[#3a4154]'}`} />
                  </div>
                );
              })}

              {/* Playhead Marker */}
              <div
                className="absolute top-0 bottom-0 w-3 -ml-1.5 z-40 flex flex-col items-center pointer-events-none"
                style={{ left: `${currentTimeSeconds * pxPerSec}px` }}
              >
                <div className="w-3 h-2 bg-gray-300 border border-gray-100 clip-triangle shadow-sm" />
                <div className="w-3.5 h-2 bg-[#1e2230] rounded-t text-[8px] flex items-center justify-center font-bold text-gray-300 -mt-0.5">
                  ^
                </div>
              </div>
            </div>

            {/* Clips Grid Container */}
            <div className="flex-1 overflow-y-auto relative bg-[#0c0e14]">
              {/* Vertical Playhead Line running across all tracks */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-30 pointer-events-none shadow-[0_0_8px_rgba(96,165,250,0.8)]"
                style={{ left: `${currentTimeSeconds * pxPerSec}px` }}
              />

              {/* 1. CAMERA TRACK STRIP (BROWN) */}
              {cameraTrack && (() => {
                const isSelected = selectedClip?.type === 'camera';
                const camStart = cameraTrack.startTime || 0;
                const camDur = cameraTrack.duration || 6.7;
                const isLocked = Boolean(cameraTrack.isLocked);

                return (
                  <div className="h-8 border-b border-[#1f222e] p-0.5 relative flex items-center">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClip({ type: 'camera', id: cameraTrack.id });
                      }}
                      onMouseDown={(e) => {
                        if (isLocked) return;
                        setDragState({
                          mode: 'move',
                          trackType: 'camera',
                          id: cameraTrack.id,
                          startX: e.clientX,
                          initialStartTime: camStart,
                          initialDuration: camDur
                        });
                      }}
                      style={{ left: `${camStart * pxPerSec}px`, width: `${camDur * pxPerSec}px` }}
                      className={`absolute top-0.5 bottom-0.5 rounded flex items-center justify-between text-[10px] font-semibold overflow-hidden transition-all ${
                        isLocked ? 'cursor-not-allowed opacity-85' : 'cursor-move'
                      } ${
                        isSelected
                          ? 'ring-2 ring-white border-white bg-[#853e1a] z-20 shadow-lg'
                          : 'bg-[#853e1a] border border-[#a04e22] text-amber-100 hover:brightness-110'
                      }`}
                    >
                      {/* Left Handle Tab < */}
                      {isSelected && !isLocked && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragState({
                              mode: 'trim-left',
                              trackType: 'camera',
                              id: cameraTrack.id,
                              startX: e.clientX,
                              initialStartTime: camStart,
                              initialDuration: camDur
                            });
                          }}
                          className="absolute left-0 top-0 bottom-0 w-3 bg-white text-black font-extrabold flex items-center justify-center cursor-ew-resize z-30 shadow"
                          title="Drag to trim start"
                        >
                          &lt;
                        </div>
                      )}

                      <div className="flex items-center space-x-1 pl-4 truncate">
                        <CameraIcon className="w-3 h-3 text-amber-300 shrink-0" />
                        <span className="truncate">Camera</span>
                        <span className="text-[9px] text-amber-300 font-mono">({camDur.toFixed(1)}s)</span>
                        {isLocked && <Lock className="w-2.5 h-2.5 text-amber-300 shrink-0" />}
                      </div>

                      {/* Right Handle Tab > */}
                      {isSelected && !isLocked && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragState({
                              mode: 'trim-right',
                              trackType: 'camera',
                              id: cameraTrack.id,
                              startX: e.clientX,
                              initialStartTime: camStart,
                              initialDuration: camDur
                            });
                          }}
                          className="absolute right-0 top-0 bottom-0 w-3 bg-white text-black font-extrabold flex items-center justify-center cursor-ew-resize z-30 shadow"
                          title="Drag to trim end"
                        >
                          &gt;
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 2. BACKGROUND TRACK STRIP (PURPLE / INDIGO) */}
              {backgroundTrack && (() => {
                const isSelected = selectedClip?.type === 'background';
                const bgStart = backgroundTrack.startTime || 0;
                const bgDur = backgroundTrack.duration || totalDurationSeconds;
                const isLocked = Boolean(backgroundTrack.isLocked);

                return (
                  <div className="h-8 border-b border-[#1f222e] p-0.5 relative flex items-center">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClip({ type: 'background', id: backgroundTrack.id });
                      }}
                      onMouseDown={(e) => {
                        if (isLocked) return;
                        setDragState({
                          mode: 'move',
                          trackType: 'background',
                          id: backgroundTrack.id,
                          startX: e.clientX,
                          initialStartTime: bgStart,
                          initialDuration: bgDur
                        });
                      }}
                      style={{ left: `${bgStart * pxPerSec}px`, width: `${bgDur * pxPerSec}px` }}
                      className={`absolute top-0.5 bottom-0.5 rounded flex items-center justify-between text-[10px] font-semibold overflow-hidden transition-all ${
                        isLocked ? 'cursor-not-allowed opacity-85' : 'cursor-move'
                      } ${
                        isSelected
                          ? 'ring-2 ring-white border-white bg-purple-900 z-20 shadow-lg'
                          : 'bg-purple-950/80 border border-purple-800 text-purple-100 hover:brightness-110'
                      }`}
                    >
                      {/* Left Handle Tab < */}
                      {isSelected && !isLocked && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragState({
                              mode: 'trim-left',
                              trackType: 'background',
                              id: backgroundTrack.id,
                              startX: e.clientX,
                              initialStartTime: bgStart,
                              initialDuration: bgDur
                            });
                          }}
                          className="absolute left-0 top-0 bottom-0 w-3 bg-white text-black font-extrabold flex items-center justify-center cursor-ew-resize z-30 shadow"
                          title="Drag to trim start"
                        >
                          &lt;
                        </div>
                      )}

                      <div className="flex items-center space-x-1.5 pl-4 pr-4 truncate">
                        <ImageIcon className="w-3 h-3 text-purple-300 shrink-0" />
                        <span className="truncate">{backgroundTrack.name || 'Background Image'}</span>
                        <span className="text-[9px] text-purple-300 font-mono">({bgDur.toFixed(1)}s)</span>
                        {isLocked && <Lock className="w-2.5 h-2.5 text-amber-300 shrink-0" />}
                      </div>

                      {/* Right Handle Tab > */}
                      {isSelected && !isLocked && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragState({
                              mode: 'trim-right',
                              trackType: 'background',
                              id: backgroundTrack.id,
                              startX: e.clientX,
                              initialStartTime: bgStart,
                              initialDuration: bgDur
                            });
                          }}
                          className="absolute right-0 top-0 bottom-0 w-3 bg-white text-black font-extrabold flex items-center justify-center cursor-ew-resize z-30 shadow"
                          title="Drag to trim end"
                        >
                          &gt;
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 3. AUDIO TRACKS STRIPS (GREEN WAVEFORM) */}
              {audioTracks.map((audio) => {
                const isSelected = selectedClip?.type === 'audio' && selectedClip.id === audio.id;
                const audioStart = audio.startTime || 0;
                const audioDur = audio.duration || 15;
                const isLocked = Boolean(audio.isLocked);
                const barCount = Math.max(16, Math.min(240, Math.floor((audioDur * pxPerSec) / 8)));

                return (
                  <div key={audio.id} className="h-8 border-b border-[#1f222e] p-0.5 relative flex items-center">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClip({ type: 'audio', id: audio.id });
                        onSelectAudioTrack?.(audio.id);
                      }}
                      onMouseDown={(e) => {
                        if (isLocked) return;
                        setDragState({
                          mode: 'move',
                          trackType: 'audio',
                          id: audio.id,
                          startX: e.clientX,
                          initialStartTime: audioStart,
                          initialDuration: audioDur
                        });
                      }}
                      style={{ left: `${audioStart * pxPerSec}px`, width: `${audioDur * pxPerSec}px` }}
                      className={`absolute top-0.5 bottom-0.5 rounded flex items-center justify-between text-[10px] font-semibold overflow-hidden transition-all ${
                        isLocked ? 'cursor-not-allowed opacity-85' : 'cursor-move'
                      } ${
                        isSelected
                          ? 'ring-2 ring-white border-white bg-[#1a853e] z-20 shadow-lg'
                          : 'bg-[#1a853e] border border-[#22a04e] text-emerald-100 hover:brightness-110'
                      }`}
                    >
                      {/* Left Handle Tab < */}
                      {isSelected && !isLocked && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragState({
                              mode: 'trim-left',
                              trackType: 'audio',
                              id: audio.id,
                              startX: e.clientX,
                              initialStartTime: audioStart,
                              initialDuration: audioDur
                            });
                          }}
                          className="absolute left-0 top-0 bottom-0 w-3.5 bg-white text-black font-extrabold flex items-center justify-center cursor-ew-resize z-30 shadow rounded-l"
                          title="Drag to trim start"
                        >
                          &lt;
                        </div>
                      )}

                      {/* Stylized Audio Waveform Graphic */}
                      <div className="absolute inset-0 flex items-center space-x-0.5 px-4 opacity-40 pointer-events-none">
                        {Array.from({ length: barCount }).map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-white rounded-full"
                            style={{
                              height: `${25 + Math.sin(i * 0.4) * 20 + (i % 4) * 12}%`
                            }}
                          />
                        ))}
                      </div>

                      {/* Title & Icon */}
                      <div className="relative z-10 flex items-center space-x-1.5 pl-4 pr-4 truncate">
                        <Volume2 className="w-3 h-3 text-white shrink-0" />
                        <span className="truncate font-bold text-white text-[10px]">
                          {audio.name}
                        </span>
                        <span className="text-[9px] text-emerald-200 font-mono">({audioDur.toFixed(1)}s)</span>
                        {isLocked && <Lock className="w-2.5 h-2.5 text-amber-300 shrink-0" />}
                      </div>

                      {/* Right Handle Tab > */}
                      {isSelected && !isLocked && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragState({
                              mode: 'trim-right',
                              trackType: 'audio',
                              id: audio.id,
                              startX: e.clientX,
                              initialStartTime: audioStart,
                              initialDuration: audioDur
                            });
                          }}
                          className="absolute right-0 top-0 bottom-0 w-3.5 bg-white text-black font-extrabold flex items-center justify-center cursor-ew-resize z-30 shadow rounded-r"
                          title="Drag to trim end"
                        >
                          &gt;
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 4. CHARACTER TRACKS STRIPS (BLUE WITH ACTION) */}
              {characters.map((char) => {
                const isSelected = selectedClip?.type === 'character' && selectedClip.id === char.instanceId;
                const charStart = char.startTime || 0;
                const charDur = char.duration || totalDurationSeconds;
                const isLocked = Boolean(char.isLocked);

                return (
                  <div key={char.instanceId} className="h-8 border-b border-[#1f222e] p-0.5 relative flex items-center">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClip({ type: 'character', id: char.instanceId });
                        onSelectCharacterInstance?.(char.instanceId);
                      }}
                      onMouseDown={(e) => {
                        if (isLocked) return;
                        setDragState({
                          mode: 'move',
                          trackType: 'character',
                          id: char.instanceId,
                          startX: e.clientX,
                          initialStartTime: charStart,
                          initialDuration: charDur
                        });
                      }}
                      style={{ left: `${charStart * pxPerSec}px`, width: `${charDur * pxPerSec}px` }}
                      className={`absolute top-0.5 bottom-0.5 rounded flex items-center justify-between text-[10px] font-semibold overflow-hidden transition-all ${
                        isLocked ? 'cursor-not-allowed opacity-85' : 'cursor-move'
                      } ${
                        isSelected
                          ? 'ring-2 ring-white border-white bg-[#1d4ed8] z-20 shadow-lg'
                          : 'bg-[#1d4ed8] border border-[#2563eb] text-blue-100 hover:brightness-110'
                      }`}
                    >
                      {/* Left Handle Tab < */}
                      {isSelected && !isLocked && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragState({
                              mode: 'trim-left',
                              trackType: 'character',
                              id: char.instanceId,
                              startX: e.clientX,
                              initialStartTime: charStart,
                              initialDuration: charDur
                            });
                          }}
                          className="absolute left-0 top-0 bottom-0 w-3.5 bg-white text-black font-extrabold flex items-center justify-center cursor-ew-resize z-30 shadow rounded-l"
                          title="Drag to trim start"
                        >
                          &lt;
                        </div>
                      )}

                      <div className="flex items-center space-x-1.5 pl-4 pr-4 truncate">
                        <span className="w-3.5 h-3.5 bg-blue-700 rounded flex items-center justify-center text-[9px] text-white">
                          🏃
                        </span>
                        <span className="truncate font-semibold">{char.name}: {char.action || 'Idle'}</span>
                        <span className="text-[9px] text-blue-200 font-mono">({charDur.toFixed(1)}s)</span>
                        {isLocked && <Lock className="w-2.5 h-2.5 text-amber-300 shrink-0" />}
                      </div>

                      {/* Right Handle Tab > */}
                      {isSelected && !isLocked && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragState({
                              mode: 'trim-right',
                              trackType: 'character',
                              id: char.instanceId,
                              startX: e.clientX,
                              initialStartTime: charStart,
                              initialDuration: charDur
                            });
                          }}
                          className="absolute right-0 top-0 bottom-0 w-3.5 bg-white text-black font-extrabold flex items-center justify-center cursor-ew-resize z-30 shadow rounded-r"
                          title="Drag to trim end"
                        >
                          &gt;
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 5. MEDIA / IMAGE TRACKS STRIPS (TEAL/EMERALD) */}
              {mediaLayers.map((media) => {
                const isSelected = selectedClip?.type === 'media' && selectedClip.id === media.instanceId;
                const mediaStart = media.startTime || 0;
                const mediaDur = media.duration || totalDurationSeconds;
                const isLocked = Boolean(media.isLocked);

                return (
                  <div key={media.instanceId} className="h-8 border-b border-[#1f222e] p-0.5 relative flex items-center">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClip({ type: 'media', id: media.instanceId });
                        onSelectMediaLayer?.(media.instanceId);
                      }}
                      onMouseDown={(e) => {
                        if (isLocked) return;
                        setDragState({
                          mode: 'move',
                          trackType: 'media',
                          id: media.instanceId,
                          startX: e.clientX,
                          initialStartTime: mediaStart,
                          initialDuration: mediaDur
                        });
                      }}
                      style={{ left: `${mediaStart * pxPerSec}px`, width: `${mediaDur * pxPerSec}px` }}
                      className={`absolute top-0.5 bottom-0.5 rounded flex items-center justify-between text-[10px] font-semibold overflow-hidden transition-all ${
                        isLocked ? 'cursor-not-allowed opacity-85' : 'cursor-move'
                      } ${
                        isSelected
                          ? 'ring-2 ring-white border-white bg-teal-800 z-20 shadow-lg'
                          : 'bg-teal-950/80 border border-teal-700 text-teal-100 hover:brightness-110'
                      }`}
                    >
                      {/* Left Handle Tab < */}
                      {isSelected && !isLocked && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragState({
                              mode: 'trim-left',
                              trackType: 'media',
                              id: media.instanceId,
                              startX: e.clientX,
                              initialStartTime: mediaStart,
                              initialDuration: mediaDur
                            });
                          }}
                          className="absolute left-0 top-0 bottom-0 w-3.5 bg-white text-black font-extrabold flex items-center justify-center cursor-ew-resize z-30 shadow rounded-l"
                          title="Drag to trim start"
                        >
                          &lt;
                        </div>
                      )}

                      <div className="flex items-center space-x-1.5 pl-4 pr-4 truncate">
                        <ImageIcon className="w-3 h-3 text-teal-300 shrink-0" />
                        <span className="truncate font-medium">{media.name}</span>
                        <span className="text-[9px] text-teal-300 font-mono">({mediaDur.toFixed(1)}s)</span>
                        {isLocked && <Lock className="w-2.5 h-2.5 text-amber-300 shrink-0" />}
                      </div>

                      {/* Right Handle Tab > */}
                      {isSelected && !isLocked && (
                        <div
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDragState({
                              mode: 'trim-right',
                              trackType: 'media',
                              id: media.instanceId,
                              startX: e.clientX,
                              initialStartTime: mediaStart,
                              initialDuration: mediaDur
                            });
                          }}
                          className="absolute right-0 top-0 bottom-0 w-3.5 bg-white text-black font-extrabold flex items-center justify-center cursor-ew-resize z-30 shadow rounded-r"
                          title="Drag to trim end"
                        >
                          &gt;
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
