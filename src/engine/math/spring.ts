import { Vec2 } from '../../types/skeleton';

/**
 * Critically damped spring-damper for secondary dynamic motion (hair, clothing, props).
 */
export class SpringPoint {
  public pos: Vec2;
  public velocity: Vec2 = { x: 0, y: 0 };
  public restPos: Vec2;
  public stiffness: number; // spring pull strength (e.g. 0.2)
  public damping: number;   // velocity decay factor (e.g. 0.8)

  constructor(initialPos: Vec2, stiffness = 0.2, damping = 0.8) {
    this.pos = { ...initialPos };
    this.restPos = { ...initialPos };
    this.stiffness = stiffness;
    this.damping = damping;
  }

  public update(newRestPos: Vec2): Vec2 {
    this.restPos = { ...newRestPos };

    // Spring force = (target - current) * stiffness
    const fx = (this.restPos.x - this.pos.x) * this.stiffness;
    const fy = (this.restPos.y - this.pos.y) * this.stiffness;

    // Apply force to velocity and damp
    this.velocity.x = (this.velocity.x + fx) * this.damping;
    this.velocity.y = (this.velocity.y + fy) * this.damping;

    this.pos.x += this.velocity.x;
    this.pos.y += this.velocity.y;

    return { ...this.pos };
  }
}
