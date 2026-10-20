import React, { useEffect, useRef, useState } from 'react';
import { StudioRenderer } from '../engine/renderer/PixiApp';
import { CharacterRigNode } from '../engine/renderer/CharacterRig';
import { CharacterPuppet } from '../types/skeleton';
import { CameraState } from '../types/project';
import { ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface CanvasViewProps {
  puppet: CharacterPuppet | null;
  camera: CameraState;
  selectedBoneId: string | null;
  onSelectBone: (boneId: string) => void;
  onUpdateCamera: (cam: Partial<CameraState>) => void;
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  puppet,
  camera,
  selectedBoneId,
  onSelectBone,
  onUpdateCamera
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<StudioRenderer | null>(null);
  const rigNodeRef = useRef<CharacterRigNode | null>(null);

  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; camX: number; camY: number }>({
    x: 0,
    y: 0,
    camX: 0,
    camY: 0
  });

  // Initialize WebGL PixiApp
  useEffect(() => {
    if (!containerRef.current) return;
    let isMounted = true;

    const renderer = new StudioRenderer();
    rendererRef.current = renderer;

    renderer.init(containerRef.current).then((canvas) => {
      if (!isMounted || !canvas) {
        renderer.destroy();
        return;
      }
      renderer.setCamera(camera.x, camera.y, camera.zoom);

      if (puppet) {
        const rigNode = new CharacterRigNode(puppet);
        rigNodeRef.current = rigNode;
        renderer.characterContainer.addChild(rigNode);
        rigNode.setSelectedBone(selectedBoneId);
        rigNode.updatePose();
      }
    });

    return () => {
      isMounted = false;
      renderer.destroy();
      rendererRef.current = null;
      rigNodeRef.current = null;
    };
  }, []);

  // Update Camera transform
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setCamera(camera.x, camera.y, camera.zoom);
    }
  }, [camera]);

  // Update Rig Selected Bone & Pose
  useEffect(() => {
    if (rigNodeRef.current && puppet) {
      rigNodeRef.current.setPuppet(puppet);
      rigNodeRef.current.setSelectedBone(selectedBoneId);
      rigNodeRef.current.updatePose();
    } else if (!rigNodeRef.current && rendererRef.current && puppet) {
      const rigNode = new CharacterRigNode(puppet);
      rigNodeRef.current = rigNode;
      rendererRef.current.characterContainer.addChild(rigNode);
      rigNode.setSelectedBone(selectedBoneId);
      rigNode.updatePose();
    }
  }, [selectedBoneId, puppet]);

  // Handle Pan / Zoom gestures
  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click or Space+Click or right click triggers pan
    if (e.button === 1 || e.button === 2 || e.altKey) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        camX: camera.x,
        camY: camera.y
      };
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = (e.clientX - panStartRef.current.x) / camera.zoom;
      const dy = (e.clientY - panStartRef.current.y) / camera.zoom;
      onUpdateCamera({
        x: panStartRef.current.camX + dx,
        y: panStartRef.current.camY + dy
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(4.0, Math.max(0.2, camera.zoom * zoomDelta));
    onUpdateCamera({ zoom: newZoom });
  };

  return (
    <div
      className="relative flex-1 h-full overflow-hidden bg-[#0c0e14]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div ref={containerRef} className="w-full h-full block cursor-crosshair" />

      {/* Floating Canvas Camera Toolbar */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-1 bg-studio-panel/90 backdrop-blur border border-studio-border p-1 rounded-lg shadow-xl">
        <button
          onClick={() => onUpdateCamera({ zoom: Math.min(4.0, camera.zoom * 1.2) })}
          className="p-1.5 text-studio-muted hover:text-white rounded hover:bg-studio-hover"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-mono text-studio-muted px-1.5 select-none">
          {Math.round(camera.zoom * 100)}%
        </span>
        <button
          onClick={() => onUpdateCamera({ zoom: Math.max(0.2, camera.zoom / 1.2) })}
          className="p-1.5 text-studio-muted hover:text-white rounded hover:bg-studio-hover"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-studio-border mx-1" />
        <button
          onClick={() => onUpdateCamera({ x: 0, y: 0, zoom: 1.0 })}
          className="p-1.5 text-studio-muted hover:text-white rounded hover:bg-studio-hover"
          title="Reset View"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Canvas Viewport Info Tag */}
      <div className="absolute top-4 left-4 bg-studio-panel/80 backdrop-blur border border-studio-border/60 px-2.5 py-1 rounded text-[11px] text-studio-muted flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>PixiJS v8 2D WebGL Engine</span>
        <span className="text-studio-border">|</span>
        <span>Hold Alt/Middle Click to Pan</span>
        <InfoTooltip
          title="2D WebGL Viewport"
          description="Renders the skeleton, joints, and deformable mesh at 60 FPS directly using GPU acceleration."
          tips={[
            "Hold Alt and drag (or Middle-Click drag) to pan the canvas around.",
            "Scroll mouse wheel or use the zoom buttons in the bottom right to zoom in/out.",
            "Click Maximize icon to reset camera focus to center."
          ]}
          align="left"
        />
      </div>
    </div>
  );
};
