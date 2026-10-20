import { Bone, Skeleton, Vec2 } from '../../types/skeleton';
import { Matrix2D } from '../math/matrix2d';

export class SkeletonManager {
  public skeleton: Skeleton;
  public worldMatrices: Record<string, Matrix2D> = {};
  public bindPoseInverses: Record<string, Matrix2D> = {};

  constructor(skeleton: Skeleton) {
    this.skeleton = skeleton;
    this.updateWorldTransforms();
    this.captureBindPose();
  }

  public updateWorldTransforms(): void {
    // Traverse in hierarchical order
    for (const boneId of this.skeleton.boneOrder) {
      const bone = this.skeleton.bones[boneId];
      if (!bone) continue;

      const localMat = Matrix2D.fromTRS(
        bone.localPosition.x,
        bone.localPosition.y,
        bone.rotation
      );

      if (bone.parentId && this.worldMatrices[bone.parentId]) {
        const parentMat = this.worldMatrices[bone.parentId];
        // Parent bone extends along its X axis by its length
        const parentBone = this.skeleton.bones[bone.parentId];
        const offsetMat = Matrix2D.fromTRS(parentBone.length, 0, 0);
        const jointMat = parentMat.multiply(offsetMat);
        this.worldMatrices[boneId] = jointMat.multiply(localMat);
      } else {
        this.worldMatrices[boneId] = localMat;
      }

      // Update bone worldPosition and worldRotation
      const worldOrigin = this.worldMatrices[boneId].transformPoint({ x: 0, y: 0 });
      bone.worldPosition = worldOrigin;
      bone.worldRotation = Math.atan2(this.worldMatrices[boneId].b, this.worldMatrices[boneId].a);
    }
  }

  public captureBindPose(): void {
    for (const boneId of this.skeleton.boneOrder) {
      if (this.worldMatrices[boneId]) {
        this.bindPoseInverses[boneId] = this.worldMatrices[boneId].inverse();
      }
    }
  }

  public setBoneRotation(boneId: string, radians: number): void {
    if (this.skeleton.bones[boneId]) {
      this.skeleton.bones[boneId].rotation = radians;
      this.updateWorldTransforms();
    }
  }

  public setBoneLocalPosition(boneId: string, pos: Vec2): void {
    if (this.skeleton.bones[boneId]) {
      this.skeleton.bones[boneId].localPosition = { ...pos };
      this.updateWorldTransforms();
    }
  }
}

/**
 * Creates a standard humanoid 2D biped skeleton suitable for 2D characters.
 */
export function createDefaultBipedSkeleton(): Skeleton {
  const bones: Record<string, Bone> = {
    root: {
      id: 'root',
      name: 'Root / Pelvis',
      parentId: null,
      length: 0,
      rotation: 0,
      localPosition: { x: 0, y: 0 }
    },
    spine: {
      id: 'spine',
      name: 'Spine / Torso',
      parentId: 'root',
      length: 60,
      rotation: -Math.PI / 2, // Upwards
      localPosition: { x: 0, y: 0 }
    },
    neck: {
      id: 'neck',
      name: 'Neck & Head',
      parentId: 'spine',
      length: 45,
      rotation: 0,
      localPosition: { x: 0, y: 0 }
    },
    leftUpperArm: {
      id: 'leftUpperArm',
      name: 'Left Upper Arm',
      parentId: 'spine',
      length: 40,
      rotation: Math.PI / 3,
      localPosition: { x: 0, y: 0 }
    },
    leftForearm: {
      id: 'leftForearm',
      name: 'Left Forearm',
      parentId: 'leftUpperArm',
      length: 35,
      rotation: 0.2,
      localPosition: { x: 0, y: 0 }
    },
    rightUpperArm: {
      id: 'rightUpperArm',
      name: 'Right Upper Arm',
      parentId: 'spine',
      length: 40,
      rotation: -Math.PI / 3,
      localPosition: { x: 0, y: 0 }
    },
    rightForearm: {
      id: 'rightForearm',
      name: 'Right Forearm',
      parentId: 'rightUpperArm',
      length: 35,
      rotation: -0.2,
      localPosition: { x: 0, y: 0 }
    },
    leftUpperLeg: {
      id: 'leftUpperLeg',
      name: 'Left Upper Leg',
      parentId: 'root',
      length: 50,
      rotation: Math.PI / 2 + 0.1, // Downwards
      localPosition: { x: -15, y: 0 }
    },
    leftLowerLeg: {
      id: 'leftLowerLeg',
      name: 'Left Lower Leg',
      parentId: 'leftUpperLeg',
      length: 45,
      rotation: -0.1,
      localPosition: { x: 0, y: 0 }
    },
    rightUpperLeg: {
      id: 'rightUpperLeg',
      name: 'Right Upper Leg',
      parentId: 'root',
      length: 50,
      rotation: Math.PI / 2 - 0.1,
      localPosition: { x: 15, y: 0 }
    },
    rightLowerLeg: {
      id: 'rightLowerLeg',
      name: 'Right Lower Leg',
      parentId: 'rightUpperLeg',
      length: 45,
      rotation: 0.1,
      localPosition: { x: 0, y: 0 }
    }
  };

  const boneOrder = [
    'root',
    'spine',
    'neck',
    'leftUpperArm',
    'leftForearm',
    'rightUpperArm',
    'rightForearm',
    'leftUpperLeg',
    'leftLowerLeg',
    'rightUpperLeg',
    'rightLowerLeg'
  ];

  return {
    id: 'default_biped_skeleton',
    name: 'Biped Character',
    rootBoneId: 'root',
    bones,
    boneOrder
  };
}
