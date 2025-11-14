import * as THREE from 'three';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { IInspectable, InspectableProperty } from '@client/domain/scene/IInspectable';
import { ILightComponent, IInspectableLightComponent } from './components/ILightComponent';

/**
 * LightBody - Pure component container for light sources.
 * 
 * Philosophy:
 * LightBody is a generic infrastructure layer for lighting.
 * It manages a THREE.Group container and delegates all lighting to pluggable components.
 * 
 * Architecture:
 * - Infrastructure: LightBody (this class) - manages lifecycle and components
 * - Lighting: ILightComponent implementations (AmbientLightComponent, DirectionalLightComponent, etc.)
 * - Composition: Builders combine LightBody + components for specific scenarios
 * 
 * Component Management:
 * - addComponent(): Add a light source
 * - removeComponent(): Remove a light at runtime
 * - replaceComponent(): Swap light types
 * 
 * @example
 * ```typescript
 * // Ambient + Directional lighting
 * const light = new LightBody('scene-lighting')
 *   .addComponent(new AmbientLightComponent({ intensity: 0.3 }))
 *   .addComponent(new DirectionalLightComponent({ intensity: 0.7 }));
 * 
 * // Runtime modification
 * light.replaceComponent(AmbientLightComponent, 
 *   new AmbientLightComponent({ color: 0xff9999, intensity: 0.5 })
 * );
 * ```
 */
export class LightBody implements ISceneObject, IInspectable {
  readonly id: string;
  private container: THREE.Group;
  private components: ILightComponent[] = [];
  private scene: THREE.Scene | null = null;
  private isInitialized: boolean = false;

  constructor(id: string) {
    this.id = id;
    this.container = new THREE.Group();
    this.container.name = id;
  }

  // ============================================
  // ISceneObject Implementation
  // ============================================

  addTo(scene: THREE.Scene): void {
    if (this.scene) return;

    this.scene = scene;
    scene.add(this.container);

    // Initialize all components
    this.components.forEach(component => {
      component.initialize(scene, this.container);
    });

    this.isInitialized = true;
  }

  removeFrom(scene: THREE.Scene): void {
    if (!this.scene) return;

    scene.remove(this.container);
    this.scene = null;
    this.isInitialized = false;
  }

  update(deltaTime: number): void {
    if (!this.isInitialized) return;

    // Update all components (most lights are static)
    this.components.forEach(component => {
      component.update(deltaTime);
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
    return this.container;
  }

  // ============================================
  // Component Management
  // ============================================

  /**
   * Add a light component.
   * If the light is already in the scene, the component will be initialized immediately.
   */
  addComponent(component: ILightComponent): this {
    this.components.push(component);

    // Initialize component if light is already in scene
    if (this.scene && this.isInitialized) {
      component.initialize(this.scene, this.container);
    }

    return this;
  }

  /**
   * Remove a component by type.
   * The component will be disposed before removal.
   * 
   * @returns true if component was found and removed, false otherwise
   */
  removeComponent<T extends ILightComponent>(type: new (...args: any[]) => T): boolean {
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
  replaceComponent<T extends ILightComponent>(
    type: new (...args: any[]) => T,
    newComponent: T
  ): this {
    const index = this.components.findIndex(c => c instanceof type);
    if (index !== -1) {
      const oldComponent = this.components[index];
      oldComponent.dispose();
      this.components[index] = newComponent;

      if (this.scene && this.isInitialized) {
        newComponent.initialize(this.scene, this.container);
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
  hasComponent<T extends ILightComponent>(type: new (...args: any[]) => T): boolean {
    return this.components.some(c => c instanceof type);
  }

  /**
   * Get all components (readonly)
   */
  getAllComponents(): readonly ILightComponent[] {
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
  // IInspectable Implementation
  // ============================================

  getInspectableProperties(): InspectableProperty[] {
    const properties: InspectableProperty[] = [];

    // Collect properties from all inspectable components
    this.components.forEach(component => {
      if (this.isInspectableComponent(component)) {
        properties.push(...component.getInspectableProperties());
      }
    });

    return properties;
  }

  setProperty(name: string, value: any): void {
    // Delegate to components
    this.components.forEach(component => {
      if (this.isInspectableComponent(component)) {
        component.setProperty(name, value);
      }
    });
  }

  getProperty(name: string): any {
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
      .map(c => c.constructor.name.replace('LightComponent', ''))
      .join('+');
    
    return componentTypes ? `Light (${componentTypes})` : 'Light';
  }

  // ============================================
  // Private Helpers
  // ============================================

  private isInspectableComponent(component: ILightComponent): component is IInspectableLightComponent {
    return 'getInspectableProperties' in component;
  }
}
