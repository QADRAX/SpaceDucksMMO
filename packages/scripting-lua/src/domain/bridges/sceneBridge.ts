import type { SceneState, EntityId, ViewportId } from '@duckengine/core-v2';
import {
  buildSceneAPI,
  buildEntityAPI,
  createUISlotId,
  createViewportId,
} from '@duckengine/core-v2';
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
    factory(scene: SceneState, _entityId: string, _schema: unknown, ports, session) {
      const sceneApi = buildSceneAPI(scene, {
        raycast: (query) => {
          const hit = ports.physicsQuery?.raycast(query);
          return hit ? { ...hit, entityId: hit.entityId as EntityId } : null;
        },
        emitEvent: (eventName, payload) => {
          eventBus.fire(eventName, toEventPayload(payload));
        },
      });

      return {
        /** Get a capability-wrapped entity from the scene by ID. */
        getEntity(id: string) {
          const e = scene.entities.get(id as EntityId);
          if (!e) return null;
          return buildEntityAPI(e, scene, false);
        },

        /** Check if an entity exists in the scene. */
        exists(id: string) {
          return scene.entities.has(id as EntityId);
        },

        /** Find entities by tag. Returns wrapped entities (capabilities). */
        findByTag(tag: string) {
          return sceneApi.findByTag(tag);
        },

        /** Check if an entity has a specific component. */
        hasComponent(targetEntityId: string, componentType: string) {
          const e = scene.entities.get(targetEntityId as EntityId);
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

        /** Instantiates a prefab. Returns a wrapped entity (capability). */
        instantiate(prefabId: string, position?: {x: number, y: number, z: number}, rotation?: {x: number, y: number, z: number}) {
          return sceneApi.instantiate(prefabId, position, rotation);
        },

        /** Queues an entity for destruction. Processed after frame hooks. */
        destroy(entityId: string) {
          if (session?.pendingDestroys) {
            session.pendingDestroys.push(entityId);
          }
        },

        /** Adds a UI slot to the scene. Delegates to uiSlotOperations port. */
        addUISlot(params: {
          slotId: string;
          viewportId?: string | null;
          rect?: { x?: number; y?: number; w?: number; h?: number };
          zIndex?: number;
          enabled?: boolean;
          descriptor?: unknown;
        }) {
          const viewportId =
            params.viewportId != null ? (createViewportId(params.viewportId) as ViewportId) : null;
          return ports.uiSlotOperations?.addUISlot(scene.id, {
            slotId: createUISlotId(params.slotId),
            viewportId,
            rect: params.rect,
            zIndex: params.zIndex,
            enabled: params.enabled,
            descriptor: params.descriptor,
          });
        },

        /** Removes a UI slot from the scene. */
        removeUISlot(slotId: string) {
          return ports.uiSlotOperations?.removeUISlot(scene.id, createUISlotId(slotId));
        },

        /** Updates a UI slot. */
        updateUISlot(
          slotId: string,
          params: {
            rect?: { x?: number; y?: number; w?: number; h?: number };
            zIndex?: number;
            enabled?: boolean;
            descriptor?: unknown;
          },
        ) {
          return ports.uiSlotOperations?.updateUISlot(scene.id, createUISlotId(slotId), params);
        },
      };
    },
  };
}
