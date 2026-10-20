import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Play, 
  Footprints, 
  Sliders, 
  Clock, 
  Download, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle,
  Video,
  Mic,
  Move
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'workflow' | 'pro_tips'>('quickstart');

  if (!isOpen) return null;

  const quickSteps = [
    {
      step: '1',
      title: 'Choose a Motion Preset',
      desc: 'In the left panel, click "Standard Walk Cycle" or "Friendly Wave" to instantly load fluid keyframe movements into your character.',
      icon: <Footprints className="w-5 h-5 text-violet-400" />
    },
    {
      step: '2',
      title: 'Inspect & Customize the Rig',
      desc: 'Select any joint or bone in the right Rig Inspector to customize angles, adjust secondary spring bounce, or tune positions.',
      icon: <Sliders className="w-5 h-5 text-indigo-400" />
    },
    {
      step: '3',
      title: 'Timeline & Audio Lip-Sync',
      desc: 'Click on the timeline ruler to scrub through frames, add custom keyframes, and align dialogue visemes with mouth movements.',
      icon: <Clock className="w-5 h-5 text-amber-400" />
    },
    {
      step: '4',
      title: 'Real-Time Playback & 1-Click Export',
      desc: 'Press Play to preview the animation in 60 FPS. When satisfied, click "Export Video (MP4)" to generate an offline video file with zero server waiting or credit costs.',
      icon: <Download className="w-5 h-5 text-emerald-400" />
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#151822] border border-studio-border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-studio-border flex items-center justify-between bg-[#191d2a]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Welcome to AnimCraft Studio</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
                  Creator Guide
                </span>
              </h2>
              <p className="text-xs text-studio-muted">
                Your high-performance 2D animation engine with mesh rigging, lip-sync, and instant export.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-studio-muted hover:text-white hover:bg-studio-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-studio-border bg-studio-bg px-5 pt-2 space-x-4">
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'quickstart'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-studio-muted hover:text-white'
            }`}
          >
            🚀 4-Step Quickstart
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'workflow'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-studio-muted hover:text-white'
            }`}
          >
            🧩 Studio Architecture & Sections
          </button>
          <button
            onClick={() => setActiveTab('pro_tips')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'pro_tips'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-studio-muted hover:text-white'
            }`}
          >
            💡 Pro Tips (Beating AutoDraft)
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'quickstart' && (
            <div className="space-y-4">
              <p className="text-xs text-studio-muted">
                Follow these simple steps to make your first 2D animation in less than 60 seconds:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {quickSteps.map((item) => (
                  <div
                    key={item.step}
                    className="p-4 rounded-xl bg-studio-panel border border-studio-border hover:border-indigo-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-400">
                          {item.step}
                        </div>
                        {item.icon}
                      </div>
                      <h3 className="text-xs font-bold text-white mb-1">{item.title}</h3>
                      <p className="text-[11px] text-studio-muted leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-studio-panel border border-studio-border flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 shrink-0">
                  <Footprints className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Left Panel: Motion Presets & Assets</h4>
                  <p className="text-[11px] text-studio-muted leading-relaxed">
                    Contains procedural actions like Walk cycles, Waves, and Idle breathing. Clicking a preset immediately populates keyframe tracks on the timeline for realistic limb movements.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-studio-panel border border-studio-border flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                  <Move className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Center: WebGL Canvas Viewport</h4>
                  <p className="text-[11px] text-studio-muted leading-relaxed">
                    Powered by PixiJS v8. You can pan (hold Alt or Middle-click), zoom (mouse wheel or bottom right toolbar), and inspect skeletal bones and joints rendered at full 60 FPS.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-studio-panel border border-studio-border flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Right Panel: Rig Inspector</h4>
                  <p className="text-[11px] text-studio-muted leading-relaxed">
                    Select any bone (Head, Spine, Upper Arms, Legs) to manually adjust angles via the slider, enable Inverse Kinematics (IK), and observe secondary spring physics parameters.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-studio-panel border border-studio-border flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Bottom: Multi-Track Timeline & Visemes</h4>
                  <p className="text-[11px] text-studio-muted leading-relaxed">
                    Control frame sequencing, scrub through time, add keyframes at specific frames, and sync mouth viseme tags (A, B, C, D, E, F, G, H, X) to match dialogue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pro_tips' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Zero Cloud Delays or Credit Drain</span>
                </div>
                <p className="text-[11px] text-studio-muted leading-relaxed">
                  Unlike AutoDraft where every adjustment requires cloud re-rendering credits, AnimCraft runs entirely in WebGL on your device for instant real-time editing.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Natural Motion via 2D Mesh & Springs</span>
                </div>
                <p className="text-[11px] text-studio-muted leading-relaxed">
                  AutoDraft uses stiff cutouts. AnimCraft uses Delaunay mesh skinning and secondary spring physics so limbs bend smoothly without robotic stiffness.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Sub-Frame Viseme Lip-Sync</span>
                </div>
                <p className="text-[11px] text-studio-muted leading-relaxed">
                  Visemes are mapped using audio envelope classification. The gold blocks in the audio lane show the active mouth shapes (e.g. C for wide open, D for ah, X for closed).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-studio-border bg-[#191d2a] flex items-center justify-between">
          <div className="text-[11px] text-studio-muted flex items-center space-x-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>You can open this guide anytime by clicking "Creator Guide" in the top bar.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/20 flex items-center space-x-1.5"
          >
            <span>Got it, let's animate!</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
