import React, { useState, useRef, useEffect } from 'react';
import { SceneTemplate, ActiveCanvasCharacter, ActiveCanvasMediaLayer, BackgroundTimelineTrack } from '../types/autodraft';
import { VisualOverlayEffect } from '../types/audio';
import { AUTODRAFT_CHARACTERS } from '../data/autodraftData';
import { AUTODRAFT_PROPS, PropSlotKey } from '../data/autodraftProps';
import { CharacterAvatarPreview } from './CharacterAvatarPreview';
import { ErrorBoundary } from './ErrorBoundary';
import { AutoDraftSelectionToolbar } from './AutoDraftSelectionToolbar';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

interface AutoDraftCanvasStageProps {
  currentTemplate: SceneTemplate | null;
  characters: ActiveCanvasCharacter[];
  selectedCharInstanceId: string | null;
  isPlaying: boolean;
  currentTimeSeconds?: number;
  customBackgroundUrl?: string | null;
  backgroundTrack?: BackgroundTimelineTrack | null;
  canvasMediaLayers?: ActiveCanvasMediaLayer[];
  selectedMediaInstanceId?: string | null;
  activeEffects?: VisualOverlayEffect[];
  onSelectMediaInstance?: (instanceId: string | null) => void;
  onUpdateMediaPosition?: (instanceId: string, x: number, y: number) => void;
  onUpdateMediaLayer?: (instanceId: string, updates: Partial<ActiveCanvasMediaLayer>) => void;
  onDeleteMediaLayer?: (instanceId: string) => void;
  onSelectCharacterInstance: (instanceId: string) => void;
  onUpdateCharacterPosition: (instanceId: string, x: number, y: number) => void;
  onFlipCharacter?: (instanceId: string) => void;
  onDeleteCharacter?: (instanceId: string) => void;
  onUpdateCharacterScale?: (instanceId: string, scale: number) => void;
  onUpdateCharacterRotation?: (instanceId: string, rotation: number) => void;
  onUpdateCharacterSpeed?: (instanceId: string, speed: number) => void;
  onUpdateCharacterAdjust?: (instanceId: string, filters: any) => void;
  onUpdateCharacterMask?: (instanceId: string, mask: any) => void;
  onUpdateCharacterPath?: (instanceId: string, path: any) => void;
  onSortCharacter?: (instanceId: string, action: 'front' | 'back' | 'forward' | 'backward') => void;
  onOpenProps?: () => void;
  onAIAnimate?: (prompt: string) => void;
}

type DragMode = 'move' | 'scale-tl' | 'scale-tr' | 'scale-bl' | 'scale-br' | 'scale-edge' | 'rotate' | null;

interface AutoDraftSceneBackgroundProps {
  template: SceneTemplate | null;
  stageWidth: number;
  customBackgroundUrl?: string | null;
  backgroundTrack?: BackgroundTimelineTrack | null;
  currentTimeSeconds?: number;
  hasInteractiveLayers?: boolean;
}

const AutoDraftSceneBackground: React.FC<AutoDraftSceneBackgroundProps> = ({
  template,
  stageWidth,
  customBackgroundUrl,
  backgroundTrack,
  currentTimeSeconds,
  hasInteractiveLayers
}) => {
  const [dynamicBgLayers, setDynamicBgLayers] = useState<any[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerScale, setContainerScale] = useState<number>(1);

  // Measure container exact width to scale the 853.33 x 480 base scene
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) {
          setContainerScale(w / 853.3333333333334);
        }
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!template) {
      setDynamicBgLayers(null);
      return;
    }

    // 1. If template has preloaded bgLayers, use immediately
    if (template.bgLayers && template.bgLayers.length > 0) {
      setDynamicBgLayers(template.bgLayers);
      return;
    }

    // 2. Otherwise fetch dynamically from official jsonUrl
    if (template.jsonUrl) {
      let active = true;
      fetch(template.jsonUrl)
        .then((r) => r.json())
        .then((data) => {
          if (!active) return;
          const sc0 = data.scenes?.[0];
          if (sc0 && sc0.bgLayers && sc0.bgLayers.length > 0) {
            const flatOrder = sc0.drawOrder ? sc0.drawOrder.flat() : [];
            const sortedBgs = sc0.bgLayers.slice().sort((a: any, b: any) => {
              const idxA = flatOrder.indexOf(a.id);
              const idxB = flatOrder.indexOf(b.id);
              return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
            });

            const parsed = sortedBgs.map((b: any) => {
              const node = b.timeline?.animations?.[0]?.nodes?.[0] || {};
              return {
                id: b.id,
                name: b.name,
                url: b.url,
                x: node.position?.x || 0,
                y: node.position?.y || 0,
                scaleX: node.scaleX !== undefined ? node.scaleX : 1,
                scaleY: node.scaleY !== undefined ? node.scaleY : 1,
                flipX: Boolean(node.flipX),
                rotation: node.rotation || 0,
                opacity: node.opacity !== undefined ? node.opacity : 1
              };
            });
            setDynamicBgLayers(parsed);
          }
        })
        .catch(() => {});

      return () => {
        active = false;
      };
    } else {
      setDynamicBgLayers(null);
    }
  }, [template?.id, template?.jsonUrl]);

  // Check backgroundTrack or customBackgroundUrl
  const effectiveBgUrl = backgroundTrack ? backgroundTrack.url : customBackgroundUrl;
  const isBgVisible = backgroundTrack
    ? (backgroundTrack.isVisible !== false && (
        currentTimeSeconds === undefined || (
          currentTimeSeconds >= (backgroundTrack.startTime ?? 0) - 0.05 &&
          currentTimeSeconds <= (backgroundTrack.startTime ?? 0) + (backgroundTrack.duration ?? 999999) + 0.05
        )
      ))
    : Boolean(customBackgroundUrl);

  if (effectiveBgUrl && isBgVisible) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden" data-stage-background="custom">
        <img
          src={effectiveBgUrl}
          alt={backgroundTrack?.name || "Custom Stage Background"}
          crossOrigin="anonymous"
          className="w-full h-full object-cover select-none pointer-events-none"
        />
      </div>
    );
  }

  if (!template || (backgroundTrack && !isBgVisible)) {
    return <div className="absolute inset-0 bg-white flex items-center justify-center pointer-events-none" />;
  }

  // Base canvas coordinate width in AutoDraft is 853.3333333333334
  const baseWidth = 853.3333333333334;
  const baseHeight = 480;
  const effectiveScale = containerScale > 0 ? containerScale : (stageWidth > 0 ? stageWidth / baseWidth : 1);

  if (dynamicBgLayers && dynamicBgLayers.length > 0) {
    if (hasInteractiveLayers) {
      return <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[#87CEEB]" />;
    }
    return (
      <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden bg-[#87CEEB]">
        <div
          style={{
            width: `${baseWidth}px`,
            height: `${baseHeight}px`,
            transform: `scale(${effectiveScale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
          {dynamicBgLayers.map((layer, idx) => (
            <img
              key={`${layer.id}_${idx}`}
              src={layer.url}
              alt={layer.name}
              className="absolute select-none pointer-events-none max-w-none max-h-none"
              style={{
                left: `${layer.x}px`,
                top: `${layer.y}px`,
                transform: `scale(${layer.scaleX * (layer.flipX ? -1 : 1)}, ${layer.scaleY}) rotate(${layer.rotation || 0}deg)`,
                transformOrigin: 'top left',
                opacity: layer.opacity !== undefined ? layer.opacity : 1,
                zIndex: idx + 1
              }}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-95">
      <img
        src={template.backgroundUrl || template.thumbnailUrl}
        alt={template.name}
        className="w-full h-full object-cover select-none pointer-events-none filter blur-[0.2px]"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    </div>
  );
};

export const AutoDraftCanvasStage: React.FC<AutoDraftCanvasStageProps> = ({
  currentTemplate,
  characters,
  selectedCharInstanceId,
  isPlaying,
  currentTimeSeconds = 0,
  customBackgroundUrl,
  backgroundTrack,
  canvasMediaLayers = [],
  selectedMediaInstanceId,
  activeEffects = [],
  onSelectMediaInstance,
  onUpdateMediaPosition,
  onUpdateMediaLayer,
  onDeleteMediaLayer,
  onSelectCharacterInstance,
  onUpdateCharacterPosition,
  onFlipCharacter,
  onDeleteCharacter,
  onUpdateCharacterScale,
  onUpdateCharacterRotation,
  onUpdateCharacterSpeed,
  onUpdateCharacterAdjust,
  onUpdateCharacterMask,
  onUpdateCharacterPath,
  onSortCharacter,
  onOpenProps,
  onAIAnimate
}) => {
  const [zoom, setZoom] = useState<number>(1.0);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragCharId, setDragCharId] = useState<string | null>(null);
  const [dragMediaId, setDragMediaId] = useState<string | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialScale, setInitialScale] = useState<number>(1.0);
  const [initialCharPos, setInitialCharPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [stageWidth, setStageWidth] = useState<number>(880);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRafRef = useRef<number | null>(null);
  const pendingEventRef = useRef<{ clientX: number; clientY: number } | null>(null);

  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setStageWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  const selectedChar = characters.find((c) => c.instanceId === selectedCharInstanceId);

  // 1. Move Drag Handler
  const handleCharMouseDown = (e: React.MouseEvent, char: ActiveCanvasCharacter) => {
    if (char.isLocked) return;
    e.stopPropagation();
    onSelectCharacterInstance(char.instanceId);
    setDragMode('move');
    setDragCharId(char.instanceId);
    setStartPos({ x: e.clientX, y: e.clientY });
    setInitialCharPos({ x: char.x, y: char.y });
  };

  // 2. Corner Scale Drag Handler
  const handleScaleMouseDown = (e: React.MouseEvent, char: ActiveCanvasCharacter, mode: DragMode) => {
    if (char.isLocked) return;
    e.stopPropagation();
    setDragMode(mode);
    setDragCharId(char.instanceId);
    setStartPos({ x: e.clientX, y: e.clientY });
    setInitialScale(char.scale || 1.0);
  };

  // 3. Rotation Drag Handler
  const handleRotateMouseDown = (e: React.MouseEvent, char: ActiveCanvasCharacter) => {
    if (char.isLocked) return;
    e.stopPropagation();
    setDragMode('rotate');
    setDragCharId(char.instanceId);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  // 4. Mouse Move for all transforms with requestAnimationFrame throttling
  const handleStageMouseMove = (e: React.MouseEvent) => {
    if (!dragMode || (!dragCharId && !dragMediaId)) return;
    pendingEventRef.current = { clientX: e.clientX, clientY: e.clientY };

    if (dragRafRef.current !== null) return;

    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = null;
      const coords = pendingEventRef.current;
      if (!coords || !dragMode) return;

      if (dragMode === 'move') {
        const stageRect = stageRef.current?.getBoundingClientRect();
        const deltaX = (coords.clientX - startPos.x) / zoom;
        const deltaY = (coords.clientY - startPos.y) / zoom;

        if (dragMediaId) {
          const targetMedia = canvasMediaLayers?.find((m) => m.instanceId === dragMediaId);
          if (targetMedia?.isTemplateLayer) {
            const stageScale = stageRect && stageRect.width > 0 ? stageRect.width / 853.3333333333334 : 1;
            onUpdateMediaPosition?.(
              dragMediaId,
              Math.round(initialCharPos.x + deltaX / stageScale),
              Math.round(initialCharPos.y + deltaY / stageScale)
            );
          } else if (initialCharPos.x <= 100 && stageRect && stageRect.width > 0) {
            const deltaPctX = (deltaX / stageRect.width) * 100;
            const deltaPctY = (deltaY / stageRect.height) * 100;
            onUpdateMediaPosition?.(
              dragMediaId,
              parseFloat((initialCharPos.x + deltaPctX).toFixed(1)),
              parseFloat((initialCharPos.y + deltaPctY).toFixed(1))
            );
          } else {
            onUpdateMediaPosition?.(dragMediaId, Math.round(initialCharPos.x + deltaX), Math.round(initialCharPos.y + deltaY));
          }
          return;
        }

        if (dragCharId) {
          if (initialCharPos.x <= 100 && stageRect && stageRect.width > 0) {
            const deltaPctX = (deltaX / stageRect.width) * 100;
            const deltaPctY = (deltaY / stageRect.height) * 100;
            onUpdateCharacterPosition(
              dragCharId,
              parseFloat((initialCharPos.x + deltaPctX).toFixed(1)),
              parseFloat((initialCharPos.y + deltaPctY).toFixed(1))
            );
          } else {
            onUpdateCharacterPosition(dragCharId, Math.round(initialCharPos.x + deltaX), Math.round(initialCharPos.y + deltaY));
          }
        }
      } else if (
        dragMode === 'scale-tl' ||
        dragMode === 'scale-tr' ||
        dragMode === 'scale-bl' ||
        dragMode === 'scale-br' ||
        dragMode === 'scale-edge'
      ) {
        const deltaDist = (coords.clientY - startPos.y) / zoom;
        const multiplier = dragMode === 'scale-tl' || dragMode === 'scale-tr' ? -1 : 1;
        const scaleDelta = (deltaDist * multiplier) * 0.005;
        const newScale = Math.max(0.05, Math.min(5.0, initialScale + scaleDelta));
        if (onUpdateCharacterScale && dragCharId) {
          onUpdateCharacterScale(dragCharId, parseFloat(newScale.toFixed(2)));
        } else if (onUpdateMediaLayer && dragMediaId) {
          onUpdateMediaLayer(dragMediaId, { scale: parseFloat(newScale.toFixed(2)) });
        }
      } else if (dragMode === 'rotate') {
        const stageRect = stageRef.current?.getBoundingClientRect();
        if (!stageRect) return;
        const targetChar = characters.find((c) => c.instanceId === dragCharId);
        if (!targetChar) return;

        // Calculate center of character on screen
        const isPercent = targetChar.x <= 100;
        const charCenterX = stageRect.left + (isPercent ? (stageRect.width * targetChar.x) / 100 : targetChar.x);
        const charCenterY = stageRect.top + (isPercent ? (stageRect.height * targetChar.y) / 100 : targetChar.y);

        const rad = Math.atan2(coords.clientY - charCenterY, coords.clientX - charCenterX);
        const deg = Math.round((rad * (180 / Math.PI)) + 90);
        const normalizedDeg = (deg + 360) % 360;

        if (onUpdateCharacterRotation && dragCharId) {
          onUpdateCharacterRotation(dragCharId, normalizedDeg);
        }
      }
    });
  };

  const handleStageMouseUp = () => {
    if (dragRafRef.current !== null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    pendingEventRef.current = null;
    setDragMode(null);
    setDragCharId(null);
    setDragMediaId(null);
  };

  return (
    <div
      className="flex-1 h-full bg-[#11131a] relative flex items-center justify-center overflow-hidden select-none"
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSelectCharacterInstance('');
        }
      }}
    >
      {/* ============================================================= */}
      {/* FLOATING TOP SELECTION TOOLBAR (EXACT MATCH SCREENSHOT 1)      */}
      {/* ============================================================= */}
      {selectedChar && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <AutoDraftSelectionToolbar
            selectedCharacter={selectedChar}
            onFlip={() => onFlipCharacter && onFlipCharacter(selectedChar.instanceId)}
            onDelete={() => onDeleteCharacter && onDeleteCharacter(selectedChar.instanceId)}
            onUpdateSpeed={(s) => onUpdateCharacterSpeed && onUpdateCharacterSpeed(selectedChar.instanceId, s)}
            onUpdateAdjust={(adj) => onUpdateCharacterAdjust && onUpdateCharacterAdjust(selectedChar.instanceId, adj)}
            onUpdateMask={(m) => onUpdateCharacterMask && onUpdateCharacterMask(selectedChar.instanceId, m)}
            onUpdatePath={(p) => onUpdateCharacterPath && onUpdateCharacterPath(selectedChar.instanceId, p)}
            onSort={(act) => onSortCharacter && onSortCharacter(selectedChar.instanceId, act)}
            onOpenProps={() => onOpenProps && onOpenProps()}
            onAIAnimate={(p) => onAIAnimate && onAIAnimate(p)}
          />
        </div>
      )}

      {/* ============================================================= */}
      {/* MAIN CANVAS STAGE VIEWPORT                                    */}
      {/* ============================================================= */}
      <div
        ref={stageRef}
        id="autodraft-canvas-stage"
        data-autodraft-stage="true"
        className={`aspect-video w-[880px] max-w-[90%] max-h-[88%] ${
          !currentTemplate && !customBackgroundUrl ? 'bg-white' : 'bg-[#1a1d28]'
        } rounded-lg shadow-2xl border border-[#2d3345] relative overflow-hidden flex flex-col transition-transform duration-75`}
        style={{ transform: `scale(${zoom})` }}
        onClick={(e) => {
          // Deselect only if clicking the background image or stage viewport directly
          if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'IMG') {
            onSelectCharacterInstance('');
          }
        }}
      >
        {/* Background Layer (AutoDraft High-Definition Multi-Layer Scene) */}
        <AutoDraftSceneBackground
          template={currentTemplate}
          stageWidth={stageWidth}
          customBackgroundUrl={customBackgroundUrl}
          backgroundTrack={backgroundTrack}
          currentTimeSeconds={currentTimeSeconds}
          hasInteractiveLayers={Boolean(canvasMediaLayers?.some((l) => l.isTemplateLayer))}
        />

        {/* ============================================================= */}
        {/* MEDIA OVERLAY LAYERS ON STAGE (IMAGES & VIDEOS)               */}
        {/* ============================================================= */}
        {canvasMediaLayers && canvasMediaLayers.map((media) => {
          const isSelected = selectedMediaInstanceId === media.instanceId;
          const isTimeVisible = (media.isVisible !== false) && (
            currentTimeSeconds === undefined || (
              (media.startTime === undefined || currentTimeSeconds >= (media.startTime - 0.05)) &&
              (media.duration === undefined || currentTimeSeconds <= (media.startTime || 0) + media.duration + 0.05)
            )
          );
          if (!isTimeVisible) return null;

          const isTemplate = Boolean(media.isTemplateLayer);
          const stageScale = stageWidth > 0 ? stageWidth / 853.3333333333334 : 1;
          const curRot = media.rotation ?? 0;
          const curScale = media.scale ?? 1.0;

          let leftVal: string;
          let topVal: string;
          let transformVal: string;
          let transformOriginVal: string;

          if (isTemplate) {
            leftVal = `${media.x * stageScale}px`;
            topVal = `${media.y * stageScale}px`;
            const sx = (media.scaleX ?? 1) * stageScale * (media.flipH || media.flipX ? -1 : 1);
            const sy = (media.scaleY ?? 1) * stageScale;
            transformVal = `scale(${sx}, ${sy}) rotate(${curRot}deg)`;
            transformOriginVal = 'top left';
          } else {
            const isPercent = media.x <= 100;
            leftVal = isPercent ? `${media.x}%` : `${media.x}px`;
            topVal = isPercent ? `${media.y}%` : `${media.y}px`;
            transformVal = `${isPercent ? 'translate(-50%, -50%)' : ''} rotate(${curRot}deg) scale(${curScale})`;
            transformOriginVal = 'center center';
          }

          return (
            <div
              key={media.instanceId}
              data-media-instance-id={media.instanceId}
              onMouseDown={(e) => {
                if (media.isLocked) return;
                e.stopPropagation();
                onSelectMediaInstance?.(media.instanceId);
                onSelectCharacterInstance('');
                setDragMode('move');
                setDragMediaId(media.instanceId);
                setStartPos({ x: e.clientX, y: e.clientY });
                setInitialCharPos({ x: media.x, y: media.y });
              }}
              onClick={(e) => {
                if (media.isLocked) return;
                e.stopPropagation();
                onSelectMediaInstance?.(media.instanceId);
              }}
              style={{
                left: leftVal,
                top: topVal,
                transform: transformVal,
                transformOrigin: transformOriginVal,
                opacity: media.opacity ?? 1,
                zIndex: media.zIndex || 5
              }}
              className={`absolute select-none ${
                media.isLocked ? 'pointer-events-none' : 'cursor-move'
              } ${
                isTemplate ? 'p-0' : 'p-1'
              } group ${
                isSelected && !media.isLocked ? 'ring-2 ring-indigo-500 rounded shadow-lg' : ''
              }`}
            >
              {media.type === 'video' ? (
                <video
                  src={media.url}
                  crossOrigin="anonymous"
                  className="max-w-[280px] max-h-[200px] rounded object-contain pointer-events-none"
                  autoPlay
                  loop
                  muted
                />
              ) : (
                <img
                  src={media.url}
                  alt={media.name}
                  crossOrigin="anonymous"
                  className={
                    isTemplate
                      ? 'max-w-none max-h-none select-none pointer-events-none'
                      : 'max-w-[260px] max-h-[220px] rounded object-contain pointer-events-none drop-shadow-md'
                  }
                />
              )}

              {/* Delete Button */}
              {isSelected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMediaLayer?.(media.instanceId);
                  }}
                  className="absolute -top-3 -right-3 w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer text-xs font-bold z-30"
                  title="Delete Media"
                >
                  ✕
                </button>
              )}

              {/* 4 Corner Resize / Scaling Handles */}
              {isSelected && (
                <>
                  <div
                    onMouseDown={(e) => {
                      if (media.isLocked) return;
                      e.stopPropagation();
                      setDragMode('scale-tl');
                      setDragMediaId(media.instanceId);
                      setStartPos({ x: e.clientX, y: e.clientY });
                      setInitialScale(media.scale || 1.0);
                    }}
                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize z-30 shadow"
                    title="Scale Media"
                  />
                  <div
                    onMouseDown={(e) => {
                      if (media.isLocked) return;
                      e.stopPropagation();
                      setDragMode('scale-tr');
                      setDragMediaId(media.instanceId);
                      setStartPos({ x: e.clientX, y: e.clientY });
                      setInitialScale(media.scale || 1.0);
                    }}
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize z-30 shadow"
                    title="Scale Media"
                  />
                  <div
                    onMouseDown={(e) => {
                      if (media.isLocked) return;
                      e.stopPropagation();
                      setDragMode('scale-bl');
                      setDragMediaId(media.instanceId);
                      setStartPos({ x: e.clientX, y: e.clientY });
                      setInitialScale(media.scale || 1.0);
                    }}
                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize z-30 shadow"
                    title="Scale Media"
                  />
                  <div
                    onMouseDown={(e) => {
                      if (media.isLocked) return;
                      e.stopPropagation();
                      setDragMode('scale-br');
                      setDragMediaId(media.instanceId);
                      setStartPos({ x: e.clientX, y: e.clientY });
                      setInitialScale(media.scale || 1.0);
                    }}
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize z-30 shadow"
                    title="Scale Media"
                  />
                </>
              )}
            </div>
          );
        })}

        {/* ============================================================= */}
        {/* SVG MOTION PATH TRAJECTORY LINES (AUTO-DRAFT STYLE)           */}
        {/* ============================================================= */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {characters.map((char) => {
            if (!char.motionPath) return null;
            const mp = char.motionPath;
            const isSelected = selectedCharInstanceId === char.instanceId;
            return (
              <g key={`path_${char.instanceId}`}>
                {/* Dashed trajectory line */}
                <line
                  x1={`${mp.startX}%`}
                  y1={`${mp.startY}%`}
                  x2={`${mp.endX}%`}
                  y2={`${mp.endY}%`}
                  stroke={isSelected ? '#38bdf8' : '#60a5fa'}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  strokeDasharray="6 4"
                  strokeOpacity={isSelected ? 0.95 : 0.45}
                />
                {/* Start Pin (Green) */}
                <circle
                  cx={`${mp.startX}%`}
                  cy={`${mp.startY}%`}
                  r="4.5"
                  fill="#22c55e"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                {/* End Pin (Red) */}
                <circle
                  cx={`${mp.endX}%`}
                  cy={`${mp.endY}%`}
                  r="4.5"
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        </svg>

        {/* Characters On Stage */}
        {characters.map((char) => {
          const isSelected = selectedCharInstanceId === char.instanceId;
          const isTimeVisible = (char.isVisible !== false) && (
            currentTimeSeconds === undefined || (
              currentTimeSeconds >= (char.startTime ?? 0) - 0.05 &&
              currentTimeSeconds <= (char.startTime ?? 0) + (char.duration ?? 999999) + 0.05
            )
          );
          if (!isTimeVisible) return null;

          const charData = AUTODRAFT_CHARACTERS.find((c) => c.id === char.characterId) || AUTODRAFT_CHARACTERS[0];

          // Motion Path Interpolation during playback
          let curX = char.x;
          let curY = char.y;
          let curScale = char.scale || 1.0;

          if (char.motionPath) {
            const dur = char.motionPath.duration || 5;
            const delay = char.motionPath.delay || 0;
            const t = Math.max(0, (currentTimeSeconds || 0) - delay);
            // Continuous loop through duration
            const progress = dur > 0 ? (t % dur) / dur : 0;
            curX = char.motionPath.startX + (char.motionPath.endX - char.motionPath.startX) * progress;
            curY = char.motionPath.startY + (char.motionPath.endY - char.motionPath.startY) * progress;
            if (char.motionPath.startScale !== undefined && char.motionPath.endScale !== undefined) {
              curScale = char.motionPath.startScale + (char.motionPath.endScale - char.motionPath.startScale) * progress;
            }
          }

          const isPercent = curX <= 100;
          const leftVal = isPercent ? `${curX}%` : `${curX}px`;
          const topVal = isPercent ? `${curY}%` : `${curY}px`;
          const rotVal = char.rotation || 0;
          const flipVal = char.flipH ? -1 : 1;

          // Compute filters
          const filters = char.filters || { brightness: 100, contrast: 100, saturation: 100, opacity: 100 };
          const filterStyle = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) opacity(${filters.opacity / 100})`;

          // Compute mask
          let clipPath = 'none';
          if (char.mask === 'circle') clipPath = 'circle(48% at 50% 50%)';
          else if (char.mask === 'rounded') clipPath = 'inset(0% round 24px)';
          else if (char.mask === 'horizon') clipPath = 'inset(0% 0% 35% 0%)';

          return (
            <div
              key={char.instanceId}
              data-character-instance-id={char.instanceId}
              onMouseDown={(e) => {
                if (char.isLocked) return;
                handleCharMouseDown(e, char);
              }}
              onClick={(e) => {
                if (char.isLocked) return;
                e.stopPropagation();
                onSelectCharacterInstance(char.instanceId);
                onSelectMediaInstance?.(null);
              }}
              style={{
                left: leftVal,
                top: topVal,
                transform: `${isPercent ? 'translate(-50%, -50%) ' : ''}rotate(${rotVal}deg) scale(${curScale})`,
                transformOrigin: 'center center',
                zIndex: char.zIndex || 20
              }}
              className={`absolute select-none p-1 transition-transform duration-75 flex items-center justify-center group ${
                char.isLocked ? 'pointer-events-none' : 'cursor-move'
              } ${
                isSelected && !char.isLocked ? 'border border-[#93c5fd] shadow-sm' : ''
              }`}
            >
              {/* Character Wrapper with Flip, Filters, and Mask */}
              <div
                style={{
                  transform: `scaleX(${flipVal})`,
                  filter: filterStyle,
                  clipPath: clipPath
                }}
                className="relative flex items-center justify-center"
              >
                <ErrorBoundary
                  fallback={
                    <div className="w-28 h-36 flex flex-col items-center justify-center bg-gray-800/40 rounded border border-gray-600/30 text-gray-300 text-[10px] p-2">
                      <span>{charData.name}</span>
                      <span className="text-gray-500 text-[9px] mt-1">{char.action}</span>
                    </div>
                  }
                >
                  <CharacterAvatarPreview
                    character={charData}
                    angle={char.angle}
                    action={char.action}
                    jsonUrl={char.jsonUrl}
                    isPlaying={isPlaying}
                    currentTimeSeconds={currentTimeSeconds}
                    scale={1.0}
                  />
                </ErrorBoundary>

                {/* ===================================================== */}
                {/* ATTACHED PROPS (SLOT OVERLAYS)                        */}
                {/* ===================================================== */}
                {char.props && (
                  <>
                    {/* Head Prop (Crown, Cap, Glasses) */}
                    {char.props.head && (
                      <div
                        className="absolute top-[6%] left-1/2 -translate-x-1/2 pointer-events-none drop-shadow-md z-30"
                        style={{ transform: 'scale(0.9)' }}
                      >
                        <img
                          src={AUTODRAFT_PROPS.find((p) => p.id === char.props?.head)?.imageUrl}
                          alt="Head Prop"
                          crossOrigin="anonymous"
                          data-prop="true"
                          className="w-12 h-12 object-contain"
                        />
                      </div>
                    )}

                    {/* Left Hand Prop (Lantern, Torch, Bag) */}
                    {char.props.left_hand && (
                      <div
                        className="absolute top-[46%] left-[18%] pointer-events-none drop-shadow-md z-30"
                        style={{ transform: 'scale(0.85)' }}
                      >
                        <img
                          src={AUTODRAFT_PROPS.find((p) => p.id === char.props?.left_hand)?.imageUrl}
                          alt="Left Hand Prop"
                          crossOrigin="anonymous"
                          data-prop="true"
                          className="w-11 h-14 object-contain"
                        />
                      </div>
                    )}

                    {/* Right Hand Prop (Staff, Sword, Trident, Bag) */}
                    {char.props.right_hand && (
                      <div
                        className="absolute top-[44%] right-[16%] pointer-events-none drop-shadow-md z-30"
                        style={{ transform: 'scale(0.85)' }}
                      >
                        <img
                          src={AUTODRAFT_PROPS.find((p) => p.id === char.props?.right_hand)?.imageUrl}
                          alt="Right Hand Prop"
                          crossOrigin="anonymous"
                          data-prop="true"
                          className="w-11 h-16 object-contain"
                        />
                      </div>
                    )}

                    {/* Torso Prop (Garland, Necklace, Badge) */}
                    {char.props.torso && (
                      <div
                        className="absolute top-[34%] left-1/2 -translate-x-1/2 pointer-events-none drop-shadow-md z-30"
                        style={{ transform: 'scale(0.85)' }}
                      >
                        <img
                          src={AUTODRAFT_PROPS.find((p) => p.id === char.props?.torso)?.imageUrl}
                          alt="Torso Prop"
                          crossOrigin="anonymous"
                          data-prop="true"
                          className="w-12 h-12 object-contain"
                        />
                      </div>
                    )}

                    {/* Back Prop (Sack, Backpack) */}
                    {char.props.back && (
                      <div
                        className="absolute top-[34%] right-[10%] pointer-events-none drop-shadow-md z-10"
                        style={{ transform: 'scale(0.9)' }}
                      >
                        <img
                          src={AUTODRAFT_PROPS.find((p) => p.id === char.props?.back)?.imageUrl}
                          alt="Back Prop"
                          crossOrigin="anonymous"
                          data-prop="true"
                          className="w-14 h-14 object-contain"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ===================================================== */}
              {/* INTERACTIVE 8-POINT BOUNDING BOX RESIZER & ROTATION   */}
              {/* ===================================================== */}
              {isSelected && !char.isLocked && (
                <>
                  {/* Top Stem Line */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-[1.5px] h-7 bg-[#7ea5f8] pointer-events-none" />

                  {/* Top Rotation Handle (Circle Dot) */}
                  <div
                    onMouseDown={(e) => handleRotateMouseDown(e, char)}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -top-9 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#7ea5f8] shadow-md cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-30"
                    title="Drag to Rotate Character"
                  />

                  {/* 4 Corner Handles (Uniform Proportional Resizing) */}
                  <div
                    onMouseDown={(e) => handleScaleMouseDown(e, char, 'scale-tl')}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#7ea5f8] rounded-full shadow-sm cursor-nwse-resize hover:scale-125 transition-transform z-30"
                    title="Drag to Resize"
                  />
                  <div
                    onMouseDown={(e) => handleScaleMouseDown(e, char, 'scale-tr')}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#7ea5f8] rounded-full shadow-sm cursor-nesw-resize hover:scale-125 transition-transform z-30"
                    title="Drag to Resize"
                  />
                  <div
                    onMouseDown={(e) => handleScaleMouseDown(e, char, 'scale-bl')}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#7ea5f8] rounded-full shadow-sm cursor-nesw-resize hover:scale-125 transition-transform z-30"
                    title="Drag to Resize"
                  />
                  <div
                    onMouseDown={(e) => handleScaleMouseDown(e, char, 'scale-br')}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#7ea5f8] rounded-full shadow-sm cursor-nwse-resize hover:scale-125 transition-transform z-30"
                    title="Drag to Resize"
                  />

                  {/* 4 Edge Midpoint Handles (Edge Extension / Shrink) */}
                  <div
                    onMouseDown={(e) => handleScaleMouseDown(e, char, 'scale-edge')}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-2 border-[#7ea5f8] rounded-full shadow-sm cursor-ns-resize hover:scale-125 transition-transform z-30"
                    title="Drag to Resize"
                  />
                  <div
                    onMouseDown={(e) => handleScaleMouseDown(e, char, 'scale-edge')}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-2 border-[#7ea5f8] rounded-full shadow-sm cursor-ns-resize hover:scale-125 transition-transform z-30"
                    title="Drag to Resize"
                  />
                  <div
                    onMouseDown={(e) => handleScaleMouseDown(e, char, 'scale-edge')}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-white border-2 border-[#7ea5f8] rounded-full shadow-sm cursor-ew-resize hover:scale-125 transition-transform z-30"
                    title="Drag to Resize"
                  />
                  <div
                    onMouseDown={(e) => handleScaleMouseDown(e, char, 'scale-edge')}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-white border-2 border-[#7ea5f8] rounded-full shadow-sm cursor-ew-resize hover:scale-125 transition-transform z-30"
                    title="Drag to Resize"
                  />
                </>
              )}
            </div>
          );
        })}

        {/* ============================================================ */}
        {/* VISUAL OVERLAY EFFECTS & TRANSITIONS (AUTODRAFT HAR ASSETS)   */}
        {/* ============================================================ */}
        {activeEffects && activeEffects.map((ef) => (
          <div
            key={ef.id}
            data-effect-overlay="true"
            className="absolute inset-0 pointer-events-none z-25 overflow-hidden"
            style={{
              mixBlendMode: ef.blendMode === 'SCREEN' ? 'screen' : ef.blendMode === 'MULTIPLY' ? 'multiply' : 'normal',
              opacity: ef.opacity ?? 0.8
            }}
          >
            {ef.s3Url.endsWith('.webm') || ef.s3Url.endsWith('.mp4') ? (
              <video
                src={ef.s3Url}
                crossOrigin="anonymous"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={ef.s3Url}
                alt={ef.title}
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ))}
      </div>

      {/* Floating Canvas Controls (Bottom Right) */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-[#1b1f2b]/90 backdrop-blur border border-[#2d3345] px-3 py-1.5 rounded-lg shadow-xl text-gray-300 z-30">
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
          className="p-1 hover:text-white rounded hover:bg-[#252b3b]"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Zoom Slider */}
        <input
          type="range"
          min="0.5"
          max="1.8"
          step="0.05"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-20 accent-blue-500 h-1 bg-gray-700 rounded cursor-pointer"
        />

        <button
          onClick={() => setZoom((z) => Math.min(1.8, z + 0.1))}
          className="p-1 hover:text-white rounded hover:bg-[#252b3b]"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-gray-700" />

        <button
          onClick={() => setZoom(1.0)}
          className="p-1 hover:text-white rounded hover:bg-[#252b3b]"
          title="Reset Zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setZoom(1.4)}
          className="p-1 hover:text-white rounded hover:bg-[#252b3b]"
          title="Maximize"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
