import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { TextureResolverService } from '@client/application/TextureResolverService';
import { PlanetBuilder, StarBuilder, SkyboxBuilder, BlackHoleBuilder } from '@client/infrastructure/scene-objects/visual-components';
import { LightBuilder } from '@client/infrastructure/scene-objects/lights';
import { HelperBuilder } from '@client/infrastructure/scene-objects/helpers';
import { OrbitCameraBuilder } from '@client/infrastructure/scene-objects/cameras';
import * as THREE from 'three';

export interface ObjectFactoryOptions {
  id?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export interface PlanetOptions extends ObjectFactoryOptions {
  radius?: number;
  texture?: string;
  type?: 'earth' | 'mars' | 'venus' | 'ice' | 'mercury' | 'rocky' | 'textured';
}

export interface StarOptions extends ObjectFactoryOptions {
  size?: number;
  color?: number;
  intensity?: number;
}

export interface BlackHoleOptions extends ObjectFactoryOptions {
  radius?: number;
  preset?: 'standard' | 'supermassive' | 'stellar' | 'quasar';
  diskInnerColor?: number;
  diskOuterColor?: number;
  enableJets?: boolean;
}

export interface LightOptions extends ObjectFactoryOptions {
  color?: number;
  intensity?: number;
  castShadow?: boolean;
}

export interface CameraOptions extends ObjectFactoryOptions {
  fov?: number;
  orbitDistance?: number;
  orbitHeight?: number;
  orbitSpeed?: number;
  autoRotate?: boolean;
}

/**
 * Object Factory
 * 
 * Creates common scene objects with default configurations.
 * Used by Scene Editor UI to dynamically add objects.
 * 
 * Usage:
 * ```ts
 * const factory = new ObjectFactory(textureResolver);
 * 
 * // Create a planet
 * const planet = factory.createPlanet({
 *   id: 'my-planet',
 *   radius: 2.0,
 *   type: 'earth',
 *   position: [0, 0, 0]
 * });
 * 
 * // Create a star
 * const star = factory.createStar({
 *   size: 1.5,
 *   color: 0xffff00
 * });
 * ```
 */
export class ObjectFactory {
  private static objectCounter = 0;

  constructor(private textureResolver: TextureResolverService) {}

  /**
   * Create a planet object
   */
  createPlanet(options: PlanetOptions = {}): ISceneObject {
    const id = options.id || `planet-${++ObjectFactory.objectCounter}`;
    const radius = options.radius || 1.0;
    const type = options.type || 'earth';

    const planet = PlanetBuilder.create(id, this.textureResolver, {
      radius,
      textureId: type as any // Maps to texture resolver
    });

    this.applyTransform(planet, options);
    return planet;
  }

  /**
   * Create a star object
   */
  createStar(options: StarOptions = {}): ISceneObject {
    const id = options.id || `star-${++ObjectFactory.objectCounter}`;
    const radius = options.size || 1.0;
    const color = options.color !== undefined ? options.color : 0xffff00;
    const lightIntensity = options.intensity || 2.0;

    const star = StarBuilder.create(id, this.textureResolver, {
      radius,
      coronaColor: color,
      lightColor: color,
      lightIntensity
    });

    this.applyTransform(star, options);
    return star;
  }

  /**
   * Create a black hole object
   */
  createBlackHole(options: BlackHoleOptions = {}): ISceneObject {
    const id = options.id || `black-hole-${++ObjectFactory.objectCounter}`;
    const preset = options.preset || 'standard';

    let blackHole: ISceneObject;

    // Use preset if specified
    if (preset === 'supermassive') {
      blackHole = BlackHoleBuilder.createSupermassive(id, this.textureResolver);
    } else if (preset === 'stellar') {
      blackHole = BlackHoleBuilder.createStellar(id, this.textureResolver);
    } else if (preset === 'quasar') {
      blackHole = BlackHoleBuilder.createQuasar(id, this.textureResolver);
    } else {
      // Custom configuration
      blackHole = BlackHoleBuilder.create(id, this.textureResolver, {
        radius: options.radius,
        diskInnerColor: options.diskInnerColor,
        diskOuterColor: options.diskOuterColor,
        enableJets: options.enableJets,
      });
    }

    this.applyTransform(blackHole, options);
    return blackHole;
  }

  /**
   * Create an ambient light
   */
  createAmbientLight(options: LightOptions = {}): ISceneObject {
    const id = options.id || `ambient-light-${++ObjectFactory.objectCounter}`;
    const color = options.color !== undefined ? options.color : 0xffffff;
    const intensity = options.intensity !== undefined ? options.intensity : 0.5;

    const light = LightBuilder.createAmbient(id, { color, intensity });
    
    this.applyTransform(light, options);
    return light;
  }

  /**
   * Create a directional light
   */
  createDirectionalLight(options: LightOptions = {}): ISceneObject {
    const id = options.id || `directional-light-${++ObjectFactory.objectCounter}`;
    const color = options.color !== undefined ? options.color : 0xffffff;
    const intensity = options.intensity !== undefined ? options.intensity : 1.0;
    const castShadow = options.castShadow !== undefined ? options.castShadow : true;
    const position: [number, number, number] = options.position || [10, 10, 10];
    
    const light = LightBuilder.createDirectional(id, {
      color,
      intensity,
      position,
      castShadow
    });
    
    // Position already set in builder, skip in applyTransform
    this.applyTransform(light, { ...options, position: undefined });
    return light;
  }

  /**
   * Create a grid helper
   */
  createGrid(options: ObjectFactoryOptions = {}): ISceneObject {
    const id = options.id || `grid-${++ObjectFactory.objectCounter}`;
    
    const grid = HelperBuilder.createGrid(id, {
      size: 20,
      divisions: 20,
      colorCenterLine: 0x444444,
      colorGrid: 0x222222
    });
    
    this.applyTransform(grid, options);
    return grid;
  }

  /**
   * Create an axes helper
   */
  createAxes(options: ObjectFactoryOptions = {}): ISceneObject {
    const id = options.id || `axes-${++ObjectFactory.objectCounter}`;
    
    const axes = HelperBuilder.createAxes(id, { size: 5 });
    
    this.applyTransform(axes, options);
    return axes;
  }

  /**
   * Create a skybox
   */
  createSkybox(options: ObjectFactoryOptions = {}): ISceneObject {
    const id = options.id || `skybox-${++ObjectFactory.objectCounter}`;
    
    const skybox = SkyboxBuilder.create(id, this.textureResolver);
    
    this.applyTransform(skybox, options);
    return skybox;
  }

  /**
   * Create a camera object
   */
  createCamera(options: CameraOptions = {}): ISceneObject {
    const id = options.id || `camera-${++ObjectFactory.objectCounter}`;
    const fov = options.fov || 75;
    const position: [number, number, number] = options.position || [0, 5, 10];
    const orbitDistance = options.orbitDistance || 10;
    const orbitHeight = options.orbitHeight || 5;
    const orbitSpeed = options.orbitSpeed || 0.0005;
    const autoRotate = options.autoRotate !== undefined ? options.autoRotate : false;

    const camera = OrbitCameraBuilder.create(id, {
      orbit: {
        distance: orbitDistance,
        height: orbitHeight,
        speed: orbitSpeed,
        autoRotate
      },
      target: new THREE.Vector3(0, 0, 0),
      fov
    });

    // Position already set in builder
    this.applyTransform(camera, { ...options, position: undefined });
    return camera;
  }

  /**
   * Apply transform to an object if it's inspectable
   */
  private applyTransform(obj: ISceneObject, options: ObjectFactoryOptions): void {
    // Try to get transform from object
    let transform: THREE.Object3D | null = null;
    
    if ('getTransform' in obj && typeof (obj as any).getTransform === 'function') {
      transform = (obj as any).getTransform();
    }

    if (!transform) return;

    if (options.position) {
      transform.position.set(...options.position);
    }

    if (options.rotation) {
      transform.rotation.set(...options.rotation);
    }

    if (options.scale) {
      transform.scale.set(...options.scale);
    }
  }

  /**
   * Get available object types for UI
   */
  static getObjectTypes(): Array<{ value: string; label: string; category: string }> {
    return [
      { value: 'planet', label: 'Planet', category: 'Visual' },
      { value: 'star', label: 'Star', category: 'Visual' },
      { value: 'black-hole', label: 'Black Hole', category: 'Visual' },
      { value: 'black-hole-supermassive', label: 'Black Hole (Supermassive)', category: 'Visual' },
      { value: 'black-hole-stellar', label: 'Black Hole (Stellar)', category: 'Visual' },
      { value: 'black-hole-quasar', label: 'Quasar', category: 'Visual' },
      { value: 'skybox', label: 'Skybox', category: 'Visual' },
      { value: 'ambient-light', label: 'Ambient Light', category: 'Lights' },
      { value: 'directional-light', label: 'Directional Light', category: 'Lights' },
      { value: 'grid', label: 'Grid Helper', category: 'Helpers' },
      { value: 'axes', label: 'Axes Helper', category: 'Helpers' },
      { value: 'camera', label: 'Camera', category: 'Cameras' }
    ];
  }
}

export default ObjectFactory;
