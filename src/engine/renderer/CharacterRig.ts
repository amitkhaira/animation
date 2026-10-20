import { Container, Graphics } from 'pixi.js';
import { CharacterPuppet } from '../../types/skeleton';
import { SkeletonManager } from '../skeleton/skeleton';
import { CHARACTER_TEMPLATES, CharacterTemplate } from '../../types/characterTemplate';

export class CharacterRigNode extends Container {
  public puppet: CharacterPuppet;
  public skeletonManager: SkeletonManager;
  private visualBodyGraphics: Graphics;
  private boneGraphics: Graphics;
  private jointsGraphics: Graphics;
  private selectedBoneId: string | null = null;
  public onBoneSelect?: (boneId: string) => void;

  constructor(puppet: CharacterPuppet) {
    super();
    this.puppet = puppet;
    this.skeletonManager = new SkeletonManager(puppet.skeleton);

    this.visualBodyGraphics = new Graphics();
    this.boneGraphics = new Graphics();
    this.jointsGraphics = new Graphics();

    // Layer order: Character Visual Body -> Bone Skeleton Overlay -> Joint Pivots
    this.addChild(this.visualBodyGraphics);
    this.addChild(this.boneGraphics);
    this.addChild(this.jointsGraphics);

    this.renderRig();
  }

  public setSelectedBone(boneId: string | null): void {
    this.selectedBoneId = boneId;
    this.renderRig();
  }

  public updatePose(): void {
    this.skeletonManager.updateWorldTransforms();
    this.renderRig();
  }

  public setPuppet(puppet: CharacterPuppet): void {
    this.puppet = puppet;
    this.skeletonManager = new SkeletonManager(puppet.skeleton);
    this.renderRig();
  }

  public renderRig(): void {
    this.visualBodyGraphics.clear();
    this.boneGraphics.clear();
    this.jointsGraphics.clear();

    const { skeleton } = this.puppet;
    const template: CharacterTemplate = (this.puppet as any).template || CHARACTER_TEMPLATES.find(
      (t) => t.id === this.puppet.templateId
    ) || CHARACTER_TEMPLATES[0];

    const colors = template.colorScheme;

    // First, draw the 2D Cartoon Character Body Parts
    // 1. Legs
    ['leftUpperLeg', 'leftLowerLeg', 'rightUpperLeg', 'rightLowerLeg'].forEach((legBoneId) => {
      const bone = skeleton.bones[legBoneId];
      const mat = this.skeletonManager.worldMatrices[legBoneId];
      if (!bone || !mat) return;

      const origin = mat.transformPoint({ x: 0, y: 0 });
      const tip = mat.transformPoint({ x: bone.length, y: 0 });

      // Draw Pants / Limbs
      this.visualBodyGraphics.moveTo(origin.x, origin.y);
      this.visualBodyGraphics.lineTo(tip.x, tip.y);
      this.visualBodyGraphics.stroke({
        width: legBoneId.includes('Upper') ? 16 : 13,
        color: colors.pants,
        cap: 'round'
      });

      // Shoes on feet
      if (legBoneId.includes('LowerLeg')) {
        this.visualBodyGraphics.circle(tip.x, tip.y + 2, 7);
        this.visualBodyGraphics.fill({ color: colors.accent });
        this.visualBodyGraphics.stroke({ width: 1.5, color: 0x0f172a });
      }
    });

    // 2. Torso / Shirt
    const spineBone = skeleton.bones['spine'];
    const spineMat = this.skeletonManager.worldMatrices['spine'];
    if (spineBone && spineMat) {
      const spineOrigin = spineMat.transformPoint({ x: 0, y: 0 });
      const spineTip = spineMat.transformPoint({ x: spineBone.length, y: 0 });

      // Torso rounded body capsule
      this.visualBodyGraphics.moveTo(spineOrigin.x, spineOrigin.y);
      this.visualBodyGraphics.lineTo(spineTip.x, spineTip.y);
      this.visualBodyGraphics.stroke({
        width: 28,
        color: colors.shirt,
        cap: 'round'
      });

      // Belt / Waistline accent
      this.visualBodyGraphics.circle(spineOrigin.x, spineOrigin.y, 11);
      this.visualBodyGraphics.fill({ color: 0x0f172a });
    }

    // 3. Arms & Hands
    ['leftUpperArm', 'leftForearm', 'rightUpperArm', 'rightForearm'].forEach((armBoneId) => {
      const bone = skeleton.bones[armBoneId];
      const mat = this.skeletonManager.worldMatrices[armBoneId];
      if (!bone || !mat) return;

      const origin = mat.transformPoint({ x: 0, y: 0 });
      const tip = mat.transformPoint({ x: bone.length, y: 0 });

      // Arm sleeves / skin
      const isSleeve = armBoneId.includes('UpperArm');
      this.visualBodyGraphics.moveTo(origin.x, origin.y);
      this.visualBodyGraphics.lineTo(tip.x, tip.y);
      this.visualBodyGraphics.stroke({
        width: isSleeve ? 12 : 9,
        color: isSleeve ? colors.shirt : colors.skin,
        cap: 'round'
      });

      // Hands
      if (armBoneId.includes('Forearm')) {
        this.visualBodyGraphics.circle(tip.x, tip.y, 6);
        this.visualBodyGraphics.fill({ color: colors.skin });
        this.visualBodyGraphics.stroke({ width: 1, color: 0x475569 });
      }
    });

    // 4. Head, Face & Hair
    const neckBone = skeleton.bones['neck'];
    const neckMat = this.skeletonManager.worldMatrices['neck'];
    if (neckBone && neckMat) {
      const headCenter = neckMat.transformPoint({ x: neckBone.length * 0.85, y: 0 });
      const headR = template.headRadius;

      // Face / Skin Circle
      this.visualBodyGraphics.circle(headCenter.x, headCenter.y, headR);
      this.visualBodyGraphics.fill({ color: colors.skin });
      this.visualBodyGraphics.stroke({ width: 2, color: 0x334155 });

      // Hair & Headgear
      if (template.id === 'cyber_bot' || template.category === 'creature') {
        // Robot Head Shell & Antennas
        this.visualBodyGraphics.rect(headCenter.x - headR * 0.9, headCenter.y - headR, headR * 1.8, headR * 0.5);
        this.visualBodyGraphics.fill({ color: colors.pants });
        // Antennas
        this.visualBodyGraphics.circle(headCenter.x - headR * 1.1, headCenter.y - headR * 0.6, 3.5);
        this.visualBodyGraphics.fill({ color: colors.hair });
        this.visualBodyGraphics.circle(headCenter.x + headR * 1.1, headCenter.y - headR * 0.6, 3.5);
        this.visualBodyGraphics.fill({ color: colors.hair });
      } else if (template.hairStyle === 'spiky') {
        this.visualBodyGraphics.poly([
          headCenter.x - headR, headCenter.y - 4,
          headCenter.x - headR * 0.7, headCenter.y - headR * 1.3,
          headCenter.x - headR * 0.2, headCenter.y - headR * 1.5,
          headCenter.x + headR * 0.4, headCenter.y - headR * 1.4,
          headCenter.x + headR, headCenter.y - 4,
          headCenter.x, headCenter.y - headR * 0.6
        ]);
        this.visualBodyGraphics.fill({ color: colors.hair });
      } else if (template.hairStyle === 'curly') {
        // Curly hair puffs
        const puffR = headR * 0.35;
        this.visualBodyGraphics.circle(headCenter.x - headR * 0.7, headCenter.y - headR * 0.7, puffR);
        this.visualBodyGraphics.circle(headCenter.x - headR * 0.2, headCenter.y - headR * 0.9, puffR * 1.1);
        this.visualBodyGraphics.circle(headCenter.x + headR * 0.3, headCenter.y - headR * 0.9, puffR * 1.1);
        this.visualBodyGraphics.circle(headCenter.x + headR * 0.7, headCenter.y - headR * 0.7, puffR);
        this.visualBodyGraphics.circle(headCenter.x - headR * 0.9, headCenter.y - headR * 0.2, puffR * 0.9);
        this.visualBodyGraphics.circle(headCenter.x + headR * 0.9, headCenter.y - headR * 0.2, puffR * 0.9);
        this.visualBodyGraphics.fill({ color: colors.hair });
      } else if (template.hairStyle === 'wavy') {
        // Wavy flowing hair
        this.visualBodyGraphics.ellipse(headCenter.x, headCenter.y - headR * 0.5, headR * 1.15, headR * 0.9);
        this.visualBodyGraphics.ellipse(headCenter.x - headR * 0.8, headCenter.y + 2, headR * 0.35, headR * 0.7);
        this.visualBodyGraphics.ellipse(headCenter.x + headR * 0.8, headCenter.y + 2, headR * 0.35, headR * 0.7);
        this.visualBodyGraphics.fill({ color: colors.hair });
      } else {
        // Bob/Curved hair cap
        this.visualBodyGraphics.ellipse(headCenter.x, headCenter.y - headR * 0.4, headR * 1.1, headR * 0.8);
        this.visualBodyGraphics.fill({ color: colors.hair });
      }

      // Eyes & Visor
      const eyeOffset = headR * 0.35;
      const eyeY = headCenter.y - 2;
      const eyeR = template.eyeSize;

      if (template.id === 'cyber_bot' || template.category === 'creature') {
        // Glowing Cyber Visor
        this.visualBodyGraphics.roundRect(headCenter.x - headR * 0.7, eyeY - 4, headR * 1.4, 9, 3);
        this.visualBodyGraphics.fill({ color: 0x06b6d4 });
        this.visualBodyGraphics.stroke({ width: 1.5, color: 0x22c55e });
      } else {
        // Left Eye
        this.visualBodyGraphics.circle(headCenter.x - eyeOffset, eyeY, eyeR);
        this.visualBodyGraphics.fill({ color: 0x0f172a });
        this.visualBodyGraphics.circle(headCenter.x - eyeOffset - 1, eyeY - 1, eyeR * 0.4);
        this.visualBodyGraphics.fill({ color: 0xffffff }); // Catchlight

        // Right Eye
        this.visualBodyGraphics.circle(headCenter.x + eyeOffset, eyeY, eyeR);
        this.visualBodyGraphics.fill({ color: 0x0f172a });
        this.visualBodyGraphics.circle(headCenter.x + eyeOffset - 1, eyeY - 1, eyeR * 0.4);
        this.visualBodyGraphics.fill({ color: 0xffffff }); // Catchlight

        // Glasses for Tech Presenter
        if (template.id === 'tech_creator') {
          const glassesR = eyeR * 1.7;
          this.visualBodyGraphics.circle(headCenter.x - eyeOffset, eyeY, glassesR);
          this.visualBodyGraphics.stroke({ width: 1.5, color: 0x334155 });
          this.visualBodyGraphics.circle(headCenter.x + eyeOffset, eyeY, glassesR);
          this.visualBodyGraphics.stroke({ width: 1.5, color: 0x334155 });
          this.visualBodyGraphics.moveTo(headCenter.x - eyeOffset + glassesR, eyeY);
          this.visualBodyGraphics.lineTo(headCenter.x + eyeOffset - glassesR, eyeY);
          this.visualBodyGraphics.stroke({ width: 1.5, color: 0x334155 });
        }

        // Cheerful Smile / Mouth
        this.visualBodyGraphics.arc(headCenter.x, headCenter.y + 7, 7, 0.1 * Math.PI, 0.9 * Math.PI);
        this.visualBodyGraphics.stroke({ width: 2, color: 0xbe123c, cap: 'round' });
      }
    }

    // Next, draw Skeletal Bones and Joint Manipulators (semi-transparent overlay)
    for (const boneId of skeleton.boneOrder) {
      const bone = skeleton.bones[boneId];
      if (!bone) continue;

      const worldMat = this.skeletonManager.worldMatrices[boneId];
      if (!worldMat) continue;

      const origin = worldMat.transformPoint({ x: 0, y: 0 });
      const tip = worldMat.transformPoint({ x: bone.length, y: 0 });

      const isSelected = this.selectedBoneId === boneId;

      // Draw bone guide line
      if (bone.length > 2) {
        this.boneGraphics.moveTo(origin.x, origin.y);
        this.boneGraphics.lineTo(tip.x, tip.y);
        this.boneGraphics.stroke({
          width: isSelected ? 2.5 : 1,
          color: isSelected ? 0x6366f1 : 0x818cf8,
          alpha: isSelected ? 0.9 : 0.4
        });
      }

      // Draw joint pivot
      this.jointsGraphics.circle(origin.x, origin.y, isSelected ? 5.5 : 3.5);
      this.jointsGraphics.fill({
        color: isSelected ? 0xf59e0b : 0x10b981,
        alpha: isSelected ? 1.0 : 0.75
      });
      this.jointsGraphics.stroke({
        width: 1.5,
        color: 0xffffff,
        alpha: 0.9
      });
    }
  }
}
