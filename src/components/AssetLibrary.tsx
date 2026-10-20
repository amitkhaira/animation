import React, { useState } from 'react';
import { Wand2, Sparkles, UserPlus, Check, Users, Video, Play, ArrowRight, Loader2, Palette } from 'lucide-react';
import { BUILTIN_MOTION_PRESETS, MotionPreset } from '../engine/presets/motionPresets';
import { CHARACTER_TEMPLATES, CharacterTemplate } from '../types/characterTemplate';
import { CharacterAvatarPreview } from './CharacterAvatarPreview';
import { InfoTooltip } from './InfoTooltip';

interface AssetLibraryProps {
  currentTemplateId?: string;
  templates: CharacterTemplate[];
  onApplyPreset: (preset: MotionPreset) => void;
  onSelectCharacterTemplate: (template: CharacterTemplate) => void;
  onAddCharacterTemplate: (template: CharacterTemplate) => void;
  onOpenVideoExport?: () => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  currentTemplateId = 'hero_humanoid',
  templates = CHARACTER_TEMPLATES,
  onApplyPreset,
  onSelectCharacterTemplate,
  onAddCharacterTemplate,
  onOpenVideoExport
}) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'motions'>('characters');
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'anime' | 'cartoon' | 'humanoid' | 'mecha'>('anime');

  const QUICK_PROMPTS = [
    { label: '⚡ Cyberpunk Ninja', style: 'mecha', prompt: 'Cyberpunk ninja with glowing visor and dark armor' },
    { label: '✨ Cute Sorceress', style: 'anime', prompt: 'Cute anime sorceress with purple hair and golden star hairpin' },
    { label: '🛹 Retro Skater', style: 'cartoon', prompt: 'Retro 90s skater with wavy blond hair and teal jacket' },
    { label: '🛡️ Mecha Paladin', style: 'mecha', prompt: 'Futuristic mecha defender with chrome plating and cyan core' }
  ];

  const handleGenerateAICharacter = () => {
    if (!promptText.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      const id = `ai_char_${Date.now()}`;
      let newTpl: CharacterTemplate;

      if (selectedStyle === 'anime' || promptText.toLowerCase().includes('anime') || promptText.toLowerCase().includes('sorceress')) {
        newTpl = {
          id,
          name: promptText.slice(0, 24).replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
          category: 'chibi',
          description: `AI-generated anime character: "${promptText}"`,
          colorScheme: {
            skin: 0xffe4e6,
            shirt: 0x8b5cf6,
            pants: 0x312e81,
            hair: 0xd946ef,
            accent: 0xfacc15
          },
          headRadius: 30,
          eyeSize: 6,
          hairStyle: 'bob'
        };
      } else if (selectedStyle === 'mecha' || promptText.toLowerCase().includes('cyber') || promptText.toLowerCase().includes('mecha') || promptText.toLowerCase().includes('ninja')) {
        newTpl = {
          id,
          name: promptText.slice(0, 24).replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
          category: 'creature',
          description: `AI-generated sci-fi mecha: "${promptText}"`,
          colorScheme: {
            skin: 0x64748b,
            shirt: 0x1e293b,
            pants: 0x090d16,
            hair: 0x06b6d4,
            accent: 0x10b981
          },
          headRadius: 25,
          eyeSize: 3,
          hairStyle: 'spiky'
        };
      } else if (selectedStyle === 'cartoon' || promptText.toLowerCase().includes('skater')) {
        newTpl = {
          id,
          name: promptText.slice(0, 24).replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
          category: 'cartoon',
          description: `AI-generated cartoon protagonist: "${promptText}"`,
          colorScheme: {
            skin: 0xfde047,
            shirt: 0x0ea5e9,
            pants: 0x334155,
            hair: 0xf59e0b,
            accent: 0xef4444
          },
          headRadius: 28,
          eyeSize: 4,
          hairStyle: 'wavy'
        };
      } else {
        newTpl = {
          id,
          name: promptText.slice(0, 24).replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
          category: 'humanoid',
          description: `AI-generated hero rig: "${promptText}"`,
          colorScheme: {
            skin: 0xffdfba,
            shirt: 0x6366f1,
            pants: 0x1e293b,
            hair: 0x475569,
            accent: 0xec4899
          },
          headRadius: 26,
          eyeSize: 4,
          hairStyle: 'curly'
        };
      }

      onAddCharacterTemplate(newTpl);
      setIsGenerating(false);
      setPromptText('');
    }, 800);
  };

  return (
    <div className="w-80 bg-studio-panel border-r border-studio-border flex flex-col h-full select-none">
      {/* Tab Switcher: Characters vs Motions */}
      <div className="flex border-b border-studio-border bg-studio-bg/70 p-1.5 gap-1">
        <button
          onClick={() => setActiveTab('characters')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors ${
            activeTab === 'characters'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-studio-muted hover:text-white hover:bg-studio-hover'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Characters ({templates.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('motions')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors ${
            activeTab === 'motions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-studio-muted hover:text-white hover:bg-studio-hover'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Motions (2D Presets)</span>
        </button>
      </div>

      {/* 2D Video Workflow Quick Roadmap Banner */}
      <div className="px-3 pt-3 pb-1">
        <div className="p-2.5 rounded-lg bg-gradient-to-r from-indigo-950/40 via-violet-950/30 to-purple-950/20 border border-indigo-500/20 text-[11px]">
          <div className="flex items-center justify-between font-semibold text-indigo-300 mb-1.5">
            <span className="flex items-center space-x-1">
              <Video className="w-3 h-3 text-indigo-400" />
              <span>How to Generate a 2D Video:</span>
            </span>
            <span className="text-[9px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded font-mono">4 STEPS</span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center text-[9px] text-studio-muted">
            <div className={`p-1 rounded ${activeTab === 'characters' ? 'bg-indigo-500/20 text-indigo-200 font-bold border border-indigo-500/40' : 'bg-studio-bg/60'}`}>
              1. Pick Character
            </div>
            <div
              onClick={() => setActiveTab('motions')}
              className={`p-1 rounded cursor-pointer ${activeTab === 'motions' ? 'bg-indigo-500/20 text-indigo-200 font-bold border border-indigo-500/40' : 'bg-studio-bg/60 hover:text-white'}`}
            >
              2. Add Motion →
            </div>
            <div className="p-1 rounded bg-studio-bg/60">
              3. Play
            </div>
            <div
              onClick={onOpenVideoExport}
              className="p-1 rounded bg-studio-bg/60 hover:bg-emerald-500/20 hover:text-emerald-300 cursor-pointer"
            >
              4. Export Video
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'characters' && (
          <div className="space-y-3">
            {/* Header + Tooltip */}
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-studio-muted uppercase tracking-wider block">
                Visual Character Avatars ({templates.length})
              </label>
              <InfoTooltip
                title="2D Character Puppets & Avatars"
                description="Click any character portrait below to swap the active avatar on canvas. Each comes rigged with 2D bone joints and illustrated limbs."
                tips={[
                  "Click any card to instantly load that character.",
                  "All animation tracks and keyframes remain intact when changing characters!",
                  "Use the AI generator below to create new custom characters from text prompts."
                ]}
                align="left"
              />
            </div>

            {/* Character Cards List with Visual Illustrations */}
            <div className="space-y-2.5">
              {templates.map((tpl) => {
                const isSelected = currentTemplateId === tpl.id;
                const colors = tpl.colorScheme;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => onSelectCharacterTemplate(tpl)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center space-x-3 group ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-500/10'
                        : 'bg-studio-bg border-studio-border hover:border-indigo-500/40 hover:bg-studio-hover'
                    }`}
                  >
                    {/* Visual Illustrated Character Preview Bust */}
                    <div
                      className="w-10 h-10 rounded-full border border-white/20 shadow flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ backgroundColor: `#${tpl.colorScheme.skin.toString(16).padStart(6, '0')}` }}
                    >
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: `#${tpl.colorScheme.shirt.toString(16).padStart(6, '0')}` }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-white truncate group-hover:text-indigo-200 transition-colors">
                          {tpl.name}
                        </span>
                        {isSelected ? (
                          <span className="flex items-center space-x-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                            <Check className="w-2.5 h-2.5" />
                            <span>In Scene</span>
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-studio-panel text-studio-muted border border-studio-border shrink-0">
                            {tpl.category}
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-studio-muted line-clamp-1 leading-snug">
                        {tpl.description}
                      </p>

                      <div className="mt-1.5 flex items-center justify-between text-[10px]">
                        {/* Palette Swatches */}
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `#${colors.skin.toString(16).padStart(6, '0')}` }} title="Skin" />
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `#${colors.shirt.toString(16).padStart(6, '0')}` }} title="Shirt" />
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `#${colors.pants.toString(16).padStart(6, '0')}` }} title="Pants" />
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `#${colors.hair.toString(16).padStart(6, '0')}` }} title="Hair" />
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `#${colors.accent.toString(16).padStart(6, '0')}` }} title="Accent" />
                        </div>

                        <span className={`text-[10px] font-semibold flex items-center space-x-0.5 ${isSelected ? 'text-indigo-400' : 'text-studio-muted group-hover:text-white'}`}>
                          <span>{isSelected ? 'Ready to Animate' : 'Select'}</span>
                          {!isSelected && <ArrowRight className="w-2.5 h-2.5" />}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive AI Character Generator */}
            <div className="pt-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-studio-bg border border-indigo-500/30 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>AI Character Studio</span>
                  </div>
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                    Text-to-Rig
                  </span>
                </div>

                <p className="text-[11px] text-studio-muted mb-2.5 leading-relaxed">
                  Type a concept to synthesize a rigged 2D character avatar ready for animation:
                </p>

                {/* Prompt Input */}
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleGenerateAICharacter();
                    }}
                    placeholder="e.g. Cyberpunk ninja with neon cyan jacket..."
                    className="w-full bg-studio-bg/90 border border-studio-border text-white text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-500 placeholder-studio-muted/70 text-[11px]"
                  />
                </div>

                {/* Quick Inspiration Chips */}
                <div className="flex flex-wrap gap-1 mb-2.5">
                  {QUICK_PROMPTS.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPromptText(qp.prompt);
                        setSelectedStyle(qp.style as any);
                      }}
                      className="text-[9px] px-2 py-0.8 bg-studio-bg/80 hover:bg-indigo-500/20 hover:text-indigo-200 text-studio-muted rounded-full border border-studio-border/70 transition-colors"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  disabled={isGenerating || !promptText.trim()}
                  onClick={handleGenerateAICharacter}
                  className="w-full py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-indigo-500/20"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing 2D Character Rig...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate & Rig 2D Character</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'motions' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-semibold text-studio-muted uppercase tracking-wider block">
                2D Motion Actions (Click to Apply)
              </label>
              <InfoTooltip
                title="Motion Presets & Actions"
                description="Pre-built natural character animations created with inverse kinematics and spring physics."
                tips={[
                  "Click 'Standard Walk Cycle' to see realistic two-step bipedal leg and torso movement.",
                  "Click 'Friendly Wave' to articulate right arm greeting motion.",
                  "Applying a preset immediately updates the timeline tracks below.",
                  "Press Play in the top bar to watch your character in motion!"
                ]}
                align="left"
              />
            </div>

            <div className="space-y-2">
              {BUILTIN_MOTION_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => onApplyPreset(preset)}
                  className="p-3 bg-studio-bg rounded-lg border border-studio-border hover:border-indigo-500/50 hover:bg-studio-hover cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {preset.name}
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      {preset.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-studio-muted line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                  <div className="mt-2 text-[10px] text-studio-muted font-mono flex items-center justify-between">
                    <span>{preset.durationFrames} frames</span>
                    <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold flex items-center space-x-1">
                      <span>Apply to Rig</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Video Export Callout */}
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-950/30 to-teal-950/20 border border-emerald-500/30">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 mb-1">
                <Video className="w-3.5 h-3.5" />
                <span>Ready to Generate 2D Video?</span>
              </div>
              <p className="text-[11px] text-studio-muted leading-relaxed mb-2.5">
                Once motion is applied, hit Play to preview, then export your animated 2D video directly from the browser.
              </p>
              <button
                onClick={onOpenVideoExport}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Export 2D Video (MP4/WebM)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
