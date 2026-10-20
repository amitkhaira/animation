import { Vec2 } from '../../types/skeleton';

export interface TwoBoneResult {
  rootAngle: number;
  midAngle: number;
  solved: boolean;
}

/**
 * Analytic 2-Bone Inverse Kinematics (Law of Cosines).
 * @param rootPos Origin of parent bone (e.g. Shoulder/Hip)
 * @param targetPos Desired position of end effector (e.g. Hand/Foot)
 * @param l1 Length of upper bone
 * @param l2 Length of lower bone
 * @param bendPositive Direction of joint bend (+1 or -1)
 */
export function solveTwoBoneIK(
  rootPos: Vec2,
  targetPos: Vec2,
  l1: number,
  l2: number,
  bendPositive: boolean = true
): TwoBoneResult {
  const dx = targetPos.x - rootPos.x;
  const dy = targetPos.y - rootPos.y;
  const distSq = dx * dx + dy * dy;
  const dist = Math.sqrt(distSq);

  const baseAngle = Math.atan2(dy, dx);

  // Target out of reach -> extend straight toward target
  if (dist >= l1 + l2) {
    return {
      rootAngle: baseAngle,
      midAngle: 0,
      solved: false
    };
  }

  // Target too close
  if (dist <= Math.abs(l1 - l2)) {
    return {
      rootAngle: baseAngle,
      midAngle: Math.PI,
      solved: false
    };
  }

  // Law of Cosines
  // cos(a) = (l1^2 + dist^2 - l2^2) / (2 * l1 * dist)
  const cosAlpha = Math.max(-1, Math.min(1, (l1 * l1 + distSq - l2 * l2) / (2 * l1 * dist)));
  const alpha = Math.acos(cosAlpha);

  // cos(b) = (l1^2 + l2^2 - dist^2) / (2 * l1 * l2)
  const cosBeta = Math.max(-1, Math.min(1, (l1 * l1 + l2 * l2 - distSq) / (2 * l1 * l2)));
  const beta = Math.acos(cosBeta);

  const sign = bendPositive ? 1 : -1;
  const rootAngle = baseAngle + sign * alpha;
  const midAngle = sign * (beta - Math.PI);

  return {
    rootAngle,
    midAngle,
    solved: true
  };
}
