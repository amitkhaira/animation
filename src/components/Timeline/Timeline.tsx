import React, { useRef } from 'react';
import { Key, Mic } from 'lucide-react';
import { AnimationTrack } from '../../types/animation';
import { AudioTrack } from '../../types/lipsync';
import { InfoTooltip } from '../InfoTooltip';

interface TimelineProps {
  currentFrame: number;
  totalFrames: number;
  fps: number;
  isPlaying: boolean;
  tracks: AnimationTrack[];
  audioTracks: AudioTrack[];
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
  onSeek: (frame: number) => void;
  onAddKeyframe: (trackId: string, frame: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  currentFrame,
  totalFrames,
  tracks,
  audioTracks,
  selectedTrackId,
  onSelectTrack,
  onSeek,
  onAddKeyframe
}) => {
  const rulerRef = useRef<HTMLDivElement | null>(null);

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const frame = Math.max(0, Math.min(totalFrames, Math.round((clickX / rect.width) * totalFrames)));
    onSeek(frame);
  };

  const playheadPercent = (currentFrame / totalFrames) * 100;

  return (
    <div className="h-64 bg-studio-panel border-t border-studio-border flex flex-col select-none">
      {/* Timeline Controls Subheader */}
      <div className="h-9 border-b border-studio-border px-4 flex items-center justify-between bg-studio-panel/50">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-white tracking-wide">TIMELINE</span>
          <span className="text-[10px] text-studio-muted bg-studio-bg px-2 py-0.5 rounded border border-studio-border">
            {tracks.length} Tracks
          </span>
          <InfoTooltip
            title="Timeline & Keyframe Sequencing"
            description="Controls frame timing and smooth interpolation curves across bones and audio cues."
            tips={[
              "Click any mark on the time ruler to scrub directly to that frame.",
              "Select a track on the left and click 'Add Keyframe' to capture the current pose.",
              "Gold blocks in the audio lane show mouth visemes for automatic lip-syncing."
            ]}
            align="left"
          />
        </div>

        <div className="flex items-center space-x-2">
          {selectedTrackId && (
            <button
              onClick={() => onAddKeyframe(selectedTrackId, currentFrame)}
              className="text-[11px] flex items-center space-x-1 px-2 py-1 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors"
            >
              <Key className="w-3 h-3" />
              <span>Add Keyframe @ {currentFrame}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Timeline Workspace: Left Tracks Headers & Right Keyframe Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Track Names */}
        <div className="w-56 border-r border-studio-border bg-studio-bg/60 flex flex-col overflow-y-auto">
          {/* Header spacer aligned with ruler */}
          <div className="h-7 border-b border-studio-border px-3 flex items-center text-[10px] font-semibold text-studio-muted">
            TRACK NAME
          </div>

          {/* Audio Tracks Header */}
          {audioTracks.map((audio) => (
            <div
              key={audio.id}
              className="h-10 border-b border-studio-border/60 px-3 flex items-center space-x-2 text-xs text-amber-300 bg-amber-500/5 font-medium"
            >
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">{audio.name}</span>
            </div>
          ))}

          {/* Animation Tracks Headers */}
          {tracks.map((track) => {
            const isSelected = selectedTrackId === track.id;
            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track.id)}
                className={`h-9 border-b border-studio-border/60 px-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-indigo-600/20 text-indigo-200 border-l-2 border-l-indigo-500'
                    : 'text-studio-text hover:bg-studio-hover'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span className="truncate">{track.name}</span>
                </div>
                <span className="text-[10px] text-studio-muted font-mono">{track.keyframes.length} keys</span>
              </div>
            );
          })}
        </div>

        {/* Right Ruler & Keyframe Tracks Area */}
        <div className="flex-1 flex flex-col overflow-x-auto relative">
          {/* Time Ruler */}
          <div
            ref={rulerRef}
            onClick={handleRulerClick}
            className="h-7 border-b border-studio-border bg-[#141822] relative cursor-pointer flex items-center"
          >
            {/* Step markers */}
            {Array.from({ length: Math.floor(totalFrames / 10) + 1 }).map((_, i) => {
              const frameMark = i * 10;
              const leftPercent = (frameMark / totalFrames) * 100;
              return (
                <div
                  key={frameMark}
                  className="absolute top-0 bottom-0 flex flex-col justify-end"
                  style={{ left: `${leftPercent}%` }}
                >
                  <span className="text-[9px] font-mono text-studio-muted mb-0.5 -translate-x-1/2">
                    {frameMark}
                  </span>
                  <div className="w-px h-2 bg-studio-border" />
                </div>
              );
            })}

            {/* Playhead Marker on Ruler */}
            <div
              className="absolute top-0 bottom-0 w-3 -ml-1.5 z-20 flex flex-col items-center pointer-events-none"
              style={{ left: `${playheadPercent}%` }}
            >
              <div className="w-3 h-3 bg-rose-500 rounded-sm rotate-45 -mt-1 shadow-md shadow-rose-500/50" />
            </div>
          </div>

          {/* Keyframe Track Rows Container */}
          <div className="flex-1 overflow-y-auto relative bg-[#0f1219]">
            {/* Playhead Red Vertical Guide Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500/80 z-10 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.6)]"
              style={{ left: `${playheadPercent}%` }}
            />

            {/* Audio Viseme Track Row */}
            {audioTracks.map((audio) => (
              <div
                key={audio.id}
                className="h-10 border-b border-studio-border/40 relative bg-amber-500/5 flex items-center"
              >
                {audio.cues.map((cue) => {
                  const startPct = (cue.startFrame / totalFrames) * 100;
                  const widthPct = ((cue.endFrame - cue.startFrame) / totalFrames) * 100;
                  return (
                    <div
                      key={cue.id}
                      className="absolute h-6 rounded bg-amber-500/30 border border-amber-400/50 flex items-center justify-center text-[10px] font-bold text-amber-200"
                      style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                      title={`Viseme ${cue.viseme} (${cue.startFrame}-${cue.endFrame})`}
                    >
                      {cue.viseme}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Animation Tracks Keyframe Rows */}
            {tracks.map((track) => {
              const isSelected = selectedTrackId === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => onSelectTrack(track.id)}
                  className={`h-9 border-b border-studio-border/30 relative flex items-center ${
                    isSelected ? 'bg-indigo-500/5' : ''
                  }`}
                >
                  {/* Subtle track lane grid lines */}
                  {Array.from({ length: Math.floor(totalFrames / 10) + 1 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 w-px bg-studio-border/20 pointer-events-none"
                      style={{ left: `${(i * 10 / totalFrames) * 100}%` }}
                    />
                  ))}

                  {/* Keyframe diamonds */}
                  {track.keyframes.map((kf) => {
                    const kfPercent = (kf.frame / totalFrames) * 100;
                    return (
                      <div
                        key={kf.id}
                        className="absolute w-3 h-3 bg-indigo-400 border border-white/80 rounded-sm rotate-45 -ml-1.5 hover:scale-125 transition-transform cursor-pointer shadow"
                        style={{ left: `${kfPercent}%` }}
                        title={`Frame ${kf.frame}: ${kf.value.toFixed(2)} (${kf.easing})`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
