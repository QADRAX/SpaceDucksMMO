import * as THREE from 'three';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { IInspectable, InspectableProperty } from '@client/domain/scene/IInspectable';

export type CameraMode = 'orbit' | 'fixed';

/**
 * @deprecated Use CameraBody with camera components instead.
 * 
 * Legacy camera implementation with hardcoded behaviors.
 * For new code, use the component-based architecture:
 * 
 * @example
 * ```typescript
 * // Old (deprecated):
 * const camera = new CameraObject('camera', { orbitDistance: 20 });
 * 
 * // New (recommended):
 * import { OrbitCameraBuilder } from './builders';
 * const camera = OrbitCameraBuilder.create('camera', {
 *   orbit: { distance: 20, height: 10, speed: 0.001, autoRotate: true },
 *   target: new THREE.Vector3(0, 0, 0)
 * });
 * ```
 * 
 * @see CameraBody - Component container
 * @see OrbitComponent - Orbit behavior
 * @see LookAtComponent - Look-at behavior
 * @see TargetTrackingComponent - Object tracking
 * @see OrbitCameraBuilder - Convenient builders
 */

export interface CameraObjectConfig {
  fov?: number;
  aspect?: number;
  near?: number;
  far?: number;
  position?: [number, number, number];
  lookAt?: [number, number, number];
  // Orbit controls
  orbitTarget?: [number, number, number];
  orbitDistance?: number;
  orbitHeight?: number;
  orbitSpeed?: number;
  autoRotate?: boolean;
}

/**
 * Camera as ISceneObject with orbit controls
 * 
 * Features:
 * - Wraps THREE.PerspectiveCamera as ISceneObject
 * - Inspectable properties: FOV, position, orbit controls
 * - Orbital camera with configurable target, distance, height
 * - Auto-rotate option
 * - Can be added/removed from scene like any object
 * - Can wrap an existing camera or create its own
 * 
 * Usage:
 * ```ts
 * // Create with own camera
 * const camera = new CameraObject('main-camera', {
 *   fov: 75,
 *   position: [0, 10, 20],
 *   orbitTarget: [0, 0, 0],
 *   orbitDistance: 20,
 *   autoRotate: true
 * });
 * 
 * // Or wrap existing camera
 * const camera = new CameraObject('main-camera', config, existingCamera);
 * 
 * sceneEditor.addObject(camera);
 * ```
 */
export class CameraObject implements ISceneObject, IInspectable {
  readonly id: string;
  private camera: THREE.PerspectiveCamera;
  
  // Orbit state
  private orbitTarget: THREE.Vector3;
  private orbitDistance: number;
  private orbitHeight: number;
  private orbitSpeed: number;
  private orbitAngle: number = 0;
  private autoRotate: boolean;
  private mode: CameraMode;
  private targetObjectId: string | null = null;
  private targetObjectTransform: THREE.Object3D | null = null;

  constructor(id: string, config: CameraObjectConfig = {}, externalCamera?: THREE.PerspectiveCamera) {
    this.id = id;
    
    const {
      fov = 75,
      aspect = window.innerWidth / window.innerHeight,
      near = 0.1,
      far = 1000,
      position = [0, 5, 10],
      lookAt = [0, 0, 0],
      orbitTarget = lookAt,
      orbitDistance = 10,
      orbitHeight = 5,
      orbitSpeed = 0.0005,
      autoRotate = false
    } = config;

    // Use external camera or create new one
    if (externalCamera) {
      this.camera = externalCamera;
      // Apply config to external camera
      this.camera.fov = fov;
      this.camera.near = near;
      this.camera.far = far;
      this.camera.updateProjectionMatrix();
    } else {
      this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    }
    
    this.camera.position.set(...position);
    this.camera.lookAt(...lookAt);

    this.orbitTarget = new THREE.Vector3(...orbitTarget);
    this.orbitDistance = orbitDistance;
    this.orbitHeight = orbitHeight;
    this.orbitSpeed = orbitSpeed;
    this.autoRotate = autoRotate;
    this.mode = 'orbit';
  }

  addTo(scene: THREE.Scene): void {
    // Camera doesn't need to be added to scene
    // But we track it as an object for editor
  }

  removeFrom(scene: THREE.Scene): void {
    // Camera doesn't need to be removed from scene
  }

  update(dt: number): void {
    // Update orbit target from tracked object if set
    if (this.targetObjectTransform) {
      this.orbitTarget.copy(this.targetObjectTransform.position);
    }

    if (this.mode !== 'orbit' || !this.autoRotate) return;

    // Auto-rotate around target
    this.orbitAngle += this.orbitSpeed * dt;
    
    const x = this.orbitTarget.x + Math.cos(this.orbitAngle) * this.orbitDistance;
    const z = this.orbitTarget.z + Math.sin(this.orbitAngle) * this.orbitDistance;
    const y = this.orbitTarget.y + this.orbitHeight;

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.orbitTarget);
  }

  dispose(): void {
    // No resources to dispose
  }

  /**
   * Get the THREE.js camera for rendering
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  // ============================================
  // IInspectable Implementation
  // ============================================

  getTransform(): THREE.Object3D {
    return this.camera;
  }

  getInspectableProperties(): InspectableProperty[] {
    return [
      // Camera mode
      {
        name: 'mode',
        label: 'Camera Mode',
        type: 'select',
        value: this.mode,
        options: [
          { value: 'orbit', label: 'Orbit' },
          { value: 'fixed', label: 'Fixed' }
        ],
        description: 'Camera control mode'
      },

      // Orbit target selector (only in orbit mode)
      {
        name: 'targetObjectId',
        label: 'Orbit Target',
        type: 'string',
        value: this.targetObjectId || 'manual',
        description: 'Object to orbit around (set via scene editor)'
      },

      // Camera properties
      {
        name: 'fov',
        label: 'Field of View',
        type: 'number',
        value: this.camera.fov,
        min: 30,
        max: 120,
        step: 1,
        description: 'Camera field of view in degrees'
      },
      {
        name: 'near',
        label: 'Near Plane',
        type: 'number',
        value: this.camera.near,
        min: 0.01,
        max: 10,
        step: 0.1,
        description: 'Near clipping plane distance'
      },
      {
        name: 'far',
        label: 'Far Plane',
        type: 'number',
        value: this.camera.far,
        min: 10,
        max: 10000,
        step: 100,
        description: 'Far clipping plane distance'
      },

      // Orbit controls
      {
        name: 'orbitTargetX',
        label: 'Orbit Target X',
        type: 'number',
        value: this.orbitTarget.x,
        step: 0.5,
        description: 'X position of orbit target'
      },
      {
        name: 'orbitTargetY',
        label: 'Orbit Target Y',
        type: 'number',
        value: this.orbitTarget.y,
        step: 0.5,
        description: 'Y position of orbit target'
      },
      {
        name: 'orbitTargetZ',
        label: 'Orbit Target Z',
        type: 'number',
        value: this.orbitTarget.z,
        step: 0.5,
        description: 'Z position of orbit target'
      },
      {
        name: 'orbitDistance',
        label: 'Orbit Distance',
        type: 'number',
        value: this.orbitDistance,
        min: 1,
        max: 100,
        step: 0.5,
        description: 'Distance from orbit target'
      },
      {
        name: 'orbitHeight',
        label: 'Orbit Height',
        type: 'number',
        value: this.orbitHeight,
        min: -50,
        max: 50,
        step: 0.5,
        description: 'Height above orbit target'
      },
      {
        name: 'orbitSpeed',
        label: 'Orbit Speed',
        type: 'number',
        value: this.orbitSpeed,
        min: 0,
        max: 0.01,
        step: 0.0001,
        description: 'Rotation speed around target'
      },
      {
        name: 'autoRotate',
        label: 'Auto Rotate',
        type: 'boolean',
        value: this.autoRotate,
        description: 'Automatically rotate around target'
      }
    ];
  }

  setProperty(name: string, value: any): void {
    switch (name) {
      case 'mode':
        this.mode = value as CameraMode;
        break;
      case 'targetObjectId':
        this.targetObjectId = value === 'manual' ? null : value;
        break;
      case 'fov':
        this.camera.fov = value;
        this.camera.updateProjectionMatrix();
        break;
      case 'near':
        this.camera.near = value;
        this.camera.updateProjectionMatrix();
        break;
      case 'far':
        this.camera.far = value;
        this.camera.updateProjectionMatrix();
        break;
      case 'orbitTargetX':
        this.orbitTarget.x = value;
        this.camera.lookAt(this.orbitTarget);
        break;
      case 'orbitTargetY':
        this.orbitTarget.y = value;
        this.camera.lookAt(this.orbitTarget);
        break;
      case 'orbitTargetZ':
        this.orbitTarget.z = value;
        this.camera.lookAt(this.orbitTarget);
        break;
      case 'orbitDistance':
        this.orbitDistance = value;
        break;
      case 'orbitHeight':
        this.orbitHeight = value;
        break;
      case 'orbitSpeed':
        this.orbitSpeed = value;
        break;
      case 'autoRotate':
        this.autoRotate = value;
        break;
    }
  }

  getProperty(name: string): any {
    switch (name) {
      case 'mode': return this.mode;
      case 'targetObjectId': return this.targetObjectId || 'manual';
      case 'fov': return this.camera.fov;
      case 'near': return this.camera.near;
      case 'far': return this.camera.far;
      case 'orbitTargetX': return this.orbitTarget.x;
      case 'orbitTargetY': return this.orbitTarget.y;
      case 'orbitTargetZ': return this.orbitTarget.z;
      case 'orbitDistance': return this.orbitDistance;
      case 'orbitHeight': return this.orbitHeight;
      case 'orbitSpeed': return this.orbitSpeed;
      case 'autoRotate': return this.autoRotate;
      default: return undefined;
    }
  }

  getTypeName(): string {
    return 'Camera';
  }

  // ============================================
  // Orbit Control Methods
  // ============================================

  /**
   * Set orbit target position
   */
  setOrbitTarget(x: number, y: number, z: number): void {
    this.orbitTarget.set(x, y, z);
    this.camera.lookAt(this.orbitTarget);
  }

  /**
   * Set orbit parameters
   */
  setOrbitParams(distance: number, height: number, speed: number): void {
    this.orbitDistance = distance;
    this.orbitHeight = height;
    this.orbitSpeed = speed;
  }

  /**
   * Set target from scene object position
   */
  setTargetFromObject(position: THREE.Vector3, objectId: string): void {
    this.targetObjectId = objectId;
    this.orbitTarget.copy(position);
    this.camera.lookAt(this.orbitTarget);
  }

  /**
   * Set target object transform to track dynamically
   */
  setTargetObjectTransform(transform: THREE.Object3D | null): void {
    this.targetObjectTransform = transform;
  }

  /**
   * Get current target object ID
   */
  getTargetObjectId(): string | null {
    return this.targetObjectId;
  }

  /**
   * Enable/disable auto-rotation
   */
  setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
  }
}

export default CameraObject;
