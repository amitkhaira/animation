import { Vec2, Bone } from '../../types/skeleton';
import { Matrix2D } from '../math/matrix2d';

export interface SkinningData {
  boneIndices: Uint8Array; // 4 indices per vertex
  weights: Float32Array;   // 4 weights per vertex (sums to 1.0)
}

/**
 * Calculates smooth distance-falloff skinning weights for each vertex across bones.
 */
export function computeDistanceSkinningWeights(
  vertices: Float32Array,
  bones: Bone[]
): SkinningData {
  const numVertices = vertices.length / 2;
  const boneIndices = new Uint8Array(numVertices * 4);
  const weights = new Float32Array(numVertices * 4);

  for (let i = 0; i < numVertices; i++) {
    const vx = vertices[i * 2];
    const vy = vertices[i * 2 + 1];

    // Compute distance to each bone's midpoint / origin
    const distances: { boneIndex: number; dist: number }[] = [];

    bones.forEach((bone, bIdx) => {
      const bx = bone.worldPosition?.x ?? 0;
      const by = bone.worldPosition?.y ?? 0;
      const dx = vx - bx;
      const dy = vy - by;
      const dist = Math.sqrt(dx * dx + dy * dy);
      distances.push({ boneIndex: bIdx, dist });
    });

    // Sort by closest bone
    distances.sort((a, b) => a.dist - b.dist);

    // Pick up to 2 closest bones
    const b0 = distances[0];
    const b1 = distances.length > 1 ? distances[1] : null;

    const baseOffset = i * 4;
    boneIndices[baseOffset] = b0.boneIndex;

    if (!b1 || b0.dist < 1e-4) {
      weights[baseOffset] = 1.0;
      weights[baseOffset + 1] = 0.0;
      weights[baseOffset + 2] = 0.0;
      weights[baseOffset + 3] = 0.0;
    } else {
      // Inverse distance weighting
      const inv0 = 1 / Math.max(b0.dist, 1);
      const inv1 = 1 / Math.max(b1.dist, 1);
      const total = inv0 + inv1;

      boneIndices[baseOffset + 1] = b1.boneIndex;
      weights[baseOffset] = inv0 / total;
      weights[baseOffset + 1] = inv1 / total;
      weights[baseOffset + 2] = 0.0;
      weights[baseOffset + 3] = 0.0;
    }
  }

  return {
    boneIndices,
    weights
  };
}

/**
 * Performs Linear Blend Skinning (LBS) on CPU (for test validation and offscreen export fallback).
 */
export function applyLinearBlendSkinning(
  bindVertices: Float32Array,
  skinning: SkinningData,
  boneWorldTransforms: Matrix2D[],
  bindPoseInverses: Matrix2D[]
): Float32Array {
  const numVertices = bindVertices.length / 2;
  const deformedVertices = new Float32Array(bindVertices.length);

  for (let i = 0; i < numVertices; i++) {
    const vx = bindVertices[i * 2];
    const vy = bindVertices[i * 2 + 1];
    const baseOffset = i * 4;

    let defX = 0;
    let defY = 0;

    for (let slot = 0; slot < 4; slot++) {
      const weight = skinning.weights[baseOffset + slot];
      if (weight <= 0.0001) continue;

      const boneIdx = skinning.boneIndices[baseOffset + slot];
      const worldMat = boneWorldTransforms[boneIdx];
      const invBind = bindPoseInverses[boneIdx];

      // Skinning matrix = World * BindInverse
      const skinMatrix = worldMat.multiply(invBind);
      const transformed = skinMatrix.transformPoint({ x: vx, y: vy });

      defX += transformed.x * weight;
      defY += transformed.y * weight;
    }

    deformedVertices[i * 2] = defX;
    deformedVertices[i * 2 + 1] = defY;
  }

  return deformedVertices;
}
