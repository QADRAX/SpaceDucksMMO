import { VisualBody } from '../../visual-components/VisualBody';
import { GridComponent, GridComponentConfig } from '../components/GridComponent';
import { AxesComponent, AxesComponentConfig } from '../components/AxesComponent';

/**
 * HelperBuilder - Creates debug visualization helpers as VisualBody objects.
 * 
 * Helpers are visual objects without geometry, just THREE helpers (grid, axes).
 * They use VisualBody infrastructure for consistency with other scene objects.
 */
export class HelperBuilder {
  /**
   * Create a grid helper
   */
  static createGrid(id: string, config?: GridComponentConfig): VisualBody {
    // Create empty VisualBody (no geometry needed for helpers)
    return new VisualBody(id).addComponent(new GridComponent(config));
  }

  /**
   * Create an axes helper
   */
  static createAxes(id: string, config?: AxesComponentConfig): VisualBody {
    // Create empty VisualBody (no geometry needed for helpers)
    return new VisualBody(id).addComponent(new AxesComponent(config));
  }

  /**
   * Create grid + axes combination (common debug setup)
   */
  static createDebugHelper(
    id: string,
    gridConfig?: GridComponentConfig,
    axesConfig?: AxesComponentConfig
  ): VisualBody {
    return new VisualBody(id)
      .addComponent(new GridComponent(gridConfig))
      .addComponent(new AxesComponent(axesConfig));
  }

  /**
   * Create a simple debug helper with default settings
   */
  static createDefault(id: string = 'debug-helper'): VisualBody {
    return HelperBuilder.createDebugHelper(id, { size: 20, divisions: 20 }, { size: 5 });
  }
}
