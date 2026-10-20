import React, { useState } from 'react';
import { X, Search, Sparkles, Sliders, Layers, Eye, Check, Plus, Trash2 } from 'lucide-react';
import { VisualOverlayEffect } from '../types/audio';
import { AUTODRAFT_OFFICIAL_EFFECTS } from '../data/autodraftEffectsData';

interface AutoDraftEffectsDrawerProps {
  onClose: () => void;
  activeEffects: VisualOverlayEffect[];
  onAddEffect: (effect: VisualOverlayEffect) => void;
  onRemoveEffect: (effectId: string | number) => void;
  onUpdateEffectOpacity: (effectId: string | number, opacity: number) => void;
}

export const AutoDraftEffectsDrawer: React.FC<AutoDraftEffectsDrawerProps> = ({
  onClose,
  activeEffects,
  onAddEffect,
  onRemoveEffect,
  onUpdateEffectOpacity
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'overlay' | 'filter' | 'transition'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEffects = AUTODRAFT_OFFICIAL_EFFECTS.filter((ef) => {
    const matchesCat =
      activeCategory === 'all' ||
      (activeCategory === 'overlay' && ef.type === 'overlay-effect') ||
      (activeCategory === 'filter' && ef.type === 'filter') ||
      (activeCategory === 'transition' && ef.type === 'transition');

    const matchesSearch =
      searchQuery.trim() === '' ||
      ef.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ef.tags && ef.tags.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCat && matchesSearch;
  });

  return (
    <div className="w-80 bg-[#141620] border-r border-[#262a38] flex flex-col h-full select-none z-20 shadow-xl">
      {/* 1. Header */}
      <div className="h-12 border-b border-[#262a38] px-4 flex items-center justify-between bg-[#181b26]">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-white tracking-wide">Effects & Overlays</span>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
            {AUTODRAFT_OFFICIAL_EFFECTS.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#252a38] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Search & Category Filter Pills */}
      <div className="p-3 border-b border-[#262a38] space-y-2.5 bg-[#12141c]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search smoke, rain, glow, wipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1d2b] border border-[#2d3345] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-2.5 py-1 rounded-full font-medium shrink-0 transition-all ${
              activeCategory === 'all'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-[#1e2230] text-gray-400 hover:text-white'
            }`}
          >
            All ({AUTODRAFT_OFFICIAL_EFFECTS.length})
          </button>
          <button
            onClick={() => setActiveCategory('overlay')}
            className={`px-2.5 py-1 rounded-full font-medium shrink-0 transition-all ${
              activeCategory === 'overlay'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-[#1e2230] text-gray-400 hover:text-white'
            }`}
          >
            Overlays (266)
          </button>
          <button
            onClick={() => setActiveCategory('filter')}
            className={`px-2.5 py-1 rounded-full font-medium shrink-0 transition-all ${
              activeCategory === 'filter'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-[#1e2230] text-gray-400 hover:text-white'
            }`}
          >
            Filters (3)
          </button>
          <button
            onClick={() => setActiveCategory('transition')}
            className={`px-2.5 py-1 rounded-full font-medium shrink-0 transition-all ${
              activeCategory === 'transition'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-[#1e2230] text-gray-400 hover:text-white'
            }`}
          >
            Transitions (32)
          </button>
        </div>
      </div>

      {/* 3. Active Effects on Stage */}
      {activeEffects.length > 0 && (
        <div className="p-3 border-b border-[#262a38] bg-amber-950/20">
          <div className="text-[10px] uppercase font-bold text-amber-400 mb-2 flex items-center justify-between">
            <span>Active Effects on Stage ({activeEffects.length})</span>
          </div>
          <div className="space-y-2">
            {activeEffects.map((ef) => (
              <div
                key={ef.id}
                className="bg-[#1a1d2b] border border-amber-500/40 rounded-lg p-2 flex flex-col space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-200 truncate max-w-[170px]">
                    {ef.title}
                  </span>
                  <button
                    onClick={() => onRemoveEffect(ef.id)}
                    className="text-gray-400 hover:text-red-400 p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>Opacity</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ef.opacity ?? 0.8}
                    onChange={(e) => onUpdateEffectOpacity(ef.id, parseFloat(e.target.value))}
                    className="w-24 h-1 accent-amber-500 bg-gray-700 rounded cursor-pointer"
                  />
                  <span className="font-mono text-amber-300 w-8 text-right">
                    {Math.round((ef.opacity ?? 0.8) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Effects List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          {filteredEffects.map((effect) => {
            const isApplied = activeEffects.some((e) => e.id === effect.id);

            return (
              <div
                key={effect.id}
                onClick={() => {
                  if (isApplied) {
                    onRemoveEffect(effect.id);
                  } else {
                    onAddEffect({ ...effect, opacity: 0.8 });
                  }
                }}
                className={`group rounded-lg border p-2 flex flex-col cursor-pointer transition-all hover:scale-[1.02] ${
                  isApplied
                    ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-900/20'
                    : 'bg-[#10121a] hover:bg-[#181b26] border-[#262a38]'
                }`}
              >
                {/* Thumbnail Preview */}
                <div className="w-full h-20 bg-black/50 rounded overflow-hidden relative mb-1.5 flex items-center justify-center border border-[#222736]">
                  {effect.thumbnailUrl ? (
                    <img
                      src={effect.thumbnailUrl}
                      alt={effect.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                      onError={(e) => {
                        // fallback placeholder
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Sparkles className="w-6 h-6 text-amber-500/50" />
                  )}
                  {isApplied && (
                    <div className="absolute top-1 right-1 bg-amber-500 text-black rounded-full p-0.5 shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 text-[8px] font-mono uppercase bg-black/80 px-1 py-0.2 rounded text-gray-300">
                    {effect.blendMode}
                  </span>
                </div>

                <div className="truncate text-xs font-semibold text-gray-200 group-hover:text-amber-300">
                  {effect.title}
                </div>
                <div className="text-[9px] text-gray-500 capitalize">
                  {effect.type.replace('-', ' ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
