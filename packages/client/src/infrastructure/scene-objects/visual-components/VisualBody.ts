import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { ITextureReloadable } from '@client/domain/scene/ITextureReloadable';
import type { IInspectable, InspectableProperty } from '@client/domain/scene/IInspectable';
import type { IComponentManager, ManagedComponent, ComponentMetadata } from '@client/domain/scene/IComponentManager';
import type { IVisualComponent } from './components/IVisualComponent';
import { TextureComponent } from './components/TextureComponent';
import * as THREE from 'three';

/**
 * Generic visual body - pure component container for any 3D object.
 * Does NOT assume sphere geometry, material type, or specific visual features.
 * Everything is delegated to components for maximum flexibility.
 * 
 * Supports full runtime component management: add, remove, replace components dynamically.
 * 
 * Philosophy:
 * - VisualBody is INFRASTRUCTURE (rendering system)
 * - Components define WHAT to render (geometry, material, effects)
 * - Domain objects (Sun, Planet, Ship) define WHICH components to use
 * 
 * @example
 * ```ts
 * // Create a glowing star
 * const star = new VisualBody('sun-1')
 *   .addComponent(new GeometryComponent({ type: 'sphere', radius: 1.2 }))
 *   .addComponent(new MaterialComponent({ color: 0xffaa00 }))
 *   .addComponent(new EmissiveComponent({ color: 0xffdd44, intensity: 2.0 }))
 *   .addComponent(new CoronaComponent({ color: 0xffdd44, radiusMultiplier: 1.4 }))
 *   .addComponent(new LightEmissionComponent({ intensity: 6.0 }));
 * 
 * // Runtime component management
 * if (star.hasComponent(CoronaComponent)) {
 *   // Replace corona with a bigger one
 *   star.replaceComponent(CoronaComponent, 
 *     new CoronaComponent({ color: 0xff0000, radiusMultiplier: 2.0 })
 *   );
 * }
 * 
 * // Remove component dynamically
 * star.removeComponent(LightEmissionComponent);
 * 
 * // Change geometry at runtime
 * star.replaceComponent(GeometryComponent, 
 *   new GeometryComponent({ type: 'sphere', radius: 2.0 })
 * );
 * 
 * // Create a textured planet
 * const planet = new VisualBody('earth-1')
 *   .addComponent(new GeometryComponent({ type: 'sphere', radius: 1.0 }))
 *   .addComponent(new MaterialComponent({ color: 0xffffff }))
 *   .addComponent(new TextureComponent(resolver, { textureId: 'earth' }))
 *   .addComponent(new AtmosphereComponent({ color: 0x4488ff }));
 * 
 * // Create a spaceship (future use)
 * const ship = new VisualBody('ship-1')
 *   .addComponent(new GeometryComponent({ type: 'box', width: 2, height: 1, depth: 3 }))
 *   .addComponent(new MaterialComponent({ color: 0x888888, metalness: 0.9 }))
 *   .addComponent(new EngineGlowComponent({ color: 0x00ffff }));
 * ```
 */
export class VisualBody implements ISceneObject, ITextureReloadable, IInspectable, IComponentManager {
  readonly id: string;
  
  private mainMesh!: THREE.Mesh;
  private components: IVisualComponent[] = [];
  private managedComponents: Map<string, ManagedComponent> = new Map();
  private nextInstanceId = 0;
  private scene?: THREE.Scene;

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Add a component to this visual body
   * @deprecated Use addManagedComponent for better control
   */
  addComponent(component: IVisualComponent): this {
    // Auto-generate metadata from component type
    const componentName = component.constructor.name.replace('Component', '');
    this.addManagedComponent(component, {
      displayName: componentName,
      category: this.inferCategory(component),
      icon: this.inferIcon(component)
    });
    
    return this;
  }

  private inferCategory(component: IVisualComponent): string {
    const name = component.constructor.name;
    if (name.includes('Geometry')) return 'Geometry';
    if (name.includes('Material')) return 'Material';
    if (name.includes('Texture')) return 'Texture';
    if (name.includes('Emissive')) return 'Emission';
    if (name.includes('Light')) return 'Lighting';
    if (name.includes('Corona') || name.includes('Atmosphere') || name.includes('Glow')) return 'Effects';
    if (name.includes('Rotation') || name.includes('Orbit')) return 'Animation';
    if (name.includes('Grid') || name.includes('Axes')) return 'Helpers';
    if (name.includes('Accretion') || name.includes('EventHorizon') || name.includes('Jet')) return 'Black Hole';
    return 'General';
  }

  private inferIcon(component: IVisualComponent): string {
    const name = component.constructor.name;
    if (name.includes('Geometry')) return '📐';
    if (name.includes('Material')) return '🎨';
    if (name.includes('Texture')) return '🖼️';
    if (name.includes('Emissive')) return '💡';
    if (name.includes('Light')) return '☀️';
    if (name.includes('Corona')) return '🌟';
    if (name.includes('Atmosphere')) return '🌍';
    if (name.includes('Rotation')) return '🔄';
    if (name.includes('Grid')) return '📏';
    if (name.includes('Axes')) return '📍';
    if (name.includes('Accretion')) return '🌀';
    if (name.includes('EventHorizon')) return '⚫';
    return '🔹';
  }

  /**
   * Remove a component by type
   * Properly disposes the component before removing it
   */
  removeComponent<T extends IVisualComponent>(type: new (...args: any[]) => T): boolean {
    const index = this.components.findIndex(c => c instanceof type);
    
    if (index === -1) {
      return false; // Component not found
    }

    const component = this.components[index];
    
    // Dispose component if scene is available
    if (this.scene) {
      component.dispose(this.scene);
    }

    // Remove from array
    this.components.splice(index, 1);
    
    return true;
  }

  /**
   * Replace an existing component with a new one
   * If the component doesn't exist, adds it instead
   */
  replaceComponent<T extends IVisualComponent>(
    type: new (...args: any[]) => T,
    newComponent: T
  ): this {
    const index = this.components.findIndex(c => c instanceof type);
    
    if (index !== -1) {
      // Dispose old component
      const oldComponent = this.components[index];
      if (this.scene) {
        oldComponent.dispose(this.scene);
      }
      
      // Replace in array
      this.components[index] = newComponent;
      
      // Initialize new component if already in scene
      if (this.scene && this.mainMesh) {
        newComponent.initialize(this.scene, this.mainMesh);
      }
    } else {
      // Component doesn't exist, just add it
      this.addComponent(newComponent);
    }
    
    return this;
  }

  /**
   * Check if this visual body has a specific component type
   */
  hasComponent<T extends IVisualComponent>(type: new (...args: any[]) => T): boolean {
    return this.components.some(c => c instanceof type);
  }

  /**
   * Get a component by type
   */
  getComponent<T extends IVisualComponent>(type: new (...args: any[]) => T): T | undefined {
    return this.components.find(c => c instanceof type) as T | undefined;
  }

  /**
   * Get all components (useful for debugging or advanced manipulation)
   */
  getAllComponents(): readonly IVisualComponent[] {
    return [...this.components];
  }

  /**
   * Remove all components of a given category
   * Useful for replacing entire rendering strategies
   */
  removeAllComponents(): void {
    if (this.scene) {
      // Dispose all components
      this.components.forEach(component => {
        component.dispose(this.scene!);
      });
    }
    
    this.components = [];
  }

  addTo(scene: THREE.Scene): void {
    this.scene = scene;
    
    // Create minimal empty mesh - components will configure it
    const geometry = new THREE.SphereGeometry(1.0, 32, 32); // Placeholder
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Placeholder
    
    this.mainMesh = new THREE.Mesh(geometry, material);
    scene.add(this.mainMesh);

    // Initialize all components - they will configure the mesh
    this.components.forEach(component => {
      component.initialize(scene, this.mainMesh);
    });
  }

  update(deltaTime: number): void {
    // Update only enabled components
    for (const managed of this.managedComponents.values()) {
      if (managed.enabled) {
        managed.component.update(deltaTime);
      }
    }
  }

  async reloadTexture(): Promise<void> {
    // Find texture component and reload
    const textureComponent = this.getComponent(TextureComponent);
    if (textureComponent) {
      await (textureComponent as any).reloadTexture();
    }
  }

  /**
   * Get the main mesh for external manipulation
   */
  getObject3D(): THREE.Mesh {
    return this.mainMesh;
  }

  /**
   * Set position of the visual body
   */
  setPosition(x: number, y: number, z: number): void {
    if (this.mainMesh) {
      this.mainMesh.position.set(x, y, z);
    }
  }

  removeFrom(scene: THREE.Scene): void {
    // Dispose all components
    this.components.forEach(component => {
      component.dispose(scene);
    });

    // Remove main mesh
    if (this.mainMesh) {
      scene.remove(this.mainMesh);
      this.mainMesh.geometry.dispose();
      (this.mainMesh.material as THREE.Material).dispose();
    }
  }

  dispose(): void {
    // Cleanup handled in removeFrom
  }

  // ============================================
  // IInspectable Implementation
  // ============================================

  getTransform(): THREE.Object3D {
    return this.mainMesh;
  }

  getInspectableProperties(): InspectableProperty[] {
    const properties: InspectableProperty[] = [];

    // Delegate to ALL components - no base properties
    // Pure delegation pattern: VisualBody knows nothing about what it's rendering
    this.components.forEach(component => {
      if ('getInspectableProperties' in component && typeof component.getInspectableProperties === 'function') {
        const componentProperties = component.getInspectableProperties();
        properties.push(...componentProperties);
      }
    });

    return properties;
  }

  setProperty(name: string, value: any): void {
    // Pure delegation to components - VisualBody has no properties of its own
    for (const component of this.components) {
      if ('setProperty' in component && typeof component.setProperty === 'function') {
        // Check if this property belongs to this component
        if ('getProperty' in component && typeof component.getProperty === 'function') {
          const currentValue = component.getProperty(name);
          if (currentValue !== undefined) {
            component.setProperty(name, value);
            return;
          }
        }
      }
    }
  }

  getProperty(name: string): any {
    // Pure delegation to components
    for (const component of this.components) {
      if ('getProperty' in component && typeof component.getProperty === 'function') {
        const value = component.getProperty(name);
        if (value !== undefined) {
          return value;
        }
      }
    }

    return undefined;
  }

  getTypeName(): string {
    // Infer type from component composition
    // This could be made configurable or moved to domain layer
    const componentTypes = this.components.map(c => c.constructor.name);
    
    if (componentTypes.includes('AccretionDiskComponent') || componentTypes.includes('EventHorizonComponent')) {
      return 'Black Hole';
    }
    if (componentTypes.includes('CoronaComponent') || componentTypes.includes('LightEmissionComponent')) {
      return 'Star';
    }
    if (componentTypes.includes('AtmosphereComponent')) {
      return 'Planet';
    }
    
    return 'Visual Object';
  }

  // ============================================
  // IComponentManager Implementation
  // ============================================

  getManagedComponents(): ManagedComponent[] {
    return Array.from(this.managedComponents.values());
  }

  getComponentByInstanceId(instanceId: string): ManagedComponent | undefined {
    return this.managedComponents.get(instanceId);
  }

  enableComponent(instanceId: string): void {
    const managed = this.managedComponents.get(instanceId);
    if (!managed) return;

    if (!managed.enabled) {
      managed.enabled = true;
      // Re-initialize if in scene
      if (this.scene && this.mainMesh) {
        managed.component.initialize(this.scene, this.mainMesh);
      }
    }
  }

  disableComponent(instanceId: string): void {
    const managed = this.managedComponents.get(instanceId);
    if (!managed) return;

    if (managed.enabled) {
      managed.enabled = false;
      // Dispose without removing
      if (this.scene) {
        managed.component.dispose(this.scene);
      }
    }
  }

  removeComponentByInstanceId(instanceId: string): boolean {
    const managed = this.managedComponents.get(instanceId);
    if (!managed) return false;

    // Dispose component
    if (this.scene && managed.enabled) {
      managed.component.dispose(this.scene);
    }

    // Remove from components array
    const index = this.components.indexOf(managed.component);
    if (index !== -1) {
      this.components.splice(index, 1);
    }

    // Remove from managed map
    this.managedComponents.delete(instanceId);
    
    return true;
  }

  addManagedComponent(component: IVisualComponent, metadata: Partial<ComponentMetadata>): string {
    const instanceId = `${this.id}-component-${this.nextInstanceId++}`;
    
    // Create full metadata with defaults
    const fullMetadata: ComponentMetadata = {
      instanceId,
      displayName: metadata.displayName || component.constructor.name,
      category: metadata.category || 'General',
      description: metadata.description,
      icon: metadata.icon
    };

    const managed: ManagedComponent = {
      instanceId,
      component,
      enabled: true,
      metadata: fullMetadata
    };

    this.managedComponents.set(instanceId, managed);
    this.components.push(component);

    // Initialize if already in scene
    if (this.scene && this.mainMesh) {
      component.initialize(this.scene, this.mainMesh);
    }

    return instanceId;
  }
}
