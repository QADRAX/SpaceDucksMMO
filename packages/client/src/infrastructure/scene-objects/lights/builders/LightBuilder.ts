import { LightBody } from '../LightBody';
import { AmbientLightComponent, AmbientLightComponentConfig } from '../components/AmbientLightComponent';
import { DirectionalLightComponent, DirectionalLightComponentConfig } from '../components/DirectionalLightComponent';
import { PointLightComponent, PointLightComponentConfig } from '../components/PointLightComponent';

/**
 * LightBuilder - Creates common lighting setups.
 * 
 * Simplifies creation of frequently-used lighting combinations.
 */
export class LightBuilder {
  /**
   * Create an ambient light only
   */
  static createAmbient(id: string, config?: AmbientLightComponentConfig): LightBody {
    return new LightBody(id).addComponent(new AmbientLightComponent(config));
  }

  /**
   * Create a directional light only
   */
  static createDirectional(id: string, config?: DirectionalLightComponentConfig): LightBody {
    return new LightBody(id).addComponent(new DirectionalLightComponent(config));
  }

  /**
   * Create a point light only
   */
  static createPoint(id: string, config?: PointLightComponentConfig): LightBody {
    return new LightBody(id).addComponent(new PointLightComponent(config));
  }

  /**
   * Create ambient + directional combination (common scene setup)
   */
  static createSceneLighting(
    id: string,
    ambientConfig?: AmbientLightComponentConfig,
    directionalConfig?: DirectionalLightComponentConfig
  ): LightBody {
    return new LightBody(id)
      .addComponent(new AmbientLightComponent(ambientConfig))
      .addComponent(new DirectionalLightComponent(directionalConfig));
  }

  /**
   * Create default scene lighting (ambient + directional with sensible defaults)
   */
  static createDefault(id: string = 'scene-lighting'): LightBody {
    return LightBuilder.createSceneLighting(
      id,
      { color: 0xffffff, intensity: 0.3 },
      { color: 0xffffff, intensity: 0.7, position: [5, 10, 5], castShadow: true }
    );
  }

  /**
   * Create dramatic lighting (low ambient, strong directional from side)
   */
  static createDramatic(id: string): LightBody {
    return LightBuilder.createSceneLighting(
      id,
      { color: 0x333366, intensity: 0.1 },
      { color: 0xffffcc, intensity: 1.2, position: [10, 5, 0], castShadow: true }
    );
  }

  /**
   * Create soft lighting (balanced ambient and directional)
   */
  static createSoft(id: string): LightBody {
    return LightBuilder.createSceneLighting(
      id,
      { color: 0xffffff, intensity: 0.5 },
      { color: 0xffffff, intensity: 0.5, position: [5, 10, 5], castShadow: false }
    );
  }
}
