import type { SceneState, EntityId, ComponentType } from '@duckengine/core-v2';

/**
 * Component accessor pair for dynamic property resolution.
 * Used by the sandbox to read/write component fields from Lua (e.g. __GetResourceProperty).
 *
 * @param scene - The scene containing entities. If null/undefined, getter returns undefined and setter no-ops.
 * @returns Object with getter and setter functions.
 */
export function createComponentAccessorPair(scene: SceneState | null | undefined): {
  getter: <T = unknown>(entityId: EntityId, componentType: ComponentType, key: string) => T | undefined;
  setter: <T = unknown>(entityId: EntityId, componentType: ComponentType, key: string, value: T) => void;
} {
  return {
    getter: <T = unknown>(entityId: EntityId, componentType: ComponentType, key: string): T | undefined => {
      if (!scene) return undefined;
      const entity = scene.entities.get(entityId);
      if (!entity) return undefined;
      const comp = entity.components.get(componentType);
      if (!comp) return undefined;
      return (comp as unknown as Record<string, T>)[key];
    },
    setter: <T = unknown>(entityId: EntityId, componentType: ComponentType, key: string, value: T): void => {
      if (!scene) return;
      const entity = scene.entities.get(entityId);
      if (!entity) return;
      const comp = entity.components.get(componentType);
      if (!comp) return;
      (comp as unknown as Record<string, T>)[key] = value;
      entity.observers.fireComponentChanged(entityId, componentType);
    },
  };
}
