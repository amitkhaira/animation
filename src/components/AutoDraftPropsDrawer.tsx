import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  Search,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Check
} from 'lucide-react';
import { AUTODRAFT_PROPS, PROP_SLOTS, PropSlotKey, AutoDraftProp } from '../data/autodraftProps';
import { ActiveCanvasCharacter } from '../types/autodraft';

interface AutoDraftPropsDrawerProps {
  selectedCharacter: ActiveCanvasCharacter;
  onClose: () => void;
  onAttachProp: (slot: PropSlotKey, propId: string) => void;
  onRemoveProp: (slot: PropSlotKey) => void;
}

export const AutoDraftPropsDrawer: React.FC<AutoDraftPropsDrawerProps> = ({
  selectedCharacter,
  onClose,
  onAttachProp,
  onRemoveProp
}) => {
  const [activeSlot, setActiveSlot] = useState<PropSlotKey | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [propTab, setPropTab] = useState<'Normal Props' | 'Generated Props'>('Normal Props');

  const attachedProps = selectedCharacter.props || {};

  // Filtered props for active slot
  const filteredProps = AUTODRAFT_PROPS.filter((p) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = p.category === propTab;
    return matchesSearch && matchesTab;
  });

  const activeSlotInfo = PROP_SLOTS.find((s) => s.key === activeSlot);

  return (
    <div className="w-80 bg-[#161821] border-r border-[#262a38] flex flex-col h-full select-none text-white z-30 shadow-2xl">
      {/* ============================================================= */}
      {/* VIEW 1: PROPS SLOTS LIST (SCREENSHOT 2)                       */}
      {/* ============================================================= */}
      {!activeSlot && (
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-[#262a38] flex items-center justify-between bg-[#131622]">
            <h3 className="text-base font-bold text-white tracking-wide">Props</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#222736] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3.5 space-y-3.5 flex-1">
            {/* AI Asset Generator Banner (Exact from Screenshot 2) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-700 to-purple-800 p-4 text-white shadow-lg border border-indigo-500/30">
              <div className="relative z-10 max-w-[65%] space-y-1">
                <h4 className="text-sm font-extrabold tracking-tight text-white leading-tight">
                  Ai Png Asset Generator
                </h4>
                <p className="text-[11px] text-indigo-200">No Background Asset</p>
                <button className="mt-2.5 px-3.5 py-1.5 bg-white text-indigo-950 font-bold text-xs rounded-lg shadow hover:bg-gray-100 transition-colors">
                  Generate Now
                </button>
              </div>
              {/* Decorative mini preview graphic */}
              <div className="absolute right-1 bottom-1 w-24 h-24 opacity-85 pointer-events-none flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-indigo-950/40 blur-sm absolute" />
                <Sparkles className="w-12 h-12 text-amber-300 drop-shadow-md animate-pulse" />
              </div>
            </div>

            {/* Subheader Guides Link */}
            <div className="flex items-center justify-between text-[11px] px-1 text-gray-400">
              <span>Having Issues</span>
              <a
                href="#guide"
                onClick={(e) => e.preventDefault()}
                className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="font-medium">Watch Quick Guide</span>
              </a>
            </div>

            {/* 5 Body Attachment Slots (Exact from Screenshot 2) */}
            <div className="space-y-2">
              {PROP_SLOTS.map((slot) => {
                const attachedPropId = attachedProps[slot.key];
                const propItem = AUTODRAFT_PROPS.find((p) => p.id === attachedPropId);

                return (
                  <div
                    key={slot.key}
                    onClick={() => setActiveSlot(slot.key)}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1d212e] border border-[#2b3145] hover:border-gray-500 hover:bg-[#222736] transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      {propItem ? (
                        <div className="w-10 h-10 rounded-lg bg-[#141722] border border-[#353c52] p-1 flex items-center justify-center shrink-0">
                          <img
                            src={propItem.imageUrl}
                            alt={propItem.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-blue-500/60 group-hover:bg-blue-400 transition-colors" />
                      )}

                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-100 group-hover:text-white">
                          {slot.label}
                        </span>
                        <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                          {propItem ? propItem.name : slot.description}
                        </span>
                      </div>
                    </div>

                    {/* Action Button: Remove if attached, else Blue '+' Button */}
                    {propItem ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveProp(slot.key);
                        }}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-full transition-colors"
                        title="Remove Prop"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSlot(slot.key);
                        }}
                        className="w-8 h-8 rounded-full bg-[#3b82f6] hover:bg-[#2563eb] text-white flex items-center justify-center transition-colors shadow-md"
                        title={`Add Prop to ${slot.label}`}
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* VIEW 2: SLOT PROP CATALOG (SCREENSHOT 1)                      */}
      {/* ============================================================= */}
      {activeSlot && (
        <div className="flex flex-col h-full">
          {/* Header with Back button */}
          <div className="p-3.5 border-b border-[#262a38] flex items-center justify-between bg-[#131622]">
            <button
              onClick={() => setActiveSlot(null)}
              className="flex items-center space-x-1 text-sm font-bold text-white hover:text-gray-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Add to {activeSlotInfo?.label}</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#222736]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Props"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0f1118] border border-[#2b3042] text-xs rounded-lg pl-8 pr-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Upload Prop Button */}
          <div className="px-3 pb-2.5">
            <button className="w-full py-2 bg-[#1c202d] hover:bg-[#252b3d] border border-[#31374a] text-gray-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors">
              <span>Upload Prop</span>
              <Plus className="w-3.5 h-3.5 text-blue-400" />
            </button>
          </div>

          {/* Filter Tabs: Generated Props vs Normal Props */}
          <div className="px-3 pb-2.5 flex items-center space-x-2">
            {(['Generated Props', 'Normal Props'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPropTab(tab)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  propTab === tab
                    ? 'bg-[#293044] text-white shadow-sm'
                    : 'bg-[#181b26] text-gray-400 hover:text-gray-200 hover:bg-[#212636]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* 2-Column Props Grid */}
          <div className="flex-1 overflow-y-auto p-3 pt-0">
            <div className="grid grid-cols-2 gap-2.5">
              {filteredProps.map((prop) => {
                const isSelected = attachedProps[activeSlot] === prop.id;

                return (
                  <div
                    key={prop.id}
                    onClick={() => {
                      onAttachProp(activeSlot, prop.id);
                      setActiveSlot(null);
                    }}
                    className={`rounded-xl border p-2 flex flex-col items-center justify-between cursor-pointer transition-all bg-[#0e1017] group ${
                      isSelected
                        ? 'border-blue-500 ring-1 ring-blue-500 shadow-md shadow-blue-500/20'
                        : 'border-[#262b3a] hover:border-gray-500 hover:bg-[#151824]'
                    }`}
                  >
                    <div className="w-full h-28 relative flex items-center justify-center p-1 overflow-hidden">
                      <img
                        src={prop.imageUrl}
                        alt={prop.name}
                        className="max-h-full max-w-full object-contain pointer-events-none group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-gray-200 mt-1 truncate w-full text-center group-hover:text-white">
                      {prop.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
