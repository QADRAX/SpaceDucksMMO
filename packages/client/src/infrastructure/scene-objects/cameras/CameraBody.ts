import * as THREE from 'three';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { IInspectable, InspectableProperty } from '@client/domain/scene/IInspectable';
import { ICameraComponent, IInspectableCameraComponent } from './components/ICameraComponent';

export interface CameraBodyConfig {
  /** Field of view in degrees */
  fov?: number;
  /** Aspect ratio (typically width / height) */
  aspect?: number;
  /** Near clipping plane */
  near?: number;
  /** Far clipping plane */
  far?: number;
  /** Use an external camera instead of creating one */
  externalCamera?: THREE.PerspectiveCamera;
}

/**
 * CameraBody - Pure component container for camera behaviors.
 * 
 * Philosophy:
 * CameraBody is a generic infrastructure layer that manages a THREE.PerspectiveCamera
 * and delegates all behavior to pluggable components. It does NOT know how the camera
 * should behave (orbit, follow, fixed, etc.) - components define that.
 * 
 * Architecture:
 * - Infrastructure: CameraBody (this class) - manages camera lifecycle and components
 * - Behavior: ICameraComponent implementations (OrbitComponent, FollowComponent, etc.)
 * - Composition: Builders combine CameraBody + components for specific use cases
 * 
 * Component Management:
 * - addComponent(): Add a behavior component (orbit, follow, etc.)
 * - removeComponent(): Remove a behavior component at runtime
 * - replaceComponent(): Swap components (e.g., orbit → follow)
 * - hasComponent(): Check if component exists
 * - getAllComponents(): Get all active components
 * 
 * Camera Properties (managed by CameraBody):
 * - fov, aspect, near, far: Projection properties
 * - Position is controlled by components
 * 
 * @example
 * ```typescript
 * // Orbit camera
 * const camera = new CameraBody('main-camera')
 *   .addComponent(new OrbitComponent({ distance: 20 }))
 *   .addComponent(new LookAtComponent({ target: new THREE.Vector3(0, 0, 0) }));
 * 
 * // Runtime behavior change
 * camera.replaceComponent(OrbitComponent, new FollowComponent({ smoothness: 0.1 }));
 * 
 * // Fixed camera
 * const fixedCam = new CameraBody('fixed-camera');
 * fixedCam.getCamera().position.set(0, 10, 20);
 * fixedCam.addComponent(new LookAtComponent({ target: new THREE.Vector3(0, 0, 0) }));
 * ```
 */
export class CameraBody implements ISceneObject, IInspectable {
  readonly id: string;
  private camera: THREE.PerspectiveCamera;
  private components: ICameraComponent[] = [];
  private scene: THREE.Scene | null = null;
  private isInitialized: boolean = false;

  constructor(id: string, config: CameraBodyConfig = {}) {
    this.id = id;

    // Use external camera or create new one
    if (config.externalCamera) {
      this.camera = config.externalCamera;
    } else {
      this.camera = new THREE.PerspectiveCamera(
        config.fov ?? 75,
        config.aspect ?? window.innerWidth / window.innerHeight,
        config.near ?? 0.1,
        config.far ?? 1000
      );
    }
  }

  // ============================================
  // ISceneObject Implementation
  // ============================================

  getId(): string {
    return this.id;
  }

  addTo(scene: THREE.Scene): void {
    if (this.scene) return;

    this.scene = scene;
    scene.add(this.camera);

    // Initialize all components
    this.components.forEach(component => {
      component.initialize(this.camera, scene);
    });

    this.isInitialized = true;
  }

  removeFrom(scene: THREE.Scene): void {
    if (!this.scene) return;

    scene.remove(this.camera);
    this.scene = null;
    this.isInitialized = false;
  }

  update(deltaTime: number): void {
    if (!this.isInitialized) return;

    // Update all components
    this.components.forEach(component => {
      component.update(deltaTime, this.camera);
    });
  }

  dispose(): void {
    // Dispose all components
    this.components.forEach(component => {
      component.dispose();
    });
    this.components = [];

    if (this.scene) {
      this.removeFrom(this.scene);
    }
  }

  getTransform(): THREE.Object3D {
    return this.camera;
  }

  // ============================================
  // Component Management
  // ============================================

  /**
   * Add a camera behavior component.
   * If the camera is already in the scene, the component will be initialized immediately.
   */
  addComponent(component: ICameraComponent): this {
    this.components.push(component);

    // Initialize component if camera is already in scene
    if (this.scene && this.isInitialized) {
      component.initialize(this.camera, this.scene);
    }

    return this;
  }

  /**
   * Remove a component by type.
   * The component will be disposed before removal.
   * 
   * @returns true if component was found and removed, false otherwise
   */
  removeComponent<T extends ICameraComponent>(type: new (...args: any[]) => T): boolean {
    const index = this.components.findIndex(c => c instanceof type);
    if (index === -1) return false;

    const component = this.components[index];
    component.dispose();
    this.components.splice(index, 1);
    return true;
  }

  /**
   * Replace an existing component with a new one.
   * The old component will be disposed and the new one initialized if in scene.
   */
  replaceComponent<T extends ICameraComponent>(
    type: new (...args: any[]) => T,
    newComponent: T
  ): this {
    const index = this.components.findIndex(c => c instanceof type);
    if (index !== -1) {
      const oldComponent = this.components[index];
      oldComponent.dispose();
      this.components[index] = newComponent;

      if (this.scene && this.isInitialized) {
        newComponent.initialize(this.camera, this.scene);
      }
    } else {
      // Component doesn't exist, just add it
      this.addComponent(newComponent);
    }
    return this;
  }

  /**
   * Check if a component of the given type exists
   */
  hasComponent<T extends ICameraComponent>(type: new (...args: any[]) => T): boolean {
    return this.components.some(c => c instanceof type);
  }

  /**
   * Get all components (readonly)
   */
  getAllComponents(): readonly ICameraComponent[] {
    return [...this.components];
  }

  /**
   * Remove all components
   */
  removeAllComponents(): void {
    this.components.forEach(component => {
      component.dispose();
    });
    this.components = [];
  }

  // ============================================
  // Camera Access
  // ============================================

  /**
   * Get the underlying THREE.PerspectiveCamera
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Update camera aspect ratio (call after window resize)
   */
  updateAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  // ============================================
  // IInspectable Implementation
  // ============================================

  getInspectableProperties(): InspectableProperty[] {
    const properties: InspectableProperty[] = [
      // Camera properties
      {
        name: 'camera.fov',
        label: 'Field of View',
        type: 'number',
        value: this.camera.fov,
        min: 30,
        max: 120,
        step: 1,
        description: 'Camera field of view in degrees'
      },
      {
        name: 'camera.near',
        label: 'Near Plane',
        type: 'number',
        value: this.camera.near,
        min: 0.01,
        max: 10,
        step: 0.1,
        description: 'Near clipping plane distance'
      },
      {
        name: 'camera.far',
        label: 'Far Plane',
        type: 'number',
        value: this.camera.far,
        min: 10,
        max: 10000,
        step: 100,
        description: 'Far clipping plane distance'
      }
    ];

    // Collect properties from all inspectable components
    this.components.forEach(component => {
      if (this.isInspectableComponent(component)) {
        properties.push(...component.getInspectableProperties());
      }
    });

    return properties;
  }

  setProperty(name: string, value: any): void {
    // Handle camera properties
    if (name === 'camera.fov') {
      this.camera.fov = value;
      this.camera.updateProjectionMatrix();
      return;
    }
    if (name === 'camera.near') {
      this.camera.near = value;
      this.camera.updateProjectionMatrix();
      return;
    }
    if (name === 'camera.far') {
      this.camera.far = value;
      this.camera.updateProjectionMatrix();
      return;
    }

    // Delegate to components
    this.components.forEach(component => {
      if (this.isInspectableComponent(component)) {
        component.setProperty(name, value);
      }
    });
  }

  getProperty(name: string): any {
    // Handle camera properties
    if (name === 'camera.fov') return this.camera.fov;
    if (name === 'camera.near') return this.camera.near;
    if (name === 'camera.far') return this.camera.far;

    // Delegate to components
    for (const component of this.components) {
      if (this.isInspectableComponent(component)) {
        const value = component.getProperty(name);
        if (value !== undefined) return value;
      }
    }

    return undefined;
  }

  getTypeName(): string {
    // Infer type from components
    const componentTypes = this.components
      .map(c => c.constructor.name.replace('Component', ''))
      .join('+');
    
    return componentTypes ? `Camera (${componentTypes})` : 'Camera';
  }

  // ============================================
  // Private Helpers
  // ============================================

  private isInspectableComponent(component: ICameraComponent): component is IInspectableCameraComponent {
    return 'getInspectableProperties' in component;
  }
}
