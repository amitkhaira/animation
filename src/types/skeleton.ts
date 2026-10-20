export interface Vec2 {
  x: number;
  y: number;
}

export interface Bone {
  id: string;
  name: string;
  parentId: string | null;
  length: number;
  rotation: number; // in radians
  localPosition: Vec2; // offset from parent bone end or root
  worldPosition?: Vec2;
  worldRotation?: number;
  isIkTarget?: boolean;
}

export interface Skeleton {
  id: string;
  name: string;
  rootBoneId: string;
  bones: Record<string, Bone>;
  boneOrder: string[]; // hierarchical traversal order
}

export interface MeshVertex {
  x: number;
  y: number;
  u: number;
  v: number;
  // Linear blend skinning weights: up to 4 influencing bones
  boneIndices: number[];
  weights: number[];
}

export interface DeformableMesh {
  id: string;
  textureUrl: string;
  vertices: Float32Array; // [x0, y0, x1, y1, ...]
  uvs: Float32Array;       // [u0, v0, u1, v1, ...]
  triangles: Uint16Array;  // [i0, i1, i2, ...]
  skinningWeights: {
    boneIndices: Uint8Array; // 4 indices per vertex
    weights: Float32Array;   // 4 weights per vertex (sums to 1.0)
  };
}

export interface CharacterPuppet {
  id: string;
  name: string;
  templateId?: string;
  skeleton: Skeleton;
  mesh?: DeformableMesh;
  spriteLayers?: Record<string, {
    boneId: string;
    textureUrl: string;
    offset: Vec2;
    rotation: number;
    scale: Vec2;
    zIndex: number;
  }>;
}
