import React from 'react';
import { Skeleton } from '../types/skeleton';
import { Sliders, Activity, Zap } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface InspectorProps {
  skeleton: Skeleton | null;
  selectedBoneId: string | null;
  onSelectBone: (boneId: string) => void;
  onUpdateBoneRotation: (boneId: string, radians: number) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
  skeleton,
  selectedBoneId,
  onSelectBone,
  onUpdateBoneRotation
}) => {
  if (!skeleton) {
    return (
      <div className="w-72 bg-studio-panel border-l border-studio-border p-4 text-studio-muted text-xs">
        No character selected
      </div>
    );
  }

  const selectedBone = selectedBoneId ? skeleton.bones[selectedBoneId] : null;

  return (
    <div className="w-72 bg-studio-panel border-l border-studio-border flex flex-col h-full select-none">
      {/* Panel Header */}
      <div className="h-10 border-b border-studio-border px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-white tracking-wide">RIG INSPECTOR</span>
        </div>
        <InfoTooltip
          title="Rig Inspector & Bone Controls"
          description="Direct access to skeletal joints, rotation angles, inverse kinematics, and spring oscillation parameters."
          tips={[
            "Click on any bone name (e.g. Spine or Right Forearm) to inspect it.",
            "Drag the Local Rotation slider to rotate the bone in real-time.",
            "Changes are reflected live in the central WebGL canvas."
          ]}
          align="right"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Bone Hierarchy Tree */}
        <div>
          <label className="text-[11px] font-semibold text-studio-muted uppercase tracking-wider block mb-2">
            Skeleton Bones ({skeleton.boneOrder.length})
          </label>
          <div className="bg-studio-bg rounded-lg border border-studio-border p-1.5 space-y-0.5 max-h-48 overflow-y-auto">
            {skeleton.boneOrder.map((boneId) => {
              const bone = skeleton.bones[boneId];
              const isSelected = selectedBoneId === boneId;
              return (
                <button
                  key={boneId}
                  onClick={() => onSelectBone(boneId)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-medium shadow-sm'
                      : 'text-studio-text hover:bg-studio-hover'
                  }`}
                >
                  <span className="truncate">{bone.name}</span>
                  <span className="text-[10px] opacity-60 font-mono">{bone.length}px</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Bone Properties */}
        {selectedBone ? (
          <div className="space-y-4 pt-2 border-t border-studio-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300">{selectedBone.name}</span>
              <span className="text-[10px] bg-studio-bg px-2 py-0.5 rounded text-studio-muted border border-studio-border">
                {selectedBone.id}
              </span>
            </div>

            {/* Bone Rotation Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-studio-muted">Local Rotation</span>
                <span className="font-mono text-white">
                  {Math.round((selectedBone.rotation * 180) / Math.PI)}°
                </span>
              </div>
              <input
                type="range"
                min={-Math.PI}
                max={Math.PI}
                step={0.02}
                value={selectedBone.rotation}
                onChange={(e) => onUpdateBoneRotation(selectedBone.id, parseFloat(e.target.value))}
                className="w-full accent-indigo-500 bg-studio-bg rounded h-1.5 cursor-pointer"
              />
            </div>

            {/* Inverse Kinematics (IK) Controls */}
            <div className="p-3 bg-studio-bg rounded-lg border border-studio-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inverse Kinematics (IK)</span>
                </div>
                <InfoTooltip
                  title="Inverse Kinematics (IK)"
                  description="Calculates upper and lower limb joint rotations automatically from target positions."
                  tips={[
                    "Solves elbow and knee bends naturally.",
                    "Allows natural hand and foot placement without manual bone math."
                  ]}
                  align="right"
                />
              </div>
              <p className="text-[11px] text-studio-muted leading-relaxed">
                2-Bone analytic solver enabled for natural limb and pose gestures.
              </p>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-studio-muted">Auto-Bend Joint</span>
                <span className="text-emerald-400 font-medium">Active</span>
              </div>
            </div>

            {/* Spring Dynamics / Secondary Physics */}
            <div className="p-3 bg-studio-bg rounded-lg border border-studio-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                  <Activity className="w-3.5 h-3.5 text-rose-400" />
                  <span>Spring Physics (Secondary Motion)</span>
                </div>
                <InfoTooltip
                  title="Secondary Spring Physics"
                  description="Simulates realistic inertia and elasticity on loose elements like hair, loose clothing, or accessories."
                  tips={[
                    "Stiffness controls return speed.",
                    "Damping dampens oscillation to prevent infinite wobble."
                  ]}
                  align="right"
                />
              </div>
              <p className="text-[11px] text-studio-muted leading-relaxed">
                Verlet oscillation creates organic bounce on hair and clothing without manual keyframing.
              </p>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-studio-muted">Elasticity (Stiffness)</span>
                <span className="text-rose-300 font-mono">0.20</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-studio-muted">
            Select a bone above to edit angles and properties
          </div>
        )}
      </div>
    </div>
  );
};
