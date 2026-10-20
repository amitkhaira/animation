import React, { useState } from 'react';
import {
  FlipHorizontal,
  Route,
  Gauge,
  Sparkles,
  CircleDot,
  Sliders,
  Glasses,
  ArrowUpDown,
  Trash2,
  X,
  Play,
  Check
} from 'lucide-react';
import { ActiveCanvasCharacter } from '../types/autodraft';

interface AutoDraftSelectionToolbarProps {
  selectedCharacter: ActiveCanvasCharacter;
  onFlip: () => void;
  onDelete: () => void;
  onUpdateSpeed: (speed: number) => void;
  onUpdateAdjust: (filters: {
    brightness: number;
    contrast: number;
    saturation: number;
    hue: number;
    opacity: number;
  }) => void;
  onUpdateMask: (mask: 'none' | 'circle' | 'rounded' | 'horizon') => void;
  onUpdatePath: (path: {
    type: 'linear' | 'arc' | 'wave' | 'custom';
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | undefined) => void;
  onSort: (action: 'front' | 'back' | 'forward' | 'backward') => void;
  onOpenProps: () => void;
  onAIAnimate?: (prompt: string) => void;
}

type ActivePopover = 'path' | 'speed' | 'ai' | 'mask' | 'adjust' | 'sort' | null;

export const AutoDraftSelectionToolbar: React.FC<AutoDraftSelectionToolbarProps> = ({
  selectedCharacter,
  onFlip,
  onDelete,
  onUpdateSpeed,
  onUpdateAdjust,
  onUpdateMask,
  onUpdatePath,
  onSort,
  onOpenProps,
  onAIAnimate
}) => {
  const [activePopover, setActivePopover] = useState<ActivePopover>(null);
  const [aiPrompt, setAiPrompt] = useState('');

  const currentFilters = selectedCharacter.filters || {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    opacity: 100
  };

  const togglePopover = (p: ActivePopover) => {
    setActivePopover((cur) => (cur === p ? null : p));
  };

  return (
    <div className="relative flex flex-col items-center select-none z-40">
      {/* ------------------------------------------------------------- */}
      {/* FLOATING CONTEXT TOOLBAR (EXACT MATCH SCREENSHOT 1)           */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center space-x-1 bg-[#161822]/95 backdrop-blur-md border border-[#2b3042] px-2.5 py-1.5 rounded-xl shadow-2xl text-xs text-gray-200">
        {/* 1. Flip */}
        <button
          onClick={onFlip}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#252b3d] transition-colors ${
            selectedCharacter.flipH ? 'bg-blue-600/30 text-blue-300 font-semibold' : 'text-gray-300'
          }`}
          title="Flip Horizontally"
        >
          <FlipHorizontal className="w-3.5 h-3.5 text-gray-300" />
          <span className="font-medium text-[11px]">Flip</span>
        </button>

        {/* 2. Path */}
        <button
          onClick={() => togglePopover('path')}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#252b3d] transition-colors ${
            activePopover === 'path' || selectedCharacter.motionPath
              ? 'bg-blue-600/30 text-blue-300 font-semibold'
              : 'text-gray-300'
          }`}
          title="Motion Path"
        >
          <Route className="w-3.5 h-3.5 text-gray-300" />
          <span className="font-medium text-[11px]">Path</span>
        </button>

        {/* 3. Speed */}
        <button
          onClick={() => togglePopover('speed')}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#252b3d] transition-colors ${
            activePopover === 'speed' ? 'bg-blue-600/30 text-blue-300 font-semibold' : 'text-gray-300'
          }`}
          title="Animation Speed"
        >
          <Gauge className="w-3.5 h-3.5 text-gray-300" />
          <span className="font-medium text-[11px]">
            Speed {selectedCharacter.speed && selectedCharacter.speed !== 1 ? `(${selectedCharacter.speed}x)` : ''}
          </span>
        </button>

        {/* 4. AI Animate */}
        <button
          onClick={() => togglePopover('ai')}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#252b3d] transition-colors ${
            activePopover === 'ai' ? 'bg-purple-600/30 text-purple-300 font-semibold' : 'text-gray-300'
          }`}
          title="AI Animate Generator"
        >
          <Sparkles className="w-3.5 h-3.5 text-gray-300" />
          <span className="font-medium text-[11px]">AI Animate</span>
        </button>

        {/* 5. Mask */}
        <button
          onClick={() => togglePopover('mask')}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#252b3d] transition-colors ${
            activePopover === 'mask' || (selectedCharacter.mask && selectedCharacter.mask !== 'none')
              ? 'bg-blue-600/30 text-blue-300 font-semibold'
              : 'text-gray-300'
          }`}
          title="Shape Mask"
        >
          <CircleDot className="w-3.5 h-3.5 text-gray-300" />
          <span className="font-medium text-[11px]">Mask</span>
        </button>

        {/* 6. Adjust */}
        <button
          onClick={() => togglePopover('adjust')}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#252b3d] transition-colors ${
            activePopover === 'adjust' ? 'bg-blue-600/30 text-blue-300 font-semibold' : 'text-gray-300'
          }`}
          title="Color & Filter Adjustments"
        >
          {/* Multi-color Adjust circular icon matching screenshot */}
          <div className="w-3.5 h-3.5 rounded-full p-[1px] bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#161822] flex items-center justify-center">
              <Sliders className="w-2.5 h-2.5 text-amber-300" />
            </div>
          </div>
          <span className="font-medium text-[11px]">Adjust</span>
        </button>

        {/* 7. Props */}
        <button
          onClick={onOpenProps}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#252b3d] transition-colors text-gray-300"
          title="Add Props & Accessories"
        >
          <Glasses className="w-3.5 h-3.5 text-gray-300" />
          <span className="font-medium text-[11px]">Props</span>
          {selectedCharacter.props && Object.keys(selectedCharacter.props).length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 -ml-0.5" />
          )}
        </button>

        {/* 8. Sort */}
        <button
          onClick={() => togglePopover('sort')}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#252b3d] transition-colors ${
            activePopover === 'sort' ? 'bg-blue-600/30 text-blue-300 font-semibold' : 'text-gray-300'
          }`}
          title="Layer Z-Order"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-300" />
          <span className="font-medium text-[11px]">Sort</span>
        </button>

        {/* 9. Delete */}
        <button
          onClick={onDelete}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-red-950/40 transition-colors"
          title="Delete from Canvas"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          <span className="font-medium text-[11px]">Delete</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE POPOVERS                                          */}
      {/* ------------------------------------------------------------- */}

      {/* Speed Popover */}
      {activePopover === 'speed' && (
        <div className="absolute top-11 bg-[#161822] border border-[#2c3246] rounded-xl p-3 shadow-2xl w-64 text-xs text-white z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-[#252a3b] mb-2.5">
            <span className="font-semibold text-gray-200">Animation Speed</span>
            <button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => onUpdateSpeed(s)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                  (selectedCharacter.speed || 1.0) === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[#222736] text-gray-300 hover:bg-[#2c3248]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.05"
            value={selectedCharacter.speed || 1.0}
            onChange={(e) => onUpdateSpeed(parseFloat(e.target.value))}
            className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded cursor-pointer"
          />
        </div>
      )}

      {/* Path Popover */}
      {activePopover === 'path' && (
        <div className="absolute top-11 bg-[#161822] border border-[#2c3246] rounded-xl p-3 shadow-2xl w-64 text-xs text-white z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-[#252a3b] mb-2.5">
            <span className="font-semibold text-gray-200">Motion Path</span>
            <button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5">
            {[
              { id: 'none', label: 'None (Stationary)' },
              { id: 'linear', label: 'Straight Line (Left to Right)' },
              { id: 'arc', label: 'Curved Arc' },
              { id: 'wave', label: 'Wave Motion' }
            ].map((p) => {
              const isActive = p.id === 'none' ? !selectedCharacter.motionPath : selectedCharacter.motionPath?.type === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (p.id === 'none') {
                      onUpdatePath(undefined);
                    } else {
                      onUpdatePath({
                        type: p.id as any,
                        startX: selectedCharacter.x,
                        startY: selectedCharacter.y,
                        endX: selectedCharacter.x + 30,
                        endY: selectedCharacter.y
                      });
                    }
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[11px] transition-colors ${
                    isActive ? 'bg-blue-600 text-white font-medium' : 'bg-[#1f2433] text-gray-300 hover:bg-[#282f42]'
                  }`}
                >
                  <span>{p.label}</span>
                  {isActive && <Check className="w-3 h-3 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Adjust Popover */}
      {activePopover === 'adjust' && (
        <div className="absolute top-11 bg-[#161822] border border-[#2c3246] rounded-xl p-3 shadow-2xl w-72 text-xs text-white z-50 animate-in fade-in zoom-in-95 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#252a3b]">
            <span className="font-semibold text-gray-200">Visual Adjustments</span>
            <button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Brightness */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Brightness</span>
              <span>{currentFilters.brightness}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="170"
              value={currentFilters.brightness}
              onChange={(e) =>
                onUpdateAdjust({ ...currentFilters, brightness: parseInt(e.target.value) })
              }
              className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded"
            />
          </div>

          {/* Contrast */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Contrast</span>
              <span>{currentFilters.contrast}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="160"
              value={currentFilters.contrast}
              onChange={(e) =>
                onUpdateAdjust({ ...currentFilters, contrast: parseInt(e.target.value) })
              }
              className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded"
            />
          </div>

          {/* Saturation */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Saturation</span>
              <span>{currentFilters.saturation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={currentFilters.saturation}
              onChange={(e) =>
                onUpdateAdjust({ ...currentFilters, saturation: parseInt(e.target.value) })
              }
              className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded"
            />
          </div>

          {/* Opacity */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Opacity</span>
              <span>{currentFilters.opacity}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={currentFilters.opacity}
              onChange={(e) =>
                onUpdateAdjust({ ...currentFilters, opacity: parseInt(e.target.value) })
              }
              className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded"
            />
          </div>

          <button
            onClick={() =>
              onUpdateAdjust({
                brightness: 100,
                contrast: 100,
                saturation: 100,
                hue: 0,
                opacity: 100
              })
            }
            className="w-full py-1 text-[10px] text-gray-400 hover:text-white bg-[#222736] rounded"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Mask Popover */}
      {activePopover === 'mask' && (
        <div className="absolute top-11 bg-[#161822] border border-[#2c3246] rounded-xl p-3 shadow-2xl w-56 text-xs text-white z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-[#252a3b] mb-2">
            <span className="font-semibold text-gray-200">Shape Mask</span>
            <button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            {[
              { id: 'none', label: 'None (Full View)' },
              { id: 'circle', label: 'Circle Mask' },
              { id: 'rounded', label: 'Rounded Box' },
              { id: 'horizon', label: 'Horizon Cut (Half Body)' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => onUpdateMask(m.id as any)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[11px] transition-colors ${
                  (selectedCharacter.mask || 'none') === m.id
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-[#1f2433] text-gray-300 hover:bg-[#282f42]'
                }`}
              >
                <span>{m.label}</span>
                {(selectedCharacter.mask || 'none') === m.id && <Check className="w-3 h-3 text-white" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sort Popover */}
      {activePopover === 'sort' && (
        <div className="absolute top-11 bg-[#161822] border border-[#2c3246] rounded-xl p-2 shadow-2xl w-48 text-xs text-white z-50 animate-in fade-in zoom-in-95 space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-gray-400 text-[10px] font-bold uppercase">
            <span>Layer Order</span>
            <button onClick={() => setActivePopover(null)}>
              <X className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={() => onSort('front')}
            className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#232838] text-[11px] text-gray-200"
          >
            Bring to Front
          </button>
          <button
            onClick={() => onSort('forward')}
            className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#232838] text-[11px] text-gray-200"
          >
            Bring Forward
          </button>
          <button
            onClick={() => onSort('backward')}
            className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#232838] text-[11px] text-gray-200"
          >
            Send Backward
          </button>
          <button
            onClick={() => onSort('back')}
            className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#232838] text-[11px] text-gray-200"
          >
            Send to Back
          </button>
        </div>
      )}

      {/* AI Animate Popover */}
      {activePopover === 'ai' && (
        <div className="absolute top-11 bg-[#161822] border border-[#2c3246] rounded-xl p-3.5 shadow-2xl w-80 text-xs text-white z-50 animate-in fade-in zoom-in-95 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#252a3b]">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-semibold text-gray-200">AI Prompt Motion</span>
            </div>
            <button onClick={() => setActivePopover(null)} className="text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[10px] text-gray-400 leading-relaxed">
            Describe the action or emotion for this character. AutoDraft AI keyframing will apply corresponding kinematics.
          </p>

          <input
            type="text"
            placeholder="e.g. Walk happily to the left with hand wave..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="w-full bg-[#0f1118] border border-[#2b3042] text-xs rounded-lg px-3 py-2 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
          />

          <div className="flex flex-wrap gap-1">
            {['Walk gracefully', 'Namaste greeting', 'Run excitedly', 'Sit on floor'].map((s) => (
              <button
                key={s}
                onClick={() => setAiPrompt(s)}
                className="px-2 py-0.5 rounded bg-[#202535] text-[9px] text-gray-300 hover:bg-purple-900/40 hover:text-purple-300"
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (onAIAnimate && aiPrompt.trim()) {
                onAIAnimate(aiPrompt);
                setActivePopover(null);
              }
            }}
            className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-purple-600/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Motion</span>
          </button>
        </div>
      )}
    </div>
  );
};
