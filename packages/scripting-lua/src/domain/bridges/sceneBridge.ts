import type { SceneState, ScriptSchema, ScriptPermissions } from '@duckengine/core-v2';
import { createEntityView, emitSceneChange, buildSceneAPI, createPermissionsFromSchema } from '@duckengine/core-v2';
import type { BridgeDeclaration } from './types';
import type { ScriptEventBus } from '../events';

function toEventPayload(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return { value: payload };
}

/**
 * Creates the scene bridge declaration.
 * Derives permissions from the script schema, or creates unrestricted permissions
 * if schema is not available (fallback for legacy scripts).
 * Needs the event bus reference for fire/onEvent support.
 */
export function createSceneBridgeDeclaration(eventBus: ScriptEventBus): BridgeDeclaration {
  return {
    name: 'Scene',
    perEntity: false,
    factory(scene: SceneState, entityId: string, schema: ScriptSchema | null, ports) {
      const permissions: ScriptPermissions = schema
        ? createPermissionsFromSchema(schema, {}, entityId)
        : {
            selfEntityId: entityId,
            allowedEntityIds: new Set(scene.entities.keys()),
            allowedScriptTypes: new Set<string>(),
            allowedComponentTypes: new Set(),
            allowedPrefabIds: new Set<string>(),
            canDestroySelf: true,
          };

      const sceneApi = buildSceneAPI(scene, permissions, {
        raycast: (query) => ports.physicsQuery?.raycast(query) ?? null,
        emitEvent: (eventName, payload) => {
          eventBus.fire(eventName, toEventPayload(payload));
        },
      });

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
        setComponentProperty(
          targetEntityId: string,
          componentType: string,
          key: string,
          value: unknown,
        ) {
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

        /** Emits an event via the SceneAPI adapter. */
        emit(name: string, payload?: unknown) {
          sceneApi.emit(name, payload);
        },

        /** Runs a physics raycast via SceneAPI integration. */
        raycast(query: {
          origin: { x: number; y: number; z: number };
          direction: { x: number; y: number; z: number };
          maxDistance: number;
        }) {
          return sceneApi.raycast(query);
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
