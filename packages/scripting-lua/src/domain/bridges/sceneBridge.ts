import type { SceneState } from '@duckengine/core-v2';
import { createEntityView, emitSceneChange } from '@duckengine/core-v2';
import type { BridgeDeclaration } from './types';
import type { ScriptEventBus } from '../events';

/**
 * Creates the scene bridge declaration.
 * Needs the event bus reference for fire/onEvent support.
 */
export function createSceneBridgeDeclaration(eventBus: ScriptEventBus): BridgeDeclaration {
  return {
    name: 'Scene',
    perEntity: false,
    factory(scene: SceneState, _entityId: string) {
      return {
        /** Get a readonly snapshot of any entity in the scene. */
        getEntity(id: string) {
          const e = scene.entities.get(id);
          if (!e) return null;
          return createEntityView(e);
        },

        /** Check if an entity exists in the scene. */
        exists(id: string) {
          return scene.entities.has(id);
        },

        /** Get a component property value. */
        getComponentProperty(targetEntityId: string, componentType: string, key: string) {
          const e = scene.entities.get(targetEntityId);
          if (!e) return undefined;
          const comp = e.components.get(componentType as never);
          if (!comp) return undefined;
          return (comp as unknown as Record<string, unknown>)[key];
        },

        /** Set a component property value. */
        setComponentProperty(targetEntityId: string, componentType: string, key: string, value: unknown) {
          const e = scene.entities.get(targetEntityId);
          if (!e) return;
          const comp = e.components.get(componentType as never);
          if (!comp) return;
          (comp as unknown as Record<string, unknown>)[key] = value;
          emitSceneChange(scene, {
            kind: 'component-changed',
            entityId: targetEntityId,
            componentType: componentType as never,
          });
        },

        /** Check if an entity has a specific component. */
        hasComponent(targetEntityId: string, componentType: string) {
          const e = scene.entities.get(targetEntityId);
          return e ? e.components.has(componentType as never) : false;
        },

        /** Fire an in-frame event (delivered on flush after earlyUpdate). */
        fireEvent(name: string, data: Record<string, unknown>) {
          eventBus.fire(name, data);
        },

        /** Subscribe to an in-frame event. */
        onEvent(slotId: string, name: string, cb: (data: Record<string, unknown>) => void) {
          return eventBus.on(slotId, name, cb);
        },

        /** Get the list of all entity IDs in the scene. */
        getAllEntityIds(): string[] {
          return Array.from(scene.entities.keys());
        },
      };
    },
  };
}
