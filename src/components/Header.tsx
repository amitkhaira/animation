import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Video, 
  Sparkles, 
  HelpCircle
} from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface HeaderProps {
  title: string;
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  isExporting: boolean;
  exportProgress: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onExportVideo: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  isPlaying,
  currentFrame,
  totalFrames,
  fps,
  isExporting,
  exportProgress,
  onTogglePlay,
  onReset,
  onExportVideo,
  onOpenGuide
}) => {
  return (
    <header className="h-14 bg-studio-panel border-b border-studio-border px-4 flex items-center justify-between select-none">
      {/* Brand & Project Title */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold tracking-tight text-white">AnimCraft</span>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Studio
            </span>
          </div>
          <div className="text-xs text-studio-muted truncate max-w-[200px]">{title}</div>
        </div>

        <InfoTooltip
          title="AnimCraft 2D Animation Studio"
          description="A complete 2D skeletal animation engine that replaces stiff cutouts with natural 2D mesh bending, IK bone rigging, and audio lip-sync."
          tips={[
            "Click 'Creator Guide' on the right anytime for step-by-step guidance.",
            "Use Motion Presets on the left to quickly test walk cycles and arm waves.",
            "Scrub the timeline at the bottom to inspect each frame in real-time."
          ]}
        />
      </div>

      {/* Center Playback Controls */}
      <div className="flex items-center space-x-3 bg-studio-bg px-3 py-1.5 rounded-lg border border-studio-border">
        <button
          onClick={onReset}
          className="p-1.5 text-studio-muted hover:text-white hover:bg-studio-hover rounded transition-colors"
          title="Rewind to Frame 0"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlay}
          className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 font-medium text-xs transition-all ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <div className="text-xs font-mono text-studio-muted pl-2 border-l border-studio-border">
          <span className="text-white font-semibold">{currentFrame.toString().padStart(3, '0')}</span>
          <span className="text-studio-muted"> / {totalFrames}</span>
          <span className="text-[10px] ml-1 text-studio-muted">({fps} FPS)</span>
        </div>

        <InfoTooltip
          title="Transport & Playback Controls"
          description="Controls real-time animation preview at 60 FPS directly in your browser."
          tips={[
            "Click Play to preview continuous playback.",
            "Rewind returns the playhead directly to frame 0.",
            "Click any frame number on the timeline ruler below to scrub to that instant."
          ]}
          align="center"
        />
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenGuide}
          className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all"
          title="Open interactive beginner guide"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Creator Guide</span>
        </button>

        <button
          onClick={onExportVideo}
          disabled={isExporting}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 border transition-all ${
            isExporting
              ? 'bg-studio-hover text-studio-muted border-studio-border cursor-not-allowed'
              : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>{isExporting ? `Rendering ${exportProgress}%` : 'Export Video (MP4)'}</span>
        </button>

        <InfoTooltip
          title="Client-Side Video Export"
          description="Renders high-definition video frame-by-frame on your device using WebCodecs/MediaRecorder with zero server delay or credit costs."
          tips={[
            "Exports full scene duration as WebM/MP4.",
            "Zero upload needed — stays 100% private on your machine."
          ]}
          align="right"
        />
      </div>
    </header>
  );
};
