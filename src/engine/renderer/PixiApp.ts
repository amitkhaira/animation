import { Application, Container, Graphics, Color } from 'pixi.js';

export class StudioRenderer {
  public app: Application;
  public stageContainer: Container;
  public cameraContainer: Container;
  public gridContainer: Container;
  public characterContainer: Container;
  public gizmoContainer: Container;

  private isInitialized = false;
  private isDestroyed = false;

  constructor() {
    this.app = new Application();
    this.stageContainer = new Container();
    this.cameraContainer = new Container();
    this.gridContainer = new Container();
    this.characterContainer = new Container();
    this.gizmoContainer = new Container();
  }

  public async init(container: HTMLElement): Promise<HTMLCanvasElement | null> {
    if (this.isInitialized || this.isDestroyed) return null;

    await this.app.init({
      resizeTo: container,
      backgroundColor: 0x11141c,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
      preference: 'webgl'
    });

    if (this.isDestroyed) {
      this.app.destroy(true, { children: true, texture: true });
      return null;
    }

    if (this.app.canvas) {
      this.app.canvas.className = 'w-full h-full block cursor-crosshair';
      container.appendChild(this.app.canvas);
    }

    this.app.stage.addChild(this.stageContainer);
    this.stageContainer.addChild(this.cameraContainer);
    this.cameraContainer.addChild(this.gridContainer);
    this.cameraContainer.addChild(this.characterContainer);
    this.stageContainer.addChild(this.gizmoContainer);

    this.drawGrid();
    this.isInitialized = true;
    return this.app.canvas as HTMLCanvasElement;
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.isInitialized) {
      try {
        if (this.app.canvas && this.app.canvas.parentElement) {
          this.app.canvas.parentElement.removeChild(this.app.canvas);
        }
        this.app.destroy(true, { children: true, texture: true });
      } catch (err) {
        console.warn('Pixi destroy warning:', err);
      }
      this.isInitialized = false;
    }
  }

  public drawGrid(size = 2000, step = 50): void {
    this.gridContainer.removeChildren();
    const g = new Graphics();

    // Minor lines
    for (let x = -size; x <= size; x += step) {
      const isMajor = x % (step * 4) === 0;
      const isOrigin = x === 0;
      g.moveTo(x, -size);
      g.lineTo(x, size);
      g.stroke({
        width: isOrigin ? 2 : isMajor ? 1 : 0.5,
        color: isOrigin ? 0x6366f1 : isMajor ? 0x2d3748 : 0x1e2430,
        alpha: isOrigin ? 0.8 : isMajor ? 0.6 : 0.3
      });
    }

    for (let y = -size; y <= size; y += step) {
      const isMajor = y % (step * 4) === 0;
      const isOrigin = y === 0;
      g.moveTo(-size, y);
      g.lineTo(size, y);
      g.stroke({
        width: isOrigin ? 2 : isMajor ? 1 : 0.5,
        color: isOrigin ? 0xef4444 : isMajor ? 0x2d3748 : 0x1e2430,
        alpha: isOrigin ? 0.8 : isMajor ? 0.6 : 0.3
      });
    }

    this.gridContainer.addChild(g);
  }

  public setCamera(x: number, y: number, zoom: number): void {
    if (!this.isInitialized || !this.app || !this.app.renderer) return;
    const width = this.app.screen?.width || (this.app.canvas as HTMLCanvasElement)?.clientWidth || 800;
    const height = this.app.screen?.height || (this.app.canvas as HTMLCanvasElement)?.clientHeight || 600;
    const cx = width / 2;
    const cy = height / 2;
    this.cameraContainer.position.set(cx + x * zoom, cy + y * zoom);
    this.cameraContainer.scale.set(zoom);
  }
}
