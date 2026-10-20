import React, { useState, useRef } from 'react';
import { 
  Sliders, 
  Sparkles, 
  Music, 
  Volume2, 
  VolumeX, 
  Palette, 
  Layers, 
  HelpCircle, 
  X,
  Wand2,
  FlipHorizontal,
  Upload,
  Play,
  Pause,
  Check,
  Plus,
  Trash2,
  Gauge,
  Bot,
  UserCheck,
  Download
} from 'lucide-react';
import { ActiveCanvasCharacter } from '../types/autodraft';
import { ActiveAudioTrack, StockAudioTrack } from '../types/audio';
import { AUTODRAFT_STOCK_AUDIO } from '../utils/audioLibrary';
import { AUTODRAFT_OFFICIAL_SFX } from '../data/autodraftSfxData';
import { AUTODRAFT_OFFICIAL_TRACKS } from '../data/autodraftMusicData';

interface AutoDraftRightPanelProps {
  selectedCharacter: ActiveCanvasCharacter | null;
  onUpdateScale: (scale: number) => void;
  onToggleFlip: () => void;
  activeAudioTracks?: ActiveAudioTrack[];
  onAddAudioTrack?: (track: ActiveAudioTrack) => void;
  onDeleteAudioTrack?: (trackId: string) => void;
  selectedAudioTrack?: ActiveAudioTrack | null;
  onUpdateAudioTrack?: (trackId: string, updates: Partial<ActiveAudioTrack>) => void;
  onSplitAudioTrack?: (trackId: string) => void;
  stageCharacters?: ActiveCanvasCharacter[];
}

const AutoDraftRightPanelComponent: React.FC<AutoDraftRightPanelProps> = ({
  selectedCharacter,
  onUpdateScale,
  onToggleFlip,
  activeAudioTracks = [],
  onAddAudioTrack,
  onDeleteAudioTrack,
  selectedAudioTrack = null,
  onUpdateAudioTrack,
  onSplitAudioTrack,
  stageCharacters = []
}) => {
  const urlParams = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState<'properties' | 'music' | 'effects'>(
    (urlParams.get('tab') as any) || 'properties'
  );
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const [panelAudioCategory, setPanelAudioCategory] = useState<'all' | 'music' | 'sfx'>('all');
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const audioInputRef = React.useRef<HTMLInputElement | null>(null);

  // Combine top official tracks + SFX for right panel
  const displayTracks: StockAudioTrack[] = React.useMemo(() => {
    if (panelAudioCategory === 'sfx') {
      return AUTODRAFT_OFFICIAL_SFX;
    }
    if (panelAudioCategory === 'music') {
      return AUTODRAFT_OFFICIAL_TRACKS.slice(0, 50);
    }
    return [
      ...AUTODRAFT_STOCK_AUDIO,
      ...AUTODRAFT_OFFICIAL_SFX.slice(0, 20),
      ...AUTODRAFT_OFFICIAL_TRACKS.slice(0, 20)
    ];
  }, [panelAudioCategory]);

  const handleTogglePreview = (id: string, generateFn?: () => string, trackUrl?: string) => {
    if (previewingTrackId === id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPreviewingTrackId(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    const url = trackUrl || (generateFn ? generateFn() : '');
    if (!url) return;

    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    audio.onended = () => setPreviewingTrackId(null);
    audio.play().catch(() => {});
    previewAudioRef.current = audio;
    setPreviewingTrackId(id);
  };

  const handleAddStockTrack = (track: StockAudioTrack) => {
    const isAdded = activeAudioTracks.some((t) => t.id === track.id);
    if (isAdded) {
      onDeleteAudioTrack?.(track.id);
      return;
    }

    const url = track.url || (track.generate ? track.generate() : '');
    onAddAudioTrack?.({
      id: track.id,
      name: track.name || track.title || 'Audio',
      url,
      duration: track.durationSeconds || 15,
      offset: 0,
      volume: 0.85,
      speed: 1.0,
      isMuted: false,
      isDeleted: false,
      startTime: 0,
      category: track.type === 'sfx' ? 'sfx' : 'music',
      lipSyncEnabled: track.type === 'sfx' && (track.category === 'Bird' || track.category === 'Vocal')
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      const dur = tempAudio.duration && isFinite(tempAudio.duration) && tempAudio.duration > 0 ? Math.round(tempAudio.duration * 10) / 10 : 30;
      onAddAudioTrack?.({
        id: `upload_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
        duration: Math.min(3600, dur),
        offset: 0,
        volume: 0.9,
        speed: 1.0,
        isMuted: false,
        isDeleted: false,
        startTime: 0,
        category: 'upload'
      });
    };
    e.target.value = '';
  };

  return (
    <aside className="w-80 bg-[#141620] border-l border-[#262b3a] flex flex-col h-full select-none z-10 shadow-2xl">
      {/* Tab Switcher Icons matching AutoDraft Extreme Right Bar */}
      <div className="flex border-b border-[#262b3a] bg-[#12141c]">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
            activeTab === 'properties'
              ? 'text-blue-400 border-b-2 border-blue-500 bg-[#191c28]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Properties</span>
        </button>

        <button
          onClick={() => setActiveTab('music')}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
            activeTab === 'music'
              ? 'text-blue-400 border-b-2 border-blue-500 bg-[#191c28]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Audio</span>
        </button>

        <button
          onClick={() => setActiveTab('effects')}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
            activeTab === 'effects'
              ? 'text-blue-400 border-b-2 border-blue-500 bg-[#191c28]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Effects</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'properties' && (
          <div className="space-y-4">
            {/* 1. AUDIO CLIP INSPECTOR (When an Audio Clip is Selected) */}
            {selectedAudioTrack ? (
              <div className="space-y-3.5 bg-[#10121a] p-3 rounded-xl border border-indigo-500/40 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase font-bold text-indigo-400 flex items-center space-x-1.5">
                    <Music className="w-3.5 h-3.5" />
                    <span>Audio Clip Inspector</span>
                  </div>
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded capitalize font-medium">
                    {selectedAudioTrack.category}
                  </span>
                </div>

                <div className="text-xs font-bold text-white bg-[#171a26] p-2.5 rounded-lg border border-[#2b3042] truncate">
                  {selectedAudioTrack.name}
                </div>

                {/* Volume Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1 text-gray-300">
                    <span className="flex items-center space-x-1">
                      <Volume2 className="w-3 h-3 text-indigo-400" />
                      <span>Volume</span>
                    </span>
                    <span className="font-mono text-indigo-300 font-bold">
                      {Math.round((selectedAudioTrack.volume ?? 1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={selectedAudioTrack.volume ?? 1}
                    onChange={(e) =>
                      onUpdateAudioTrack?.(selectedAudioTrack.id, {
                        volume: parseFloat(e.target.value)
                      })
                    }
                    className="w-full accent-indigo-500 bg-gray-800 rounded h-1.5 cursor-pointer"
                  />
                </div>

                {/* Speed Multiplier */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1 text-gray-300">
                    <span className="flex items-center space-x-1">
                      <Gauge className="w-3 h-3 text-amber-400" />
                      <span>Playback Speed</span>
                    </span>
                    <span className="font-mono text-amber-300 font-bold">
                      {selectedAudioTrack.speed || 1.0}x
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[10px]">
                    {[0.5, 1.0, 1.25, 1.5].map((spd) => (
                      <button
                        key={spd}
                        onClick={() =>
                          onUpdateAudioTrack?.(selectedAudioTrack.id, { speed: spd })
                        }
                        className={`py-1 rounded font-semibold transition-all ${
                          (selectedAudioTrack.speed || 1.0) === spd
                            ? 'bg-amber-600 text-white'
                            : 'bg-[#1c202e] text-gray-400 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Character Lip-Sync Toggle */}
                <div className="pt-2 border-t border-[#262a38] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center space-x-1.5">
                      <Bot className="w-3.5 h-3.5 text-purple-400" />
                      <span>Character Lip-Sync</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedAudioTrack.lipSyncEnabled)}
                      onChange={(e) =>
                        onUpdateAudioTrack?.(selectedAudioTrack.id, {
                          lipSyncEnabled: e.target.checked
                        })
                      }
                      className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                    />
                  </div>

                  {selectedAudioTrack.lipSyncEnabled && (
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">
                        Linked Stage Character:
                      </label>
                      <select
                        value={selectedAudioTrack.targetCharacterId || ''}
                        onChange={(e) =>
                          onUpdateAudioTrack?.(selectedAudioTrack.id, {
                            targetCharacterId: e.target.value || undefined
                          })
                        }
                        className="w-full bg-[#161826] border border-purple-500/40 rounded p-1.5 text-xs text-purple-200 focus:outline-none"
                      >
                        <option value="">Active Character on Stage</option>
                        {stageCharacters.map((char) => (
                          <option key={char.instanceId} value={char.instanceId}>
                            {char.name} ({char.instanceId.slice(0, 5)})
                          </option>
                        ))}
                      </select>
                      <span className="text-[9px] text-gray-400 block mt-1">
                        Character mouth animates automatically during playback!
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Track Actions */}
                <div className="pt-2 border-t border-[#262a38] flex items-center space-x-2">
                  <button
                    onClick={() =>
                      onUpdateAudioTrack?.(selectedAudioTrack.id, {
                        isMuted: !selectedAudioTrack.isMuted
                      })
                    }
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                      selectedAudioTrack.isMuted
                        ? 'bg-red-600/30 text-red-300 border border-red-500/50'
                        : 'bg-[#1e2333] text-gray-300 hover:text-white'
                    }`}
                  >
                    {selectedAudioTrack.isMuted ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-red-400" />
                        <span>Unmute</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Mute</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={async () => {
                      if (!selectedAudioTrack.url) return;
                      try {
                        const response = await fetch(selectedAudioTrack.url);
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        const cleanName = (selectedAudioTrack.name || 'audio_track')
                          .replace(/\s+/g, '_')
                          .toLowerCase();
                        const ext = selectedAudioTrack.url.includes('.mp3') ? 'mp3' : 'wav';
                        a.download = `${cleanName}.${ext}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
                      } catch {
                        const a = document.createElement('a');
                        a.href = selectedAudioTrack.url;
                        a.download = `${(selectedAudioTrack.name || 'audio_track').replace(/\s+/g, '_')}.wav`;
                        a.target = '_blank';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all flex items-center space-x-1 px-2.5"
                    title="Download Audio Track File"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold">Download</span>
                  </button>

                  <button
                    onClick={() => onDeleteAudioTrack?.(selectedAudioTrack.id)}
                    className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 transition-all"
                    title="Delete Audio Track"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}

            {/* 2. CHARACTER PROPERTIES (When Character is Selected) */}
            {selectedCharacter ? (
              <>
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                    Selected Character
                  </div>
                  <div className="text-xs font-bold text-white bg-[#0e1017] p-2.5 rounded-lg border border-[#2b3042] flex items-center justify-between">
                    <span>{selectedCharacter.name}</span>
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                      {selectedCharacter.action}
                    </span>
                  </div>
                </div>

                {/* Transform Scale */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5 text-gray-300">
                    <span>Character Scale</span>
                    <span className="font-mono text-blue-400 font-bold">
                      {Math.round(selectedCharacter.scale * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={selectedCharacter.scale}
                    onChange={(e) => onUpdateScale(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 bg-gray-800 rounded h-1.5 cursor-pointer"
                  />
                </div>

                {/* Flip Horizontal */}
                <div className="pt-2">
                  <button
                    onClick={onToggleFlip}
                    className="w-full py-2 bg-[#222736] hover:bg-[#2c3245] rounded-lg border border-[#373e54] text-xs font-semibold text-gray-200 flex items-center justify-center space-x-2 transition-colors"
                  >
                    <FlipHorizontal className="w-4 h-4 text-blue-400" />
                    <span>Flip Direction (Left / Right)</span>
                  </button>
                </div>

                {/* Position Coordinates */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="bg-[#0e1017] p-2 rounded-lg border border-[#262b3a]">
                    <span className="text-[10px] text-gray-400 block">X Position</span>
                    <span className="font-mono text-gray-200 font-semibold">{Math.round(selectedCharacter.x)}px</span>
                  </div>
                  <div className="bg-[#0e1017] p-2 rounded-lg border border-[#262b3a]">
                    <span className="text-[10px] text-gray-400 block">Y Position</span>
                    <span className="font-mono text-gray-200 font-semibold">{Math.round(selectedCharacter.y)}px</span>
                  </div>
                </div>
              </>
            ) : !selectedAudioTrack ? (
              <div className="text-center py-10 text-xs text-gray-400">
                Click any character on stage or audio clip on timeline to view properties
              </div>
            ) : null}
          </div>
        )}

        {/* 3. AUDIO TAB (Browse Music & SFX) */}
        {activeTab === 'music' && (
          <div className="space-y-4">
            {/* Upload Custom Audio Box */}
            <div className="p-3 bg-[#11131c] rounded-xl border border-dashed border-[#343b52] hover:border-indigo-500/70 transition-colors">
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div
                onClick={() => audioInputRef.current?.click()}
                className="flex flex-col items-center justify-center cursor-pointer py-2 text-center group"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform mb-1.5 shadow-sm">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-gray-200 group-hover:text-indigo-300">
                  Upload Audio File
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5">
                  MP3, WAV, AAC, M4A supported
                </span>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-1 bg-[#10121a] p-1 rounded-lg border border-[#262a38] text-[11px]">
              <button
                onClick={() => setPanelAudioCategory('all')}
                className={`flex-1 py-1 rounded font-semibold transition-all ${
                  panelAudioCategory === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPanelAudioCategory('music')}
                className={`flex-1 py-1 rounded font-semibold transition-all ${
                  panelAudioCategory === 'music'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Music
              </button>
              <button
                onClick={() => setPanelAudioCategory('sfx')}
                className={`flex-1 py-1 rounded font-semibold transition-all ${
                  panelAudioCategory === 'sfx'
                    ? 'bg-amber-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                SFX
              </button>
            </div>

            {/* Audio Tracks List */}
            <div>
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-2 flex items-center justify-between">
                <span>Available ({displayTracks.length})</span>
                <span className="text-indigo-400 text-[9px] lowercase font-normal">click to preview/add</span>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {displayTracks.map((m) => {
                  const isAdded = activeAudioTracks.some((t) => t.id === m.id);
                  const isPreviewing = previewingTrackId === m.id;

                  return (
                    <div
                      key={m.id}
                      onClick={() => handleAddStockTrack(m)}
                      className={`p-2.5 rounded-lg border transition-all flex items-center justify-between group cursor-pointer ${
                        isAdded
                          ? 'bg-indigo-950/40 border-indigo-500/70 shadow-sm'
                          : 'bg-[#0e1017] hover:bg-[#1a1d2b] border-[#262b3a]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate max-w-[170px]">
                        {/* Play/Pause Preview Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePreview(m.id, m.generate, m.url);
                          }}
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow transition-all ${
                            isPreviewing
                              ? 'bg-indigo-500 text-white animate-pulse'
                              : 'bg-[#222736] text-gray-300 hover:bg-indigo-600 hover:text-white'
                          }`}
                          title={isPreviewing ? 'Stop Preview' : 'Play Preview'}
                        >
                          {isPreviewing ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                        </button>

                        <div className="truncate">
                          <div className={`text-xs font-semibold truncate ${isAdded ? 'text-indigo-200' : 'text-gray-200 group-hover:text-indigo-300'}`}>
                            {m.name || m.title}
                          </div>
                          <div className="text-[10px] text-gray-400">{m.category} • {m.duration || '0:15'}</div>
                        </div>
                      </div>

                      {/* Add/Remove Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddStockTrack(m);
                        }}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center space-x-1 transition-all ${
                          isAdded
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-[#252a3a] text-gray-300 hover:bg-indigo-600 hover:text-white'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. EFFECTS TAB */}
        {activeTab === 'effects' && (
          <div className="text-xs text-gray-400 space-y-3">
            <div className="p-3 bg-[#0e1017] rounded-lg border border-[#2b3042]">
              <span className="font-semibold text-gray-200 block mb-1">Visual Effects & Filters</span>
              <p className="text-[11px] text-gray-400">
                Open the Effects Drawer from the left sidebar to browse 301 cinematic overlays, weather effects, and lighting transitions.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export const AutoDraftRightPanel = React.memo(AutoDraftRightPanelComponent);
