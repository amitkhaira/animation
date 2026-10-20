import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Download, 
  Film, 
  Music, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Loader2,
  Sliders,
  Play
} from 'lucide-react';
import { ActiveAudioTrack } from '../types/audio';
import { StudioScene } from '../types/autodraft';
import { VideoExporter } from '../utils/videoExporter';

interface AutoDraftExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioTracks: ActiveAudioTrack[];
  totalDurationSeconds?: number;
  onStartExport?: () => void;
  onExportSeek?: (seconds: number) => void;
  onEndExport?: () => void;
  scenes?: StudioScene[];
  activeSceneId?: string;
  onSelectScene?: (sceneId: string) => void;
}

export const AutoDraftExportModal: React.FC<AutoDraftExportModalProps> = ({
  isOpen,
  onClose,
  audioTracks,
  totalDurationSeconds = 15,
  onStartExport,
  onExportSeek,
  onEndExport,
  scenes = [],
  activeSceneId,
  onSelectScene
}) => {
  const [resolution, setResolution] = useState<'1080p' | '720p'>('1080p');
  const [fps, setFps] = useState<30 | 60>(30);
  const [includeAudio, setIncludeAudio] = useState<boolean>(true);
  const [exportScope, setExportScope] = useState<'all' | 'current'>(
    scenes.length > 1 ? 'all' : 'current'
  );

  const totalCombinedDuration = scenes.length > 0
    ? scenes.reduce((acc, s) => acc + (s.duration || 10), 0)
    : totalDurationSeconds;

  const effectiveDuration = exportScope === 'all' && scenes.length > 0
    ? totalCombinedDuration
    : totalDurationSeconds;

  const [duration, setDuration] = useState<number>(effectiveDuration);

  useEffect(() => {
    if (isOpen) {
      setDuration(effectiveDuration);
    }
  }, [isOpen, effectiveDuration]);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentSeconds, setCurrentSeconds] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [downloadResult, setDownloadResult] = useState<{ filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exporterRef = useRef<VideoExporter | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgressPercent(0);
    setCurrentSeconds(0);
    setStatusMessage('Preparing animation canvas...');
    setError(null);
    setDownloadResult(null);

    // Enter live stage playback recording mode
    onStartExport?.();

    const exporter = new VideoExporter();
    exporterRef.current = exporter;

    const width = resolution === '1080p' ? 1920 : 1280;
    const height = resolution === '1080p' ? 1080 : 720;

    // Determine audio tracks to include
    let exportAudioTracks = audioTracks;
    if (exportScope === 'all' && scenes.length > 0) {
      // Offset audio tracks sequentially per scene
      let timeOffset = 0;
      exportAudioTracks = scenes.flatMap((sc) => {
        const offsetTracks = (sc.audioTracks || []).map((t) => ({
          ...t,
          startTime: (t.startTime || 0) + timeOffset
        }));
        timeOffset += sc.duration || 10;
        return offsetTracks;
      });
    }

    let currentRenderSceneId = activeSceneId;

    try {
      const result = await exporter.exportVideo({
        width,
        height,
        fps,
        durationSeconds: duration,
        audioTracks: exportAudioTracks,
        includeAudio,
        onProgress: (pct, sec) => {
          setProgressPercent(pct);
          setCurrentSeconds(sec);
        },
        onStatusChange: (msg) => {
          setStatusMessage(msg);
        },
        onExportSeek: (sec) => {
          if (exportScope === 'all' && scenes.length > 0) {
            let accumulated = 0;
            let targetScene = scenes[0];
            let relTime = 0;
            for (const sc of scenes) {
              const scDur = sc.duration || 10;
              if (sec < accumulated + scDur) {
                targetScene = sc;
                relTime = sec - accumulated;
                break;
              }
              accumulated += scDur;
            }
            if (targetScene && targetScene.id !== currentRenderSceneId) {
              currentRenderSceneId = targetScene.id;
              onSelectScene?.(targetScene.id);
            }
            onExportSeek?.(relTime);
          } else {
            onExportSeek?.(sec);
          }
        }
      });
      setDownloadResult({ filename: result.filename });
      onEndExport?.();
      setIsExporting(false);
    } catch (err: any) {
      if (!err.message?.includes('cancelled')) {
        setError(err.message || 'Failed to export video.');
      }
      onEndExport?.();
      setIsExporting(false);
    }
  };

  const handleCancel = () => {
    if (exporterRef.current) {
      exporterRef.current.cancel();
    }
    onEndExport?.();
    setIsExporting(false);
    setStatusMessage('');
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150 select-none ${
        isExporting ? 'bg-black/35 backdrop-blur-none pointer-events-auto' : 'bg-black/80 backdrop-blur-md'
      }`}
    >
      <div className="bg-[#161822] border border-[#2d3345] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-[#262b3a] flex items-center justify-between bg-[#12141c]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Export Animation Video
              </h2>
              <p className="text-[11px] text-gray-400">
                1080p Full HD • Synchronized Audio Muxing
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isExporting) handleCancel();
              onClose();
            }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {downloadResult && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-700/50 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-emerald-200">
                Export Complete!
              </div>
              <div className="text-xs text-emerald-300/80 font-mono">
                {downloadResult.filename}
              </div>
              <p className="text-[11px] text-gray-400">
                Your video has been downloaded directly to your computer.
              </p>
            </div>
          )}

          {isExporting ? (
            /* Exporting Progress State */
            <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                <span className="absolute font-mono text-sm font-bold text-white">
                  {progressPercent}%
                </span>
              </div>
              <div className="space-y-1 w-full max-w-xs">
                <div className="text-xs font-semibold text-gray-200">
                  {statusMessage}
                </div>
                <div className="text-[11px] font-mono text-blue-400">
                  {currentSeconds.toFixed(1)}s / {duration.toFixed(1)}s recorded
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-[#222736] rounded-full h-2 overflow-hidden mt-2 border border-[#343b52]">
                  <div
                    className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 h-full transition-all duration-100"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <button
                onClick={handleCancel}
                className="mt-2 px-4 py-1.5 rounded-lg bg-[#222736] hover:bg-red-950/40 hover:text-red-300 text-xs text-gray-300 border border-[#333a50] transition-colors"
              >
                Cancel Export
              </button>
            </div>
          ) : (
            /* Settings State */
            <div className="space-y-4">
              {/* Multi-Scene Scope Selector */}
              {scenes.length > 1 && (
                <div>
                  <label className="text-[11px] uppercase font-bold text-gray-400 block mb-2">
                    Export Scope
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setExportScope('all')}
                      className={`p-3 rounded-xl border flex flex-col text-left transition-all cursor-pointer ${
                        exportScope === 'all'
                          ? 'border-indigo-500 bg-indigo-950/30 text-white ring-1 ring-indigo-500/40'
                          : 'border-[#2d3345] bg-[#12141c] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <span className="text-xs font-bold flex items-center space-x-1.5">
                        <Film className="w-3.5 h-3.5 text-indigo-400" />
                        <span>All Scenes ({scenes.length})</span>
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        Sequential video ({totalCombinedDuration}s)
                      </span>
                    </button>

                    <button
                      onClick={() => setExportScope('current')}
                      className={`p-3 rounded-xl border flex flex-col text-left transition-all cursor-pointer ${
                        exportScope === 'current'
                          ? 'border-indigo-500 bg-indigo-950/30 text-white ring-1 ring-indigo-500/40'
                          : 'border-[#2d3345] bg-[#12141c] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      <span className="text-xs font-bold flex items-center space-x-1.5">
                        <Play className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Current Scene</span>
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        Active shot only ({totalDurationSeconds}s)
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Resolution Selector */}
              <div>
                <label className="text-[11px] uppercase font-bold text-gray-400 block mb-2">
                  Resolution
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setResolution('1080p')}
                    className={`p-3 rounded-xl border flex flex-col text-left transition-all ${
                      resolution === '1080p'
                        ? 'border-blue-500 bg-blue-950/20 text-white ring-1 ring-blue-500/40'
                        : 'border-[#2d3345] bg-[#12141c] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <span className="text-xs font-bold">1080p Full HD</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">1920 × 1080 (Best Quality)</span>
                  </button>

                  <button
                    onClick={() => setResolution('720p')}
                    className={`p-3 rounded-xl border flex flex-col text-left transition-all ${
                      resolution === '720p'
                        ? 'border-blue-500 bg-blue-950/20 text-white ring-1 ring-blue-500/40'
                        : 'border-[#2d3345] bg-[#12141c] text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <span className="text-xs font-bold">720p HD</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">1280 × 720 (Faster Render)</span>
                  </button>
                </div>
              </div>

              {/* Frame Rate Selector */}
              <div>
                <label className="text-[11px] uppercase font-bold text-gray-400 block mb-2">
                  Frame Rate
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFps(30)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      fps === 30
                        ? 'border-blue-500 bg-blue-950/20 text-white font-bold'
                        : 'border-[#2d3345] bg-[#12141c] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs">30 FPS (Standard)</span>
                  </button>
                  <button
                    onClick={() => setFps(60)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      fps === 60
                        ? 'border-blue-500 bg-blue-950/20 text-white font-bold'
                        : 'border-[#2d3345] bg-[#12141c] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs">60 FPS (Ultra Smooth)</span>
                  </button>
                </div>
              </div>

              {/* Audio Inclusion Toggle */}
              <div className="p-3 bg-[#12141c] rounded-xl border border-[#2d3345] flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Music className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Include Timeline Audio
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {audioTracks.length > 0
                        ? `${audioTracks.length} active audio track(s) will be muxed`
                        : 'No active audio tracks (Silent video)'}
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeAudio}
                  onChange={(e) => setIncludeAudio(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                />
              </div>

              {/* Duration Setting */}
              <div>
                <div className="flex items-center justify-between text-[11px] uppercase font-bold text-gray-400 mb-1">
                  <span>Export Duration</span>
                  <span className="font-mono text-blue-400 font-bold">{duration}s</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="30"
                  step="1"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full accent-blue-500 bg-gray-800 rounded h-1.5 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 border-t border-[#262b3a] bg-[#12141c] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-[#222736] transition-colors"
          >
            {downloadResult ? 'Close' : 'Cancel'}
          </button>

          {!downloadResult ? (
            <button
              onClick={handleStartExport}
              disabled={isExporting}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-lg ${
                isExporting
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 active:scale-95'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Start Export & Download'}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setDownloadResult(null);
                handleStartExport();
              }}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-95 transition-all flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Another Video</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
