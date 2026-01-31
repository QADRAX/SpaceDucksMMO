import type IGraphicsController from '../../application/ui/IGraphicsController';
import type { ThreeRenderer } from '@duckengine/rendering-three';

export class GraphicsController implements IGraphicsController {
  constructor(private engine: ThreeRenderer) {}

  setAntialias(enabled: boolean): void {
    this.engine.setAntialias(enabled);
  }

  setShadows(enabled: boolean): void {
    this.engine.setShadows(enabled);
  }

  setResolutionAuto(): void {
    this.engine.setResolutionPolicy('auto');
  }
}

export default GraphicsController;
