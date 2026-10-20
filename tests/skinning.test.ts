import { describe, it, expect } from 'vitest';
import { createDeformableGridMesh } from '../src/engine/mesh/triangulation';
import { computeDistanceSkinningWeights, applyLinearBlendSkinning } from '../src/engine/mesh/skinning';
import { createDefaultBipedSkeleton, SkeletonManager } from '../src/engine/skeleton/skeleton';
import { Matrix2D } from '../src/engine/math/matrix2d';

describe('Mesh Triangulation & Skinning Engine', () => {
  it('generates valid vertex and triangle buffer for grid mesh', () => {
    const mesh = createDeformableGridMesh(100, 200, 4, 4);
    // (4 + 1) * (4 + 1) = 25 vertices -> 50 floats
    expect(mesh.vertices.length).toBe(50);
    // 4 * 4 * 2 triangles = 32 triangles -> 96 indices
    expect(mesh.indices.length).toBe(96);
    expect(mesh.uvs.length).toBe(50);
  });

  it('computes distance skinning weights where weights sum to 1.0', () => {
    const skel = createDefaultBipedSkeleton();
    const skelManager = new SkeletonManager(skel);
    const mesh = createDeformableGridMesh(100, 200, 2, 2);

    const boneList = skel.boneOrder.map(id => skel.bones[id]);
    const skinData = computeDistanceSkinningWeights(mesh.vertices, boneList);

    const numVerts = mesh.vertices.length / 2;
    for (let i = 0; i < numVerts; i++) {
      const sum = skinData.weights[i * 4] + skinData.weights[i * 4 + 1] + skinData.weights[i * 4 + 2] + skinData.weights[i * 4 + 3];
      expect(sum).toBeCloseTo(1.0, 4);
    }
  });

  it('deforms vertices predictably under linear blend skinning', () => {
    const vertices = new Float32Array([0, 0, 10, 0]);
    // Single bone affecting completely
    const skinning = {
      boneIndices: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]),
      weights: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0])
    };

    // Bind pose is identity
    const bindInverses = [new Matrix2D()];
    // Translated by 50 in X
    const boneTransforms = [Matrix2D.fromTRS(50, 0, 0)];

    const deformed = applyLinearBlendSkinning(vertices, skinning, boneTransforms, bindInverses);
    expect(deformed[0]).toBe(50); // 0 + 50
    expect(deformed[2]).toBe(60); // 10 + 50
  });
});
