import { Vec2 } from '../../types/skeleton';

export interface TriangleMesh {
  vertices: Float32Array; // [x, y, x, y, ...]
  uvs: Float32Array;      // [u, v, u, v, ...]
  indices: Uint16Array;   // [i0, i1, i2, ...]
}

/**
 * Generates an adaptive grid triangle mesh for a rectangular or contour bounded 2D sprite.
 * This mesh provides the internal vertices required for organic 2D bending/warping.
 */
export function createDeformableGridMesh(
  width: number,
  height: number,
  subdivisionsX: number = 8,
  subdivisionsY: number = 8
): TriangleMesh {
  const numVertices = (subdivisionsX + 1) * (subdivisionsY + 1);
  const vertices = new Float32Array(numVertices * 2);
  const uvs = new Float32Array(numVertices * 2);

  let vIdx = 0;
  for (let y = 0; y <= subdivisionsY; y++) {
    const v = y / subdivisionsY;
    const posY = (v - 0.5) * height;

    for (let x = 0; x <= subdivisionsX; x++) {
      const u = x / subdivisionsX;
      const posX = (u - 0.5) * width;

      vertices[vIdx * 2] = posX;
      vertices[vIdx * 2 + 1] = posY;

      uvs[vIdx * 2] = u;
      uvs[vIdx * 2 + 1] = v;

      vIdx++;
    }
  }

  // Generate triangles (2 per quad)
  const numQuads = subdivisionsX * subdivisionsY;
  const indices = new Uint16Array(numQuads * 6);
  let iIdx = 0;

  for (let y = 0; y < subdivisionsY; y++) {
    for (let x = 0; x < subdivisionsX; x++) {
      const row1 = y * (subdivisionsX + 1);
      const row2 = (y + 1) * (subdivisionsX + 1);

      const topLeft = row1 + x;
      const topRight = row1 + x + 1;
      const bottomLeft = row2 + x;
      const bottomRight = row2 + x + 1;

      // Triangle 1
      indices[iIdx++] = topLeft;
      indices[iIdx++] = bottomLeft;
      indices[iIdx++] = topRight;

      // Triangle 2
      indices[iIdx++] = topRight;
      indices[iIdx++] = bottomLeft;
      indices[iIdx++] = bottomRight;
    }
  }

  return {
    vertices,
    uvs,
    indices
  };
}
