import type IGraphicsController from '../../application/ui/IGraphicsController';
import { ThreeRenderer } from '../rendering/ThreeRenderer';

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
