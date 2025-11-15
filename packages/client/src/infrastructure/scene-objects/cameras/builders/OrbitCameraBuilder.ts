import * as THREE from 'three';
import { CameraBody, CameraBodyConfig } from '../CameraBody';
import { OrbitComponent, OrbitComponentConfig } from '../components/OrbitComponent';
import { LookAtComponent } from '../components/LookAtComponent';

export interface OrbitCameraConfig extends CameraBodyConfig {
  /** Orbit behavior configuration */
  orbit?: OrbitComponentConfig;
  /** Target position to orbit around and look at */
  target?: THREE.Vector3;
}

/**
 * OrbitCameraBuilder - Creates cameras that orbit around a target point.
 * 
 * This builder creates a CameraBody with OrbitComponent and LookAtComponent,
 * providing the classic "showcase" camera behavior.
 * 
 * @example
 * ```typescript
 * // Basic orbit camera
 * const camera = OrbitCameraBuilder.create('orbit-cam', {
 *   orbit: {
 *     distance: 20,
 *     height: 10,
 *     speed: 0.001,
 *     autoRotate: true
 *   },
 *   target: new THREE.Vector3(0, 0, 0)
 * });
 * 
 * scene.addObject(camera);
 * ```
 */
export class OrbitCameraBuilder {
  /**
   * Create an orbit camera with specified configuration
   */
  static create(id: string, config: OrbitCameraConfig = {}): CameraBody {
    const target = config.target || new THREE.Vector3(0, 0, 0);

    const cameraBody = new CameraBody(id, {
      fov: config.fov,
      aspect: config.aspect,
      near: config.near,
      far: config.far,
      externalCamera: config.externalCamera
    });

    // Add orbit behavior as managed component
    cameraBody.addManagedComponent(
      new OrbitComponent({
        target: target,
        distance: config.orbit?.distance ?? 15,
        height: config.orbit?.height ?? 5,
        speed: config.orbit?.speed ?? 0.001,
        startAngle: config.orbit?.startAngle ?? 0,
        autoRotate: config.orbit?.autoRotate ?? true
      }),
      {
        displayName: 'Orbit',
        category: 'Camera Behavior',
        description: 'Makes camera orbit around a target point',
        icon: '🔄'
      }
    );

    // Add look-at behavior as managed component
    cameraBody.addManagedComponent(
      new LookAtComponent({ target: target }),
      {
        displayName: 'Look At',
        category: 'Camera Behavior',
        description: 'Makes camera always look at a target point',
        icon: '👁️'
      }
    );

    return cameraBody;
  }

  /**
   * Create an orbit camera positioned to view a star system
   */
  static createStarView(id: string, starPosition: THREE.Vector3): CameraBody {
    return OrbitCameraBuilder.create(id, {
      orbit: {
        distance: 25,
        height: 10,
        speed: 0.0005,
        autoRotate: true
      },
      target: starPosition,
      fov: 75,
      near: 0.1,
      far: 1000
    });
  }

  /**
   * Create an orbit camera positioned to view a planet
   */
  static createPlanetView(id: string, planetPosition: THREE.Vector3, planetRadius: number): CameraBody {
    const distance = planetRadius * 3; // 3x planet radius
    const height = planetRadius * 0.5;

    return OrbitCameraBuilder.create(id, {
      orbit: {
        distance,
        height,
        speed: 0.001,
        autoRotate: true
      },
      target: planetPosition,
      fov: 60,
      near: 0.1,
      far: 1000
    });
  }
}
