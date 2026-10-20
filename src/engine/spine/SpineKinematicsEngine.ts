// True 2D Spine Skeletal Runtime Engine with official Spine Canvas SkeletonRenderer
// Supports Spine 3.8 & 4.x JSON, IK constraints, texture atlas rotation, and whitespace trimming.

import {
  SkeletonJson,
  AtlasAttachmentLoader,
  Skeleton,
  AnimationState,
  AnimationStateData,
  SkeletonData,
  TextureAtlas,
  CanvasTexture,
  SkeletonRenderer,
  Physics
} from '@esotericsoftware/spine-canvas';

// Patch SkeletonRenderer to fix official buffer underrun bug for dense meshes (> 1024 vertices)
const origComputeMeshVertices = (SkeletonRenderer.prototype as any).computeMeshVertices;
if (origComputeMeshVertices && !(SkeletonRenderer.prototype as any).__meshBufferPatched) {
  (SkeletonRenderer.prototype as any).computeMeshVertices = function (
    slot: any,
    mesh: any,
    uvs: any,
    pma: boolean
  ) {
    const vertexCount = mesh.worldVerticesLength / 2;
    const neededLength = vertexCount * 8; // SkeletonRenderer.VERTEX_SIZE = 8
    if (this.vertices.length < neededLength) {
      this.vertices = new Float32Array(neededLength);
    }
    return origComputeMeshVertices.call(this, slot, mesh, uvs, pma);
  };
  (SkeletonRenderer.prototype as any).__meshBufferPatched = true;
}

/**
 * Spine 3.8 to Spine 4.x Animation Curve Normalizer.
 * In Spine 3.8, Bezier curves in JSON are unit-normalized [0..1] x [0..1] easing handles (c1, c2, c3, c4).
 * In Spine 4.x runtimes, CurveTimeline.setBezier requires absolute timeline coordinates:
 *   cx1 = time1 + c1 * (time2 - time1)
 *   cy1 = value1 + c2 * (value2 - value1)
 *   cx2 = time1 + c3 * (time2 - time1)
 *   cy2 = value1 + c4 * (value2 - value1)
 * for each channel (e.g. 2 channels for scale/translate/shear [x, y], 1 for rotate [angle]).
 * If handles are improperly set to unit [0..1] regardless of values, channels with value ~1 (like scale)
 * plummet towards 0, shrinking bones by 50% and detaching legs/feet!
 */
export function normalizeSpineCurves(animationsObj: any): any {
  if (!animationsObj || typeof animationsObj !== 'object') return animationsObj;

  function convertTimeline(frames: any[], chNames: string[], defaults: number[]) {
    if (!Array.isArray(frames) || frames.length === 0) return;
    for (let i = 0; i < frames.length; i++) {
      const k1 = frames[i];
      if (!k1 || typeof k1 !== 'object') continue;

      // If last frame, remove any leftover curve
      if (i === frames.length - 1) {
        delete k1.curve;
        delete k1.c2;
        delete k1.c3;
        delete k1.c4;
        continue;
      }

      const k2 = frames[i + 1];
      if (!k2 || typeof k2 !== 'object') continue;

      const c = k1.curve;
      if (c === undefined || c === null) continue;
      if (c === 'stepped') continue;

      // Already expanded to Spine 4.x absolute format?
      if (Array.isArray(c) && c.length === chNames.length * 4) {
        continue;
      }

      let c1 = 0, c2 = 0, c3 = 0.75, c4 = 1;
      if (typeof c === 'number') {
        c1 = c;
        c2 = typeof k1.c2 === 'number' ? k1.c2 : 0;
        c3 = typeof k1.c3 === 'number' ? k1.c3 : 0.75;
        c4 = typeof k1.c4 === 'number' ? k1.c4 : 1;
        delete k1.c2;
        delete k1.c3;
        delete k1.c4;
      } else if (Array.isArray(c)) {
        c1 = c[0] ?? 0;
        c2 = c[1] ?? 0;
        c3 = c[2] ?? 0.75;
        c4 = c[3] ?? 1;
      }

      const t1 = k1.time ?? 0;
      const t2 = k2.time ?? 0;
      const dt = t2 - t1;

      const expanded: number[] = [];
      for (let ch = 0; ch < chNames.length; ch++) {
        const prop = chNames[ch];
        const def = defaults[ch];
        const v1 = k1[prop] ?? def;
        const v2 = k2[prop] ?? def;
        const dv = v2 - v1;

        const cx1 = t1 + c1 * dt;
        const cy1 = v1 + c2 * dv;
        const cx2 = t1 + c3 * dt;
        const cy2 = v1 + c4 * dv;
        expanded.push(cx1, cy1, cx2, cy2);
      }
      k1.curve = expanded;
    }
  }

  function processAnim(anObj: any) {
    if (!anObj || typeof anObj !== 'object') return;
    if (anObj.bones) {
      for (const boneName of Object.keys(anObj.bones)) {
        const b = anObj.bones[boneName];
        if (b.rotate) convertTimeline(b.rotate, ['angle'], [0]);
        if (b.translate) convertTimeline(b.translate, ['x', 'y'], [0, 0]);
        if (b.translatex) convertTimeline(b.translatex, ['x'], [0]);
        if (b.translatey) convertTimeline(b.translatey, ['y'], [0]);
        if (b.scale) convertTimeline(b.scale, ['x', 'y'], [1, 1]);
        if (b.scalex) convertTimeline(b.scalex, ['x'], [1]);
        if (b.scaley) convertTimeline(b.scaley, ['y'], [1]);
        if (b.shear) convertTimeline(b.shear, ['x', 'y'], [0, 0]);
        if (b.shearx) convertTimeline(b.shearx, ['x'], [0]);
        if (b.sheary) convertTimeline(b.sheary, ['y'], [0]);
      }
    }
    if (anObj.slots) {
      for (const slotName of Object.keys(anObj.slots)) {
        const s = anObj.slots[slotName];
        if (s.rgba) convertTimeline(s.rgba, ['r', 'g', 'b', 'a'], [1, 1, 1, 1]);
        if (s.rgb) convertTimeline(s.rgb, ['r', 'g', 'b'], [1, 1, 1]);
        if (s.alpha) convertTimeline(s.alpha, ['value'], [1]);
      }
    }
    if (anObj.ik) {
      for (const ikName of Object.keys(anObj.ik)) {
        const ik = anObj.ik[ikName];
        if (Array.isArray(ik)) convertTimeline(ik, ['mix', 'softness'], [1, 0]);
      }
    }
    if (anObj.path) {
      for (const pName of Object.keys(anObj.path)) {
        const p = anObj.path[pName];
        if (p.position) convertTimeline(p.position, ['position'], [0]);
        if (p.spacing) convertTimeline(p.spacing, ['spacing'], [0]);
        if (p.mix) convertTimeline(p.mix, ['rotateMix', 'translateMix'], [1, 1]);
      }
    }
  }

  if (animationsObj.bones || animationsObj.slots || animationsObj.ik) {
    processAnim(animationsObj);
  } else {
    for (const k of Object.keys(animationsObj)) {
      processAnim(animationsObj[k]);
    }
  }
  return animationsObj;
}

export interface ComputedBoneState {
  name: string;
  parent?: string;
  worldMat: { a: number; b: number; c: number; d: number; tx: number; ty: number };
  worldX: number;
  worldY: number;
  worldRotation: number;
}

export class SpineKinematicsModel {
  public skeletonData: SkeletonData | null = null;
  public skeleton: Skeleton | null = null;
  public stateData: AnimationStateData | null = null;
  public state: AnimationState | null = null;
  public atlas: TextureAtlas | null = null;
  public atlasImage: HTMLImageElement | null = null;
  public bones: { name: string; parent?: string }[] = [];
  public isReady: boolean = false;
  public characterId?: string;
  private cachedRenderer: SkeletonRenderer | null = null;
  private lastRenderContext: CanvasRenderingContext2D | null = null;

  public loadFromData(
    skeletonJson: any,
    atlasText: string,
    atlasImg: HTMLImageElement,
    characterId?: string
  ): void {
    this.atlasImage = atlasImg;
    this.characterId = characterId;

    // 1. Spine 3.8 to 4.x JSON normalization bridge (IK, Transform, Path, Bone Inherit & Curves)
    const normalizedJson = JSON.parse(JSON.stringify(skeletonJson));

    // Normalize bone inherit/transform (Spine 3.8 transform: 'noScale' -> Spine 4.x inherit: 'NoScale')
    if (Array.isArray(normalizedJson.bones)) {
      const inheritMap: Record<string, string> = {
        normal: 'Normal',
        onlytranslation: 'OnlyTranslation',
        norotationorreflection: 'NoRotationOrReflection',
        noscale: 'NoScale',
        noscaleorreflection: 'NoScaleOrReflection'
      };
      for (const b of normalizedJson.bones) {
        if (b.transform && !b.inherit) {
          const key = String(b.transform).toLowerCase();
          b.inherit = inheritMap[key] || b.transform;
        }
      }
    }

    if (normalizedJson.ik && !normalizedJson.constraints) {
      normalizedJson.constraints = normalizedJson.ik.map((item: any) => ({
        type: 'ik',
        ...item
      }));
    }
    if (normalizedJson.transform) {
      const transformConstraints = normalizedJson.transform.map((item: any) => ({
        type: 'transform',
        ...item
      }));
      normalizedJson.constraints = (normalizedJson.constraints || []).concat(transformConstraints);
    }
    if (normalizedJson.path) {
      const pathConstraints = normalizedJson.path.map((item: any) => ({
        type: 'path',
        ...item
      }));
      normalizedJson.constraints = (normalizedJson.constraints || []).concat(pathConstraints);
    }

    if (normalizedJson.animations) {
      normalizeSpineCurves(normalizedJson.animations);
    }

    // 2. Texture Atlas with CanvasTexture
    this.atlas = new TextureAtlas(atlasText);
    for (const page of this.atlas.pages) {
      page.setTexture(new CanvasTexture(atlasImg));
    }

    // 3. Load SkeletonData with official AtlasAttachmentLoader
    const loader = new AtlasAttachmentLoader(this.atlas);
    const parser = new SkeletonJson(loader);
    this.skeletonData = parser.readSkeletonData(normalizedJson);
    this.skeleton = new Skeleton(this.skeletonData);

    // 4. Default Skin & Setup Pose
    const defaultSkin = this.skeletonData.defaultSkin || (this.skeletonData.skins && this.skeletonData.skins[0]);
    if (defaultSkin) {
      this.skeleton.setSkin(defaultSkin);
    }
    this.skeleton.setupPose();

    // 5. AnimationState
    this.stateData = new AnimationStateData(this.skeletonData);
    this.state = new AnimationState(this.stateData);

    this.bones = this.skeleton.bones.map((b) => ({
      name: b.data.name,
      parent: b.parent && 'data' in b.parent ? (b.parent as any).data.name : undefined
    }));

    this.isReady = true;
  }

  public registerAnimation(name: string, animData: any): void {
    if (!this.skeletonData || !this.atlas) return;
    const existing = this.skeletonData.findAnimation(name);
    if (existing) return;

    try {
      const loader = new AtlasAttachmentLoader(this.atlas);
      const parser = new SkeletonJson(loader);
      const normalizedAnim = JSON.parse(JSON.stringify(animData));
      normalizeSpineCurves(normalizedAnim);
      const singleAnimMap = normalizedAnim[name] || normalizedAnim;
      (parser as any).readAnimation(singleAnimMap, name, this.skeletonData);
    } catch (e) {
      console.warn(`[SpineKinematics] Failed to register custom animation ${name}:`, e);
    }
  }

  public getAnimationNames(): string[] {
    if (!this.skeletonData) return [];
    return this.skeletonData.animations.map((a) => a.name);
  }

  public getAnimationDuration(name: string): number {
    if (!this.skeletonData) return 1.0;
    const anim = this.skeletonData.findAnimation(name);
    return anim ? anim.duration : 1.0;
  }

  public solveKinematics(animName: string, time: number): Map<string, ComputedBoneState> {
    const result = new Map<string, ComputedBoneState>();
    if (!this.skeleton || !this.skeletonData || !this.state) return result;

    this.skeleton.setupPose();
    const anim =
      this.skeletonData.findAnimation(animName) ||
      this.skeletonData.findAnimation('Idle') ||
      (this.skeletonData.animations && this.skeletonData.animations[0]);

    if (anim) {
      const dur = anim.duration || 1;
      const t = dur > 0 ? time % dur : 0;
      const entry = this.state.setAnimation(0, anim.name, true);
      entry.trackTime = t;
      this.state.apply(this.skeleton);
    }

    this.skeleton.updateWorldTransform(Physics.none);

    // Guard against degenerate transforms
    for (const b of this.skeleton.bones) {
      const pose = b.appliedPose || b.pose;
      if (isNaN(pose.a) || isNaN(pose.b) || isNaN(pose.c) || isNaN(pose.d) || isNaN(pose.worldX) || isNaN(pose.worldY)) {
        b.setupPose();
        if (b.appliedPose) b.appliedPose.set(b.data.setupPose);
      }
    }

    for (const b of this.skeleton.bones) {
      const pose = b.appliedPose || b.pose;
      result.set(b.data.name, {
        name: b.data.name,
        parent: b.parent && 'data' in b.parent ? (b.parent as any).data.name : undefined,
        worldMat: {
          a: pose.a,
          b: pose.b,
          c: pose.c,
          d: pose.d,
          tx: pose.worldX,
          ty: pose.worldY
        },
        worldX: pose.worldX,
        worldY: pose.worldY,
        worldRotation: pose.rotation
      });
    }

    return result;
  }

  // Official Spine 2D Canvas Attachment Renderer
  public renderToCanvas(
    ctx: CanvasRenderingContext2D,
    animName: string,
    time: number,
    viewportWidth: number,
    viewportHeight: number,
    viewScale: number = 0.28,
    flipH: boolean = false
  ): void {
    if (!this.isReady || !this.atlasImage || !this.skeleton || !this.skeletonData || !this.state) return;

    // Reset to setup pose and apply animation keyframes
    this.skeleton.setupPose();

    const anim =
      this.skeletonData.findAnimation(animName) ||
      this.skeletonData.findAnimation('Idle') ||
      (this.skeletonData.animations && this.skeletonData.animations[0]);

    if (anim) {
      const dur = anim.duration || 1;
      const t = dur > 0 ? time % dur : 0;
      const entry = this.state.setAnimation(0, anim.name, true);
      entry.trackTime = t;
      this.state.apply(this.skeleton);
    }

    // Hide overlay props that should be controlled dynamically
    const isPandit = Boolean(
      this.characterId &&
      (this.characterId === '811550' ||
       this.characterId.toLowerCase().includes('pandit') ||
       this.characterId.toLowerCase().includes('sadhu'))
    );

    for (const slot of this.skeleton.slots) {
      if (slot.data.name === 'R_Props' || slot.data.name === 'L_Props') {
        slot.pose.attachment = null;
      }
      if (isPandit && slot.data.name === 'Hair') {
        slot.pose.attachment = null;
      }
    }

    this.skeleton.updateWorldTransform(Physics.none);

    // Guard against degenerate transforms
    for (const b of this.skeleton.bones) {
      const pose = b.appliedPose || b.pose;
      if (isNaN(pose.a) || isNaN(pose.b) || isNaN(pose.c) || isNaN(pose.d) || isNaN(pose.worldX) || isNaN(pose.worldY)) {
        b.setupPose();
        if (b.appliedPose) b.appliedPose.set(b.data.setupPose);
      }
    }

    ctx.save();
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);

    // Skeleton bounding dimensions
    const skelW = this.skeletonData.width && this.skeletonData.width > 0 ? this.skeletonData.width : 500;
    const skelH = this.skeletonData.height && this.skeletonData.height > 0 ? this.skeletonData.height : 950;
    const skelY = this.skeletonData.y ?? -96;

    const cid = (this.characterId || '').toLowerCase();
    const isVehicle = cid.includes('car') || cid.includes('vehic') || cid.includes('chariot') || cid.includes('cart') || cid.includes('truck');
    const isBird = cid.includes('bird') || cid.includes('crow') || cid.includes('eagle') || cid.includes('owl') || cid.includes('peacock') || cid.includes('pigeon') || cid.includes('sparrow') || cid.includes('hen');

    const maxDim = Math.max(skelW / 1.4, skelH, 600);
    const relScale = 950 / maxDim;
    const effectiveScale = viewScale * relScale;

    const yGroundOffset = skelY + 96;
    const yAnchor = isBird ? 0.88 : isVehicle ? 0.86 : 0.90;
    const centerXOffset = 10 * effectiveScale;

    ctx.translate(viewportWidth / 2 - (flipH ? -centerXOffset : centerXOffset), viewportHeight * yAnchor);
    ctx.scale(flipH ? -effectiveScale : effectiveScale, -effectiveScale);
    ctx.translate(0, -yGroundOffset);

    // Reusable Spine Canvas SkeletonRenderer (prevents 500,000 array allocations per second)
    if (!this.cachedRenderer || this.lastRenderContext !== ctx) {
      this.cachedRenderer = new SkeletonRenderer(ctx);
      this.cachedRenderer.triangleRendering = true;
      this.lastRenderContext = ctx;
    } else {
      (this.cachedRenderer as any).ctx = ctx;
    }
    this.cachedRenderer.draw(this.skeleton);

    ctx.restore();
  }
}
