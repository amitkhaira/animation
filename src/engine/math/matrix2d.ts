import { Vec2 } from '../../types/skeleton';

/**
 * 2D Affine Transform Matrix represented as [a, b, c, d, tx, ty]:
 * | a  c  tx |
 * | b  d  ty |
 * | 0  0  1  |
 */
export class Matrix2D {
  public a: number = 1;
  public b: number = 0;
  public c: number = 0;
  public d: number = 1;
  public tx: number = 0;
  public ty: number = 0;

  constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) {
    this.set(a, b, c, d, tx, ty);
  }

  public set(a: number, b: number, c: number, d: number, tx: number, ty: number): this {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.tx = tx;
    this.ty = ty;
    return this;
  }

  public identity(): this {
    return this.set(1, 0, 0, 1, 0, 0);
  }

  public multiply(other: Matrix2D): Matrix2D {
    const a = this.a * other.a + this.c * other.b;
    const b = this.b * other.a + this.d * other.b;
    const c = this.a * other.c + this.c * other.d;
    const d = this.b * other.c + this.d * other.d;
    const tx = this.a * other.tx + this.c * other.ty + this.tx;
    const ty = this.b * other.tx + this.d * other.ty + this.ty;
    return new Matrix2D(a, b, c, d, tx, ty);
  }

  public static fromTRS(x: number, y: number, rotationRad: number, scaleX = 1, scaleY = 1): Matrix2D {
    const cos = Math.cos(rotationRad);
    const sin = Math.sin(rotationRad);
    return new Matrix2D(
      cos * scaleX,
      sin * scaleX,
      -sin * scaleY,
      cos * scaleY,
      x,
      y
    );
  }

  public transformPoint(p: Vec2): Vec2 {
    return {
      x: this.a * p.x + this.c * p.y + this.tx,
      y: this.b * p.x + this.d * p.y + this.ty
    };
  }

  public inverse(): Matrix2D {
    const det = this.a * this.d - this.b * this.c;
    if (Math.abs(det) < 1e-8) {
      return new Matrix2D();
    }
    const invDet = 1 / det;
    return new Matrix2D(
      this.d * invDet,
      -this.b * invDet,
      -this.c * invDet,
      this.a * invDet,
      (this.c * this.ty - this.d * this.tx) * invDet,
      (this.b * this.tx - this.a * this.ty) * invDet
    );
  }
}
