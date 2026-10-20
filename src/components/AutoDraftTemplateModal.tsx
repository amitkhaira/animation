import React, { useState, useMemo } from 'react';
import { X, Search, Plus, Check, Image as ImageIcon } from 'lucide-react';
import { AUTODRAFT_TEMPLATES } from '../data/autodraftData';
import { SceneTemplate } from '../types/autodraft';

interface AutoDraftTemplateModalProps {
  isOpen: boolean;
  selectedTemplateId: string;
  onClose: () => void;
  onApplyTemplate: (template: SceneTemplate | null) => void;
}

export const AutoDraftTemplateModal: React.FC<AutoDraftTemplateModalProps> = ({
  isOpen,
  selectedTemplateId,
  onClose,
  onApplyTemplate
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All Templates');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [chosenId, setChosenId] = useState<string>(selectedTemplateId);
  const [visibleCount, setVisibleCount] = useState<number>(30);

  const categories = [
    'All Templates',
    'Village',
    'Horror',
    'Moral',
    'Office',
    'Story',
    'Explainer',
    'Kids',
    'Fairy Tales'
  ];

  const pillTags = [
    'Village',
    'City',
    'Horror',
    'Moral',
    'Rhyme',
    'Animal',
    'Bird',
    'Fairy tales',
    'Village interior',
    'Village exterior',
    'Intro',
    'Opening scene',
    'Seasonal'
  ];

  // Calculate count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All Templates': AUTODRAFT_TEMPLATES.length };
    for (const t of AUTODRAFT_TEMPLATES) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return counts;
  }, []);

  const filteredTemplates = useMemo(() => {
    return AUTODRAFT_TEMPLATES.filter((tpl) => {
      const matchesCategory =
        activeCategory === 'All Templates' || tpl.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tpl.tags && tpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchesTag = !activeTag || (tpl.tags && tpl.tags.includes(activeTag));
      return matchesCategory && matchesSearch && matchesTag;
    });
  }, [activeCategory, searchQuery, activeTag]);

  const displayedTemplates = useMemo(() => {
    return filteredTemplates.slice(0, visibleCount);
  }, [filteredTemplates, visibleCount]);

  const handleApply = () => {
    if (chosenId === 'blank') {
      onApplyTemplate(null);
    } else {
      const selected = AUTODRAFT_TEMPLATES.find((t) => t.id === chosenId) || AUTODRAFT_TEMPLATES[0];
      onApplyTemplate(selected);
    }
    onClose();
  };

  // Safe early return placed AFTER all hooks
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#181b24] border border-[#2d3345] rounded-xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-3.5 border-b border-[#2d3345] flex items-center justify-between bg-[#14161f]">
          <div className="flex items-center space-x-3">
            <h2 className="text-sm font-bold text-white tracking-wide">
              Use Templates To Create Project Faster
            </h2>
            <span className="text-[11px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
              {AUTODRAFT_TEMPLATES.length} AutoDraft Scenes
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#252a38] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Categories Sidebar */}
          <div className="w-52 border-r border-[#2d3345] bg-[#14161f] p-3 flex flex-col space-y-1 overflow-y-auto">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1 mb-1">
              GENRES
            </span>
            {categories.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setActiveTag(null);
                    setVisibleCount(30);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-white text-gray-900 shadow-sm font-bold'
                      : 'text-gray-300 hover:bg-[#232736] hover:text-white'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-gray-200 text-gray-900'
                        : 'bg-[#222736] text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Search & Grid Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#181b24] p-5">
            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={`Search across ${filteredTemplates.length} scenes (e.g. Village, Horror, Night, Market)...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(30);
                }}
                className="w-full bg-[#10121a] border border-[#2d3345] text-white text-xs rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder:text-gray-500"
              />
            </div>

            {/* Quick Tag Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
              {pillTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setActiveTag(activeTag === tag ? null : tag);
                    setVisibleCount(30);
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all ${
                    activeTag === tag
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-[#222736] text-gray-300 hover:bg-[#2c3245] hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Grid Count & Info Bar */}
            <div className="flex items-center justify-between pb-2 text-[11px] text-gray-400">
              <span>
                Showing {Math.min(visibleCount, filteredTemplates.length)} of{' '}
                {filteredTemplates.length} Scenes
              </span>
              {chosenId !== 'blank' && (
                <span className="text-blue-400 font-semibold">
                  Selected: {AUTODRAFT_TEMPLATES.find((t) => t.id === chosenId)?.name || chosenId}
                </span>
              )}
            </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-3 gap-3.5 pb-4">
                {/* 1. Blank Scene Card */}
                <div
                  onClick={() => setChosenId('blank')}
                  className={`aspect-video rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all relative ${
                    chosenId === 'blank'
                      ? 'border-blue-500 bg-blue-950/20 shadow-md shadow-blue-500/20'
                      : 'border-[#2d3345] bg-[#12141c] hover:border-gray-500 hover:bg-[#161a26]'
                  }`}
                >
                  {chosenId === 'blank' && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white shadow">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-full bg-[#222736] flex items-center justify-center text-gray-300 mb-2 group-hover:scale-105 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-white">Blank Scene</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">Start from scratch</span>
                </div>

                {/* Template Cards */}
                {displayedTemplates.map((tpl) => {
                  const isSelected = chosenId === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setChosenId(tpl.id)}
                      className="group cursor-pointer flex flex-col"
                    >
                      <div
                        className={`aspect-video rounded-xl border-2 overflow-hidden relative transition-all bg-[#0f1118] flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-500 shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/40'
                            : 'border-[#2d3345] group-hover:border-gray-400'
                        }`}
                      >
                        {tpl.thumbnailUrl ? (
                          <img
                            src={tpl.thumbnailUrl}
                            alt={tpl.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none pointer-events-none"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.opacity = '0.3';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#1e2538] to-[#11131c] flex flex-col items-center justify-center text-gray-500">
                            <ImageIcon className="w-6 h-6 mb-1 opacity-60" />
                            <span className="text-[10px] font-semibold">{tpl.name}</span>
                          </div>
                        )}

                        {/* Category & Badge */}
                        <div className="absolute top-2 left-2 flex items-center space-x-1">
                          <span className="text-[9px] font-bold text-white bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded shadow">
                            {tpl.category}
                          </span>
                        </div>

                        {/* Selected Checkmark Badge */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md">
                            <Check className="w-3 h-3" />
                          </div>
                        )}

                        {/* Bottom Gradient Overlay for Title Clarity */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-4">
                          <span className="text-xs font-bold text-white truncate block group-hover:text-blue-300 transition-colors drop-shadow">
                            {tpl.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Button if remaining */}
              {visibleCount < filteredTemplates.length && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 30)}
                    className="px-5 py-2 rounded-lg bg-[#222738] hover:bg-[#2c3348] text-xs font-bold text-white border border-[#3b435c] transition-all"
                  >
                    Load More Scenes ({filteredTemplates.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Action */}
        <div className="px-6 py-3.5 border-t border-[#2d3345] bg-[#14161f] flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Select a template or blank scene to open in the AutoDraft Studio.
          </span>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#252a38] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 active:scale-95"
            >
              Apply Scene
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
