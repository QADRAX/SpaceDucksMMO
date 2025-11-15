import type { IVisualComponent } from '@client/infrastructure/scene-objects/visual-components/components/IVisualComponent';

/**
 * Component metadata for UI display and management
 */
export interface ComponentMetadata {
  /** Unique ID for this component instance */
  instanceId: string;
  /** Display name for UI */
  displayName: string;
  /** Component category (Geometry, Material, Effects, Lights, etc.) */
  category: string;
  /** Brief description */
  description?: string;
  /** Icon or emoji for UI */
  icon?: string;
}

/**
 * Wrapper around a component instance with enable/disable state
 */
export interface ManagedComponent {
  /** Unique instance ID */
  instanceId: string;
  /** The actual component */
  component: IVisualComponent;
  /** Whether component is currently active */
  enabled: boolean;
  /** Component metadata for UI */
  metadata: ComponentMetadata;
}

/**
 * Interface for objects that support component management
 * Extends basic component operations with instance-level control
 */
export interface IComponentManager {
  /**
   * Get all managed components (with metadata and state)
   */
  getManagedComponents(): ManagedComponent[];
  
  /**
   * Get a component by instance ID
   */
  getComponentByInstanceId(instanceId: string): ManagedComponent | undefined;
  
  /**
   * Enable a component by instance ID
   */
  enableComponent(instanceId: string): void;
  
  /**
   * Disable a component by instance ID (keeps it but doesn't update/render)
   */
  disableComponent(instanceId: string): void;
  
  /**
   * Remove a component by instance ID
   */
  removeComponentByInstanceId(instanceId: string): boolean;
  
  /**
   * Add a component with metadata
   */
  addManagedComponent(component: IVisualComponent, metadata: Partial<ComponentMetadata>): string;
}
