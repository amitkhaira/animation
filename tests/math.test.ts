import { describe, it, expect } from 'vitest';
import { Matrix2D } from '../src/engine/math/matrix2d';
import { solveTwoBoneIK } from '../src/engine/math/ik';
import { SpringPoint } from '../src/engine/math/spring';

describe('Matrix2D Affine Math', () => {
  it('correctly creates translation and transforms points', () => {
    const mat = Matrix2D.fromTRS(50, 100, 0, 1, 1);
    const p = mat.transformPoint({ x: 10, y: 20 });
    expect(p.x).toBe(60);
    expect(p.y).toBe(120);
  });

  it('correctly rotates points by 90 degrees', () => {
    const mat = Matrix2D.fromTRS(0, 0, Math.PI / 2, 1, 1);
    const p = mat.transformPoint({ x: 10, y: 0 });
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(10);
  });

  it('computes inverse matrix reliably', () => {
    const mat = Matrix2D.fromTRS(30, 40, 0.5, 2, 2);
    const inv = mat.inverse();
    const roundtrip = mat.multiply(inv);
    expect(roundtrip.a).toBeCloseTo(1);
    expect(roundtrip.d).toBeCloseTo(1);
    expect(roundtrip.tx).toBeCloseTo(0);
    expect(roundtrip.ty).toBeCloseTo(0);
  });
});

describe('Two-Bone IK Solver', () => {
  it('solves right triangle reachable targets correctly', () => {
    // 2 bones of length 50 each (total reach 100)
    // Target at (50, 50) -> distance approx 70.7
    const result = solveTwoBoneIK({ x: 0, y: 0 }, { x: 50, y: 50 }, 50, 50, true);
    expect(result.solved).toBe(true);
    expect(result.rootAngle).toBeDefined();
    expect(result.midAngle).toBeDefined();
  });

  it('handles target beyond reach smoothly', () => {
    const result = solveTwoBoneIK({ x: 0, y: 0 }, { x: 200, y: 0 }, 50, 50, true);
    expect(result.solved).toBe(false);
    expect(result.rootAngle).toBeCloseTo(0);
    expect(result.midAngle).toBeCloseTo(0);
  });
});

describe('Spring Secondary Dynamics', () => {
  it('smoothly pulls dynamic point toward rest position with dampening', () => {
    const spring = new SpringPoint({ x: 0, y: 0 }, 0.15, 0.75);
    // Shift rest position to (100, 0)
    const p1 = spring.update({ x: 100, y: 0 });
    expect(p1.x).toBeGreaterThan(0);
    expect(p1.x).toBeLessThan(100);

    // After 50 frames, the spring point settles precisely at rest position
    let lastP = p1;
    for (let i = 0; i < 50; i++) {
      lastP = spring.update({ x: 100, y: 0 });
    }
    expect(lastP.x).toBeCloseTo(100, 1);
  });
});
