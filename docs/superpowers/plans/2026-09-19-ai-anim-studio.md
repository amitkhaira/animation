# AnimCraft (2D AI Animation Studio) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a high-performance web/desktop-ready 2D animation studio featuring automated bone/mesh rigging, multi-track timeline, audio-driven viseme lip-sync, and client-side video rendering.

**Architecture:** A modern React 19 + TypeScript + Vite frontend integrating a PixiJS v8 2D WebGL/WebGPU canvas for skeletal mesh deformation, a Web Audio API audio engine with phoneme-to-viseme extraction, a multi-track keyframing timeline, and an offscreen canvas video exporter.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, PixiJS v8, Vitest, Web Audio API, WebCodecs API.

---

### File Structure Map

```
/Users/B0322527/.gemini/antigravity/scratch/ai-anim-studio/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types/
│   │   ├── skeleton.ts        # Bone hierarchy, IK targets, transforms
│   │   ├── animation.ts       # Keyframes, tracks, easing curves, clips
│   │   ├── lipsync.ts         # Phoneme/viseme definitions & timing
│   │   └── project.ts         # Scenes, layers, assets
│   ├── engine/
│   │   ├── math/
│   │   │   ├── matrix2d.ts    # Affine transform math & 2D vectors
│   │   │   ├── ik.ts          # Two-bone analytic CCD / FABRIK IK solver
│   │   │   └── spring.ts      # Verlet integration for secondary spring physics
│   │   ├── mesh/
│   │   │   ├── triangulation.ts # Delaunay triangulation for character mesh
│   │   │   └── skinning.ts    # Linear blend skinning weights calculation
│   │   ├── skeleton/
│   │   │   └── skeleton.ts    # Bone hierarchy manager & world transform cache
│   │   ├── lipsync/
│   │   │   └── visemeMapper.ts # Audio envelope/frequency to viseme classifier
│   │   └── renderer/
│   │       ├── PixiApp.ts     # PixiJS v8 Application wrapper & canvas lifecycle
│   │       └── CharacterRig.ts # PixiJS Mesh + Skeleton visual node
│   ├── state/
│   │   └── studioStore.ts     # Lightweight reactive state (Zustand-like or custom hook)
│   └── components/
│       ├── Header.tsx         # Project name, Export button, Playback controls
│       ├── CanvasView.tsx     # Interactive WebGL viewport with pan/zoom/gizmo
│       ├── Inspector.tsx      # Bone/Mesh properties, spring physics settings, layers
│       ├── AssetLibrary.tsx   # Character puppets, backgrounds, motion presets
│       ├── Timeline/
│       │   ├── Timeline.tsx   # Multi-track container, playhead, time ruler
│       │   ├── TrackHeader.tsx # Layer visibility, lock, track type
│       │   └── KeyframeTrack.tsx # Keyframe nodes, clips, easing curves
│       └── AudioVisemeTrack.tsx # Waveform rendering and viseme tags
└── tests/
    ├── math.test.ts           # Transform math & IK solver verification
    ├── skinning.test.ts       # Delaunay triangulation & skinning weights test
    ├── viseme.test.ts         # Viseme audio mapping logic test
    └── timeline.test.ts       # Keyframe interpolation & easing evaluation test
```

---

### Task 1: Project Scaffolding & Core Types

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/types/skeleton.ts`
- Create: `src/types/animation.ts`
- Create: `src/types/lipsync.ts`
- Create: `src/types/project.ts`
- Create: `src/index.css`
- Create: `src/main.tsx`

- [ ] **Step 1: Create package.json and project config files**
  Setup dependencies: `react`, `react-dom`, `pixi.js`, `lucide-react`, `tailwindcss`, `vite`, `vitest`.
- [ ] **Step 2: Run npm/pnpm install**
  Execute install and ensure lockfile is created.
- [ ] **Step 3: Define TypeScript domain models in `src/types/`**
  Add `Bone`, `Skeleton`, `Keyframe`, `AnimationTrack`, `Viseme`, and `Project` types.
- [ ] **Step 4: Verify TypeScript compiles**
  Run: `npx tsc --noEmit`
  Expected: PASS

---

### Task 2: Math, Kinematics & Secondary Spring Physics Engine

**Files:**
- Create: `src/engine/math/matrix2d.ts`
- Create: `src/engine/math/ik.ts`
- Create: `src/engine/math/spring.ts`
- Test: `tests/math.test.ts`

- [ ] **Step 1: Write tests for 2D Transforms, Two-Bone IK Solver, and Spring Oscillator**
  Test coordinate transformations, analytic 2-bone reaching target, and dampening springs.
- [ ] **Step 2: Run test to verify failure**
  Run: `npx vitest run tests/math.test.ts`
  Expected: FAIL
- [ ] **Step 3: Implement Matrix2D, analytic Two-Bone IK, and Verlet Spring Dynamics**
- [ ] **Step 4: Run test to verify passes**
  Run: `npx vitest run tests/math.test.ts`
  Expected: PASS

---

### Task 3: 2D Mesh Triangulation & Linear Blend Skinning Engine

**Files:**
- Create: `src/engine/mesh/triangulation.ts`
- Create: `src/engine/mesh/skinning.ts`
- Create: `src/engine/skeleton/skeleton.ts`
- Test: `tests/skinning.test.ts`

- [ ] **Step 1: Write tests for boundary triangulation and heat/distance skinning weights**
- [ ] **Step 2: Run test to verify failure**
  Run: `npx vitest run tests/skinning.test.ts`
  Expected: FAIL
- [ ] **Step 3: Implement Delaunay mesh generator and Bone weighting functions**
- [ ] **Step 4: Run test to verify passes**
  Run: `npx vitest run tests/skinning.test.ts`
  Expected: PASS

---

### Task 4: Audio Engine & Viseme Lip-Sync Mapper

**Files:**
- Create: `src/engine/lipsync/visemeMapper.ts`
- Test: `tests/viseme.test.ts`

- [ ] **Step 1: Write test for audio phoneme-to-viseme extraction (A, B, C, D, E, F, G, H, X)**
- [ ] **Step 2: Run test to verify failure**
  Run: `npx vitest run tests/viseme.test.ts`
  Expected: FAIL
- [ ] **Step 3: Implement audio spectral energy analyzer and viseme generator**
- [ ] **Step 4: Run test to verify passes**
  Run: `npx vitest run tests/viseme.test.ts`
  Expected: PASS

---

### Task 5: Timeline Interpolation & Keyframing Engine

**Files:**
- Create: `src/engine/animation/interpolator.ts`
- Create: `src/state/studioStore.ts`
- Test: `tests/timeline.test.ts`

- [ ] **Step 1: Write test for keyframe easing evaluation (Linear, EaseIn, EaseOut, EaseInOut, Step)**
- [ ] **Step 2: Run test to verify failure**
  Run: `npx vitest run tests/timeline.test.ts`
  Expected: FAIL
- [ ] **Step 3: Implement cubic-bezier / hermite curve evaluator and central studio store**
- [ ] **Step 4: Run test to verify passes**
  Run: `npx vitest run tests/timeline.test.ts`
  Expected: PASS

---

### Task 6: PixiJS v8 Canvas & Character Puppet Renderer

**Files:**
- Create: `src/engine/renderer/PixiApp.ts`
- Create: `src/engine/renderer/CharacterRig.ts`
- Create: `src/components/CanvasView.tsx`

- [ ] **Step 1: Create PixiApp initialization with WebGL2 canvas and high-DPI scaling**
- [ ] **Step 2: Implement CharacterRig rendering with bones, interactive handles, and mesh deformation**
- [ ] **Step 3: Implement interactive canvas view with Pan, Zoom, and Gizmo transformation**

---

### Task 7: Multi-Track Timeline & Audio Waveform UI

**Files:**
- Create: `src/components/Timeline/Timeline.tsx`
- Create: `src/components/Timeline/TrackHeader.tsx`
- Create: `src/components/Timeline/KeyframeTrack.tsx`
- Create: `src/components/Timeline/AudioVisemeTrack.tsx`

- [ ] **Step 1: Build multi-track timeline header, time ruler (frames/seconds), and draggable playhead**
- [ ] **Step 2: Build keyframe track items with drag-to-retime and easing selector**
- [ ] **Step 3: Build audio track with live Web Audio waveform visualization and viseme labels**

---

### Task 8: Asset Library, Preset Motion Library & Inspector Panel

**Files:**
- Create: `src/components/AssetLibrary.tsx`
- Create: `src/components/Inspector.tsx`
- Create: `src/components/Header.tsx`
- Create: `src/engine/presets/motionPresets.ts`

- [ ] **Step 1: Implement preset animations (Walk Cycle, Wave Hand, Excited Talk, Idle Breath)**
- [ ] **Step 2: Implement Asset Library with sample characters, backgrounds, and motion clips**
- [ ] **Step 3: Implement Inspector panel to tune bone rotations, IK toggles, and spring bounce stiffness**
- [ ] **Step 4: Implement Header with Play/Pause, FPS toggle, and Client-Side Video Export**

---

### Task 9: Video Export Engine & Integration Verification

**Files:**
- Create: `src/engine/export/videoExporter.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement frame-by-frame canvas offscreen rendering and WebM/MP4 encoder**
- [ ] **Step 2: Assemble full application in `src/App.tsx`**
- [ ] **Step 3: Build and run comprehensive integration checks (all tests passing + Vite build clean)**
  Run: `npm test && npm run build`
  Expected: All tests PASS, build output created with zero errors.
