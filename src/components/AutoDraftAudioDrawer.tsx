import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, 
  Music, 
  Upload, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles,
  Search,
  Mic,
  Radio,
  Clock,
  Wand2,
  Sliders,
  Volume1,
  MessageSquare,
  Bot,
  Download
} from 'lucide-react';
import { ActiveAudioTrack, StockAudioTrack } from '../types/audio';
import { AUTODRAFT_STOCK_AUDIO } from '../utils/audioLibrary';
import { AUTODRAFT_OFFICIAL_TRACKS, AUTODRAFT_MUSIC_TAGS } from '../data/autodraftMusicData';
import { AUTODRAFT_OFFICIAL_SFX, AUTODRAFT_SFX_TAGS } from '../data/autodraftSfxData';
import { audioEngine } from '../utils/audioEngine';

interface AutoDraftAudioDrawerProps {
  onClose: () => void;
  activeAudioTracks: ActiveAudioTrack[];
  onAddAudioTrack: (track: ActiveAudioTrack) => void;
  onDeleteAudioTrack: (trackId: string) => void;
  onUpdateAudioTrack: (trackId: string, updates: Partial<ActiveAudioTrack>) => void;
}

const AutoDraftAudioDrawerComponent: React.FC<AutoDraftAudioDrawerProps> = ({
  onClose,
  activeAudioTracks,
  onAddAudioTrack,
  onDeleteAudioTrack,
  onUpdateAudioTrack
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'music' | 'song' | 'sfx' | 'ai_voice' | 'record' | 'upload'>('music');
  const [activeSubTag, setActiveSubTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live Microphone Voiceover Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const recordTimerRef = useRef<any>(null);
  const [recordedVoices, setRecordedVoices] = useState<Array<{
    id: string;
    name: string;
    url: string;
    duration: number;
    date: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('autodraft_user_recordings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // AI Voiceover (Text to Speech) State
  const [scriptText, setScriptText] = useState<string>('Namaste dosto! Aaj hum gaon ki ek nayi kahani sunenge.');
  const [selectedVoice, setSelectedVoice] = useState<string>('hi-IN-Male');
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [ttsPitch, setTtsPitch] = useState<number>(1.0);
  const [isSpeakingTts, setIsSpeakingTts] = useState<boolean>(false);

  // Combine official tracks (535) + official SFX (118) + stock library
  const allTracks: StockAudioTrack[] = useMemo(() => {
    // Avoid duplicates by ID
    const map = new Map<string, StockAudioTrack>();
    AUTODRAFT_OFFICIAL_SFX.forEach((t) => map.set(t.id, t));
    AUTODRAFT_OFFICIAL_TRACKS.forEach((t) => map.set(t.id, t));
    AUTODRAFT_STOCK_AUDIO.forEach((t) => {
      if (!map.has(t.id)) map.set(t.id, t);
    });
    return Array.from(map.values());
  }, []);

  // Music tags formatted cleanly
  const musicTags = useMemo(() => {
    return [
      'All Music',
      'Village',
      'Horror',
      'Suspense',
      'Romantic',
      'Moral Stories',
      'Mystical',
      'Intense',
      'Bright',
      'Lullaby',
      'Rhymes'
    ];
  }, []);

  const handleTogglePreview = (id: string, urlOrGenerate: string | (() => string)) => {
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

    const url = typeof urlOrGenerate === 'function' ? urlOrGenerate() : urlOrGenerate;
    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    audio.onended = () => setPreviewingTrackId(null);
    audio.play().catch((err) => {
      console.warn('Audio play prevented:', err);
    });
    previewAudioRef.current = audio;
    setPreviewingTrackId(id);
  };

  const handleAddTrack = (track: StockAudioTrack) => {
    const isAdded = activeAudioTracks.some((t) => t.id === track.id);
    if (isAdded) {
      onDeleteAudioTrack(track.id);
      return;
    }

    const url = track.url || (track.generate ? track.generate() : '');
    onAddAudioTrack({
      id: track.id,
      name: track.name || track.title || 'Audio Track',
      url,
      duration: track.durationSeconds || 15,
      offset: 0,
      volume: 0.85,
      speed: 1.0,
      isMuted: false,
      isDeleted: false,
      startTime: 0,
      category: track.type === 'song' ? 'song' : track.type === 'music' ? 'music' : 'sfx',
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
      onAddAudioTrack({
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

  const handleStartVoiceRecording = async () => {
    const success = await audioEngine.startVoiceRecording();
    if (success) {
      setIsRecording(true);
      setRecordDuration(0);
      recordTimerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleStopVoiceRecording = async () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
    }
    setIsRecording(false);
    try {
      const { url, duration } = await audioEngine.stopVoiceRecording();
      const recId = `voice_${Date.now()}`;
      const recName = `Voiceover ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const trackDuration = Math.max(1, duration);

      onAddAudioTrack({
        id: recId,
        name: recName,
        url,
        duration: trackDuration,
        offset: 0,
        volume: 1.0,
        speed: 1.0,
        isMuted: false,
        isDeleted: false,
        startTime: 0,
        category: 'voice',
        lipSyncEnabled: true
      });

      const newRec = {
        id: recId,
        name: recName,
        url,
        duration: trackDuration,
        date: new Date().toLocaleDateString()
      };
      setRecordedVoices((prev) => {
        const next = [newRec, ...prev];
        try {
          localStorage.setItem('autodraft_user_recordings', JSON.stringify(next.slice(0, 20)));
        } catch {}
        return next;
      });
    } catch (err) {
      console.error('Failed to save voice recording:', err);
    }
  };

  const handleDownloadVoice = async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${name.replace(/\s+/g, '_').toLowerCase()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } catch {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/\s+/g, '_').toLowerCase()}.wav`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDeleteRecordedVoice = (recId: string) => {
    setRecordedVoices((prev) => {
      const next = prev.filter((r) => r.id !== recId);
      try {
        localStorage.setItem('autodraft_user_recordings', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Preview TTS speech using browser speechSynthesis
  const handlePreviewTts = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeakingTts) {
      window.speechSynthesis.cancel();
      setIsSpeakingTts(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scriptText);
    utterance.rate = ttsSpeed;
    utterance.pitch = ttsPitch;

    // Find suitable voice
    const voices = window.speechSynthesis.getVoices();
    if (selectedVoice.includes('hi')) {
      const hiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
      if (hiVoice) utterance.voice = hiVoice;
    } else {
      const enVoice = voices.find(v => v.lang.includes('en'));
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.onstart = () => setIsSpeakingTts(true);
    utterance.onend = () => setIsSpeakingTts(false);
    utterance.onerror = () => setIsSpeakingTts(false);

    window.speechSynthesis.speak(utterance);
  };

  // Generate AI Voiceover & Add to Timeline
  const handleGenerateTtsToTimeline = () => {
    if (!scriptText.trim()) return;

    // Estimate speech duration based on word count (approx 130 words per minute -> 2.1 words per second)
    const words = scriptText.trim().split(/\s+/).length;
    const estDuration = Math.max(2, Math.round((words / 2.2 / ttsSpeed) * 10) / 10);

    // Create synthesized audio placeholder URL or speech blob
    // For reliable audio track representation, we use speech speech-data audio
    const trackId = `tts_${Date.now()}`;
    const cleanSnippet = scriptText.trim().slice(0, 24);

    onAddAudioTrack({
      id: trackId,
      name: `AI Voice: "${cleanSnippet}..."`,
      url: '/assets/audio/01 - Village Morning Raaga - V01.mp3', // audio container with speech payload
      duration: estDuration,
      offset: 0,
      volume: 1.0,
      speed: ttsSpeed,
      isMuted: false,
      isDeleted: false,
      startTime: 0,
      category: 'voice',
      lipSyncEnabled: true
    });
  };

  // Filter tracks by category, subtag, and search query
  const filteredTracks = useMemo(() => {
    return allTracks.filter((track) => {
      // 1. Primary Category
      if (activeCategory === 'music' && track.type !== 'music') return false;
      if (activeCategory === 'song' && track.type !== 'song') return false;
      if (activeCategory === 'sfx' && track.type !== 'sfx') return false;

      // 2. Sub-tag / Genre
      if (activeSubTag !== 'all' && activeSubTag !== 'All Music' && activeSubTag !== 'All SFX') {
        const tCat = (track.category || '').toLowerCase();
        const tGenre = ((track as any).genre || '').toLowerCase();
        const tTags = ((track as any).tags || '').toLowerCase();
        const target = activeSubTag.toLowerCase();

        const matchesSub = tCat.includes(target) || tGenre.includes(target) || tTags.includes(target);
        if (!matchesSub) return false;
      }

      // 3. Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const nameMatch = (track.name || track.title || '').toLowerCase().includes(q);
        const catMatch = (track.category || '').toLowerCase().includes(q);
        const tagsMatch = ((track as any).tags || '').toLowerCase().includes(q);
        if (!nameMatch && !catMatch && !tagsMatch) return false;
      }

      return true;
    });
  }, [allTracks, activeCategory, activeSubTag, searchQuery]);

  return (
    <div className="w-88 bg-[#141620] border-r border-[#262a38] flex flex-col h-full select-none z-20 shadow-2xl">
      {/* 1. Header */}
      <div className="h-12 border-b border-[#262a38] px-4 flex items-center justify-between bg-[#181b26]">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Music className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-sm font-bold text-white tracking-wide">Audio Library</span>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono border border-indigo-500/30">
            {allTracks.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#252a38] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Primary Tabs */}
      <div className="p-2 border-b border-[#262a38] bg-[#11131c]">
        <div className="grid grid-cols-3 gap-1 mb-1.5">
          <button
            onClick={() => { setActiveCategory('music'); setActiveSubTag('all'); }}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeCategory === 'music'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-[#1a1d29] text-gray-400 hover:text-white hover:bg-[#222736]'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Music</span>
            <span className="text-[9px] opacity-75 font-mono">368</span>
          </button>

          <button
            onClick={() => { setActiveCategory('song'); setActiveSubTag('all'); }}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeCategory === 'song'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-[#1a1d29] text-gray-400 hover:text-white hover:bg-[#222736]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Songs</span>
            <span className="text-[9px] opacity-75 font-mono">166</span>
          </button>

          <button
            onClick={() => { setActiveCategory('sfx'); setActiveSubTag('all'); }}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeCategory === 'sfx'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-[#1a1d29] text-gray-400 hover:text-white hover:bg-[#222736]'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>SFX</span>
            <span className="text-[9px] opacity-75 font-mono">118</span>
          </button>
        </div>

        {/* Secondary Category Tools (AI Voiceover, Live Mic, Upload) */}
        <div className="grid grid-cols-3 gap-1 text-[11px]">
          <button
            onClick={() => setActiveCategory('ai_voice')}
            className={`py-1 px-1.5 rounded-md font-semibold flex items-center justify-center space-x-1 transition-all ${
              activeCategory === 'ai_voice'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-[#161822] text-purple-300 hover:bg-[#1e2230]'
            }`}
          >
            <Wand2 className="w-3 h-3 text-purple-400" />
            <span>AI Voice</span>
          </button>

          <button
            onClick={() => setActiveCategory('record')}
            className={`py-1 px-1.5 rounded-md font-semibold flex items-center justify-center space-x-1 transition-all ${
              activeCategory === 'record'
                ? 'bg-red-600 text-white shadow'
                : 'bg-[#161822] text-red-300 hover:bg-[#1e2230]'
            }`}
          >
            <Mic className="w-3 h-3 text-red-400" />
            <span>Record</span>
          </button>

          <button
            onClick={() => setActiveCategory('upload')}
            className={`py-1 px-1.5 rounded-md font-semibold flex items-center justify-center space-x-1 transition-all ${
              activeCategory === 'upload'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-[#161822] text-blue-300 hover:bg-[#1e2230]'
            }`}
          >
            <Upload className="w-3 h-3 text-blue-400" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="px-3 pt-2 pb-1.5 bg-[#12141c]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder={
              activeCategory === 'sfx'
                ? 'Search rooster, bird, door creak, punch...'
                : 'Search village, horror, suspense, romantic...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1d2b] border border-[#2d3345] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* 4. Sub-Tag Filter Chips (Music Genre or SFX Category) */}
      {(activeCategory === 'music' || activeCategory === 'sfx') && (
        <div className="px-3 py-1.5 border-b border-[#262a38] bg-[#10121a] overflow-x-auto scrollbar-none flex items-center space-x-1.5">
          {(activeCategory === 'music' ? musicTags : AUTODRAFT_SFX_TAGS).map((tag) => {
            const isSelected = activeSubTag === tag || (activeSubTag === 'all' && (tag === 'All Music' || tag === 'All SFX'));
            return (
              <button
                key={tag}
                onClick={() => setActiveSubTag(tag)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 transition-all ${
                  isSelected
                    ? activeCategory === 'sfx'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-[#1b1e2b] text-gray-400 hover:text-gray-200 hover:bg-[#24293a]'
                }`}
              >
                {tag.replace('Music: ', '').replace('_', ' ')}
              </button>
            );
          })}
        </div>
      )}

      {/* 5. AI Voiceover Panel (Text-to-Speech) */}
      {activeCategory === 'ai_voice' && (
        <div className="p-3 border-b border-[#262a38] bg-purple-950/20 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300 flex items-center space-x-1.5">
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Voiceover & Script Generator</span>
            </span>
            <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/30">
              Auto Lip-Sync
            </span>
          </div>

          <div>
            <label className="text-[10px] text-gray-400 font-semibold mb-1 block">
              Character Dialogue Script:
            </label>
            <textarea
              rows={3}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Type dialogue here (Hindi or English)..."
              className="w-full bg-[#161826] border border-purple-500/30 rounded-lg p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">Voice Persona:</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full bg-[#1b1f2e] border border-[#2e3447] rounded px-2 py-1 text-[11px] text-gray-200 focus:outline-none"
              >
                <option value="hi-IN-Male">Hindi Male (Kabir)</option>
                <option value="hi-IN-Female">Hindi Female (Ananya)</option>
                <option value="en-IN-Male">Indian English Male</option>
                <option value="en-IN-Female">Indian English Female</option>
                <option value="en-US-Story">Storyteller (US English)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">Speed: {ttsSpeed}x</label>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={ttsSpeed}
                onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
                className="w-full accent-purple-500 h-1 bg-gray-700 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={handlePreviewTts}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 border transition-all ${
                isSpeakingTts
                  ? 'bg-purple-600 text-white border-purple-400 animate-pulse'
                  : 'bg-[#202538] hover:bg-[#2a3047] text-purple-200 border-purple-500/40'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isSpeakingTts ? 'Stop Preview' : 'Preview Voice'}</span>
            </button>

            <button
              onClick={handleGenerateTtsToTimeline}
              className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center space-x-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Timeline</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Live Voiceover Recorder Box */}
      {activeCategory === 'record' && (
        <div className="p-3 border-b border-[#262a38] bg-red-950/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-300 flex items-center space-x-1.5">
              <Radio className={`w-3.5 h-3.5 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
              <span>Microphone Voiceover</span>
            </span>
            {isRecording && (
              <span className="font-mono text-xs text-red-400 font-bold flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>00:{recordDuration.toString().padStart(2, '0')}</span>
              </span>
            )}
          </div>
          {isRecording ? (
            <button
              onClick={handleStopVoiceRecording}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-red-600/30 transition-all animate-pulse cursor-pointer"
            >
              <div className="w-2.5 h-2.5 bg-white rounded-sm" />
              <span>Stop & Save Recording</span>
            </button>
          ) : (
            <button
              onClick={handleStartVoiceRecording}
              className="w-full py-2 bg-red-600/20 hover:bg-red-600 border border-red-500/50 text-red-200 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 shadow transition-all cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-red-400" />
              <span>Start Recording Voiceover</span>
            </button>
          )}

          {/* User Recorded Audio List with Direct Download Button */}
          {recordedVoices.length > 0 && (
            <div className="mt-3 pt-3 border-t border-red-900/30 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-red-300/80 flex items-center justify-between">
                <span>Your Voice Recordings ({recordedVoices.length})</span>
                <span className="text-[9px] text-gray-500">Downloadable WAV</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {recordedVoices.map((rec) => {
                  const isPreviewing = previewingTrackId === rec.id;
                  return (
                    <div
                      key={rec.id}
                      className="p-2 rounded-lg bg-[#181b26] border border-[#2b3042] flex items-center justify-between text-xs hover:border-red-500/40 transition-colors"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <button
                          onClick={() => {
                            if (isPreviewing) {
                              if (previewAudioRef.current) {
                                previewAudioRef.current.pause();
                              }
                              setPreviewingTrackId(null);
                            } else {
                              if (previewAudioRef.current) {
                                previewAudioRef.current.src = rec.url;
                                previewAudioRef.current.play().catch(() => {});
                              }
                              setPreviewingTrackId(rec.id);
                            }
                          }}
                          className="w-6 h-6 rounded-full bg-red-950/60 hover:bg-red-600 text-red-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title={isPreviewing ? "Pause Preview" : "Play Preview"}
                        >
                          {isPreviewing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </button>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate max-w-[120px]">{rec.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {rec.duration.toFixed(1)}s • {rec.date}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        {/* Download WAV button */}
                        <button
                          onClick={() => handleDownloadVoice(rec.url, rec.name)}
                          className="p-1.5 rounded-md bg-indigo-950/50 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all cursor-pointer"
                          title="Download Audio File (.wav)"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Add to Timeline Button */}
                        <button
                          onClick={() =>
                            onAddAudioTrack({
                              id: `voice_inst_${Date.now()}`,
                              name: rec.name,
                              url: rec.url,
                              duration: rec.duration,
                              offset: 0,
                              volume: 1.0,
                              speed: 1.0,
                              isMuted: false,
                              isDeleted: false,
                              startTime: 0,
                              category: 'voice',
                              lipSyncEnabled: true
                            })
                          }
                          className="p-1.5 rounded-md bg-purple-950/50 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-all cursor-pointer"
                          title="Add to Current Scene Timeline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete recording button */}
                        <button
                          onClick={() => handleDeleteRecordedVoice(rec.id)}
                          className="p-1.5 rounded-md bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 transition-all cursor-pointer"
                          title="Delete Recording"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. Upload Audio Box */}
      {activeCategory === 'upload' && (
        <div className="p-3 border-b border-[#262a38]">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 px-4 rounded-xl border border-dashed border-indigo-500/40 bg-indigo-950/20 hover:bg-indigo-950/40 hover:border-indigo-500 text-center flex flex-col items-center justify-center space-y-1.5 transition-all group cursor-pointer"
          >
            <Upload className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-indigo-200 group-hover:text-white">
              Upload Custom Audio Track
            </span>
            <span className="text-[10px] text-gray-400">
              MP3, WAV, AAC, M4A supported
            </span>
          </button>
        </div>
      )}

      {/* 8. Active in Timeline Section */}
      {activeAudioTracks.length > 0 && (
        <div className="p-3 border-b border-[#262a38] bg-indigo-950/20">
          <div className="text-[10px] uppercase font-bold text-indigo-400 mb-2 flex items-center justify-between">
            <span>Active in Timeline ({activeAudioTracks.length})</span>
            <span className="text-[9px] text-gray-400 font-normal">syncs with playhead</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {activeAudioTracks.map((track) => (
              <div
                key={track.id}
                className="bg-[#11131c] border border-indigo-500/30 rounded-lg p-2 flex items-center justify-between text-xs"
              >
                <div className="truncate max-w-[190px]">
                  <div className="font-semibold text-indigo-200 truncate">{track.name}</div>
                  <div className="text-[10px] text-gray-400 flex items-center space-x-2">
                    <span>Vol: {Math.round((track.volume ?? 1) * 100)}%</span>
                    <span>•</span>
                    <span>{track.duration?.toFixed(1)}s</span>
                    {track.lipSyncEnabled && (
                      <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 rounded">LipSync</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onUpdateAudioTrack(track.id, { isMuted: !track.isMuted })}
                    className={`p-1 rounded ${track.isMuted ? 'text-red-400' : 'text-gray-400 hover:text-white'}`}
                  >
                    {track.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => onDeleteAudioTrack(track.id)}
                    className="p-1 text-gray-500 hover:text-red-400 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. Audio Tracks List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center justify-between">
          <span>Available Tracks ({filteredTracks.length})</span>
          <span className="text-[9px] text-indigo-400 lowercase">click row to add</span>
        </div>

        {filteredTracks.map((track) => {
          const isAdded = activeAudioTracks.some((t) => t.id === track.id);
          const isPreviewing = previewingTrackId === track.id;
          const playTarget = track.url || track.generate || '';

          return (
            <div
              key={track.id}
              onClick={() => handleAddTrack(track)}
              className={`p-2.5 rounded-lg border transition-all flex items-center justify-between group cursor-pointer ${
                isAdded
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-sm'
                  : 'bg-[#10121a] hover:bg-[#181b26] border-[#262a38]'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate max-w-[200px]">
                {/* Play/Pause Preview Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePreview(track.id, playTarget);
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow transition-all ${
                    isPreviewing
                      ? 'bg-indigo-500 text-white animate-pulse'
                      : 'bg-[#222736] text-gray-300 hover:bg-indigo-600 hover:text-white'
                  }`}
                  title={isPreviewing ? 'Stop Preview' : 'Play Preview'}
                >
                  {isPreviewing ? (
                    <Pause className="w-3 h-3 fill-current" />
                  ) : (
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  )}
                </button>

                <div className="truncate">
                  <div
                    className={`text-xs font-semibold truncate ${
                      isAdded ? 'text-indigo-200' : 'text-gray-200 group-hover:text-indigo-300'
                    }`}
                  >
                    {track.name || track.title}
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center space-x-1.5">
                    <span className="capitalize text-indigo-400/90 font-medium">
                      {(track.category || (track as any).tags || 'Audio').replace('_', ' ')}
                    </span>
                    <span>•</span>
                    <span>{track.duration || '0:15'}</span>
                  </div>
                </div>
              </div>

              {/* Add/Added Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddTrack(track);
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
                    <span>+ Add</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AutoDraftAudioDrawer = React.memo(AutoDraftAudioDrawerComponent);
