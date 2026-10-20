import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, Sparkles, Users } from 'lucide-react';
import { AUTODRAFT_CHARACTERS, getActionsForCharacter } from '../data/autodraftData';
import { CharacterItem, CharacterActionType, CharacterAngle } from '../types/autodraft';
import { CharacterAvatarPreview } from './CharacterAvatarPreview';
import { ErrorBoundary } from './ErrorBoundary';

interface AutoDraftCharacterDrawerProps {
  selectedCharacter: CharacterItem;
  selectedAngle: CharacterAngle;
  selectedAction: CharacterActionType;
  onSelectCharacter: (char: CharacterItem) => void;
  onSelectAngle: (angle: CharacterAngle) => void;
  onSelectAction: (action: CharacterActionType, jsonUrl?: string) => void;
}

const AutoDraftCharacterDrawerComponent: React.FC<AutoDraftCharacterDrawerProps> = ({
  selectedCharacter,
  selectedAngle,
  selectedAction,
  onSelectCharacter,
  onSelectAngle,
  onSelectAction
}) => {
  // Mode: 'catalog' (Screenshot 3) or 'actions' (Screenshot 4)
  const [viewMode, setViewMode] = useState<'catalog' | 'actions'>(() => {
    return new URLSearchParams(window.location.search).get('char_mode') === 'catalog' ? 'catalog' : 'actions';
  });
  const [activePill, setActivePill] = useState<string>(() => {
    return new URLSearchParams(window.location.search).get('char_pill') || 'All';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionSearchQuery, setActionSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(100);

  const [activeActionTab, setActiveActionTab] = useState<string>('ALL');

  const pills = [
    'All',
    'Religious',
    'Desi',
    'Animals',
    'Birds',
    'Vehicles',
    'Kids',
    'Western',
    'Horror',
    'General'
  ];

  // Memoized filter matching AutoDraft exact category tagging
  const filteredCharacters = useMemo(() => {
    return AUTODRAFT_CHARACTERS.filter((c) => {
      const cCat = (c.category || '').toLowerCase();
      const pCat = activePill.toLowerCase();
      const matchesPill =
        activePill === 'All' ||
        cCat === pCat ||
        (c.tags && c.tags.some((t) => t.toLowerCase() === pCat)) ||
        (activePill === 'Vehicles' && (c.structureType === 'car' || cCat.includes('vehic'))) ||
        (activePill === 'Birds' && (c.structureType === 'bird' || c.structureType === 'real_bird' || cCat.includes('bird'))) ||
        (activePill === 'Animals' && (c.structureType === 'animal' || c.structureType === 'expressive_animal' || c.structureType === 'hopper' || c.structureType === 'expressive_hopper' || cCat.includes('anim'))) ||
        (activePill === 'Kids' && (c.structureType === 'kid' || cCat.includes('kid')));
      const matchesSearch =
        searchQuery.trim() === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cCat.includes(searchQuery.toLowerCase()) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesPill && matchesSearch;
    });
  }, [activePill, searchQuery]);

  const displayedCharacters = useMemo(() => {
    return filteredCharacters.slice(0, visibleCount);
  }, [filteredCharacters, visibleCount]);

  // Dynamic actions based on character species and selected turnaround angle
  const characterActions = useMemo(() => {
    return getActionsForCharacter(selectedCharacter, selectedAngle);
  }, [selectedCharacter, selectedAngle]);

  const actionTabs = useMemo(() => {
    const presentTabs = new Set(characterActions.map((a) => (a.tab || 'PRIMARY').toUpperCase()));
    const allKnown = ['ALL', 'PRIMARY', 'HAND', 'EXPRESSION', 'LEGS'];
    return allKnown.filter((t) => t === 'ALL' || presentTabs.has(t));
  }, [characterActions]);

  const filteredActions = useMemo(() => {
    return characterActions.filter((a) => {
      const aTab = (a.tab || 'PRIMARY').toUpperCase();
      const matchesTab = activeActionTab === 'ALL' || aTab === activeActionTab;
      const matchesSearch =
        actionSearchQuery.trim() === '' ||
        a.label.toLowerCase().includes(actionSearchQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(actionSearchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [characterActions, actionSearchQuery, activeActionTab]);

  return (
    <div className="w-80 bg-[#161821] border-r border-[#262a38] flex flex-col h-full select-none text-white z-20">
      {/* ------------------------------------------------------------- */}
      {/* VIEW 1: CHARACTER CATALOG (SCREENSHOT 3)                       */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'catalog' && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-3.5 border-b border-[#262a38] flex items-center justify-between bg-[#131622]">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">Characters</h3>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                {AUTODRAFT_CHARACTERS.length}
              </span>
            </div>
            <button className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-[#222736] hover:bg-[#2c3245] text-xs font-semibold text-gray-200 border border-[#373e54] transition-colors">
              <span>Create</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={`Search ${filteredCharacters.length} characters...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(40);
                }}
                className="w-full bg-[#0f1118] border border-[#2b3042] text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3 pb-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {pills.map((pill) => (
              <button
                key={pill}
                onClick={() => {
                  setActivePill(pill);
                  setVisibleCount(100);
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-medium shrink-0 transition-all ${
                  activePill === pill
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[#222634] text-gray-400 hover:bg-[#2c3144] hover:text-white'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Character Counter & Info */}
          <div className="px-3 pb-2 flex items-center justify-between text-[10px] text-gray-400">
            <span>
              Showing {Math.min(visibleCount, filteredCharacters.length)} of{' '}
              {filteredCharacters.length}
            </span>
            <span className="text-emerald-400 font-mono text-[9px] bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
              Offline Cloned
            </span>
          </div>

          {/* Character Cards Grid (2 Columns) */}
          <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {displayedCharacters.map((char) => {
                const isCurrent = selectedCharacter.id === char.id;
                return (
                  <div
                    key={char.id}
                    onClick={() => {
                      onSelectCharacter(char);
                      // Auto-select first appropriate action for this character and current angle
                      const acts = getActionsForCharacter(char, selectedAngle);
                      if (acts.length > 0) {
                        onSelectAction(acts[0].id, acts[0].jsonUrl);
                      }
                      setViewMode('actions');
                    }}
                    className={`rounded-xl border cursor-pointer p-2 flex flex-col items-center justify-between transition-all group bg-[#0e1017] ${
                      isCurrent
                        ? 'border-blue-500 shadow-md shadow-blue-500/20 ring-1 ring-blue-500'
                        : 'border-[#262b3a] hover:border-gray-500 hover:bg-[#131622]'
                    }`}
                  >
                    {/* Render Character Preview */}
                    <div className="w-full h-36 relative flex items-center justify-center overflow-hidden py-1">
                      <ErrorBoundary
                        fallback={
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-[10px]">
                            <span>{char.name}</span>
                          </div>
                        }
                      >
                        {char.avatarUrl ? (
                          <img
                            src={char.avatarUrl}
                            alt={char.name}
                            className="max-h-32 max-w-[90%] object-contain pointer-events-none group-hover:scale-105 transition-transform duration-200 drop-shadow-md"
                            loading="lazy"
                            onError={(e) => {
                              // If image fails, fallback to CharacterAvatarPreview
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <CharacterAvatarPreview
                            character={char}
                            angle="3/4 FRONT"
                            action="Idle"
                            isPlaying={false}
                            scale={0.7}
                          />
                        )}
                      </ErrorBoundary>

                      {/* Edit Badge Overlay */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCharacter(char);
                          setViewMode('actions');
                        }}
                        className="absolute top-1 right-1 text-[9px] bg-[#1d2230]/90 text-gray-300 hover:text-white px-2 py-0.5 rounded border border-[#333a50] opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      >
                        Edit
                      </button>
                    </div>

                    <span className="text-[11px] font-bold text-gray-200 mt-1 truncate w-full text-center">
                      {char.name.split('(')[0].replace(/_/g, ' ')}
                    </span>

                    {/* Turnaround angle indicators footer */}
                    <div className="w-full pt-1.5 mt-1 border-t border-[#222736] flex items-center justify-between text-[7px] font-bold text-gray-400">
                      <span>FRONT</span>
                      <span className="text-blue-400">3/4 FRONT</span>
                      <span>3/4 BACK</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button if remaining */}
            {visibleCount < filteredCharacters.length && (
              <div className="pt-2 pb-4 flex justify-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 40)}
                  className="w-full py-2 rounded-lg bg-[#222738] hover:bg-[#2c3348] text-xs font-bold text-white border border-[#3b435c] transition-all"
                >
                  Load More ({filteredCharacters.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 2: ANIMATION ACTIONS & ANGLES (SCREENSHOT 4)              */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'actions' && (
        <div className="flex flex-col h-full">
          {/* Header with Selected Character & Back Button */}
          <div className="p-3 border-b border-[#262a38] flex items-center justify-between bg-[#131622]">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('catalog')}
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#222736]"
                title="Back to Characters"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {/* Mini Character avatar */}
              {selectedCharacter.avatarUrl ? (
                <img
                  src={selectedCharacter.avatarUrl}
                  alt={selectedCharacter.name}
                  className="w-7 h-7 rounded-full object-cover border border-white/20 shadow"
                />
              ) : (
                <div
                  className="w-6 h-6 rounded-full border border-white/20 shadow"
                  style={{ backgroundColor: selectedCharacter.colors?.skin || '#f5c69b' }}
                />
              )}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white truncate max-w-[120px]">
                  {selectedCharacter.name.replace(/_/g, ' ')}
                </span>
                <span className="text-[9px] text-blue-400 capitalize">
                  {selectedCharacter.structureType || 'Human'}
                </span>
              </div>
            </div>

            <span className="text-[10px] uppercase font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded">
              Active
            </span>
          </div>

          {/* Search Animations */}
          <div className="p-3 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={`Search ${characterActions.length} ${selectedCharacter.structureType || ''} animations...`}
                value={actionSearchQuery}
                onChange={(e) => setActionSearchQuery(e.target.value)}
                className="w-full bg-[#0f1118] border border-[#2b3042] text-xs rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Angle Toggle Pills: FRONT | 3/4 FRONT | 3/4 BACK */}
          <div className="px-3 pb-2 flex items-center justify-between gap-1">
            {(['FRONT', '3/4 FRONT', '3/4 BACK'] as CharacterAngle[]).map((ang) => {
              const isSelected = selectedAngle === ang;
              return (
                <button
                  key={ang}
                  onClick={() => {
                    onSelectAngle(ang);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                      : 'bg-[#222634] text-gray-400 hover:bg-[#2b3144] hover:text-white'
                  }`}
                >
                  {ang}
                </button>
              );
            })}
          </div>

          {/* Action Sub-Tabs: ALL | PRIMARY | HAND | EXPRESSION | LEGS (AutoDraft Official) */}
          <div className="px-3 pb-2.5 flex items-center gap-1 overflow-x-auto scrollbar-none">
            {actionTabs.map((tab) => {
              const isSelected = activeActionTab === tab;
              const count =
                tab === 'ALL'
                  ? characterActions.length
                  : characterActions.filter((a) => (a.tab || 'PRIMARY').toUpperCase() === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveActionTab(tab)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold shrink-0 transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-[#1e2230] text-gray-400 hover:bg-[#282f42] hover:text-white'
                  }`}
                >
                  {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  <span className={`ml-1 text-[9px] ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Animation Action Grid */}
          <div className="flex-1 overflow-y-auto p-3 pt-0">
            <div className="grid grid-cols-2 gap-2.5">
              {filteredActions.map((act) => {
                const isCurrentAction = selectedAction === act.id;
                return (
                  <div
                    key={`${act.id}_${act.tab || ''}`}
                    onClick={() => onSelectAction(act.id, act.jsonUrl)}
                    className={`aspect-square rounded-xl border p-2 flex flex-col items-center justify-between cursor-pointer transition-all ${
                      isCurrentAction
                        ? 'border-blue-500 bg-blue-950/30 shadow-md ring-1 ring-blue-500'
                        : 'border-[#262b3a] bg-[#0e1017] hover:border-gray-500 hover:bg-[#131622]'
                    }`}
                  >
                    {/* Action Preview (GIF thumbnail or Silhouette) */}
                    <div className="flex-1 flex items-center justify-center overflow-hidden py-1 w-full">
                      {act.thumbnailUrl ? (
                        <img
                          src={act.thumbnailUrl}
                          alt={act.label}
                          className="w-16 h-16 object-contain rounded select-none pointer-events-none drop-shadow"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const p = e.currentTarget.parentElement?.querySelector('.fallback-silhouette') as HTMLElement;
                            if (p) p.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`fallback-silhouette flex-col items-center opacity-90 ${act.thumbnailUrl ? 'hidden' : 'flex'}`}
                      >
                        <div className="w-5 h-5 rounded-full bg-blue-400/80 mb-0.5 shadow-sm" />
                        <div className="w-6 h-8 bg-blue-500/80 rounded-t shadow-sm" />
                        <div className="flex gap-1.5">
                          <div className="w-2 h-7 bg-blue-600/80 rounded-b" />
                          <div className="w-2 h-7 bg-blue-600/80 rounded-b" />
                        </div>
                      </div>
                    </div>

                    {/* Action Name */}
                    <span
                      className={`text-[11px] font-bold tracking-tight text-center truncate w-full ${
                        isCurrentAction ? 'text-blue-400' : 'text-gray-300'
                      }`}
                    >
                      {act.label}
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

export const AutoDraftCharacterDrawer = React.memo(AutoDraftCharacterDrawerComponent);
