import type {
  ComponentType,
  EntityId,
  SceneEventBus,
  SceneRaycastQuery,
  SceneState,
  ViewportId,
} from '@duckengine/core-v2';
import {
  buildSceneAPI,
  buildEntityAPI,
  createUISlotId,
  createViewportId,
} from '@duckengine/core-v2';
import type { BridgeDeclaration, BridgePorts, BridgeSession } from './types';
import { toEntityId } from './types';

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
export function createSceneBridgeDeclaration(eventBus: SceneEventBus): BridgeDeclaration {
  return {
    name: 'Scene',
    perEntity: false,
    factory(scene: SceneState, _entityId, _schema: unknown, ports: BridgePorts, session?: BridgeSession) {
      const sceneApi = buildSceneAPI(scene, {
        raycast: (query) => {
          const hit = ports.physicsQuery?.raycast(query);
          return hit ? { ...hit, entityId: toEntityId(hit.entityId as string) } : null;
        },
        emitEvent: (eventName, payload) => {
          eventBus.fire(eventName, toEventPayload(payload));
        },
      });

      return {
        /** Get a capability-wrapped entity from the scene by ID. id from Lua. */
        getEntity(id: string) {
          const e = scene.entities.get(toEntityId(id));
          if (!e) return null;
          return buildEntityAPI(e, scene, false);
        },

        /** Check if an entity exists in the scene. id from Lua. */
        exists(id: string) {
          return scene.entities.has(toEntityId(id));
        },

        /** Find entities by tag. Returns wrapped entities (capabilities). */
        findByTag(tag: string) {
          return sceneApi.findByTag(tag);
        },

        /** Check if an entity has a specific component. targetEntityId from Lua. */
        hasComponent(targetEntityId: string, componentType: ComponentType) {
          const e = scene.entities.get(toEntityId(targetEntityId));
          return e ? e.components.has(componentType) : false;
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
        raycast(query: SceneRaycastQuery) {
          return sceneApi.raycast(query);
        },

        /** Subscribe to an in-frame event. */
        onEvent(slotId: string, name: string, cb: (data: Record<string, unknown>) => void) {
          return eventBus.on(slotId, name, cb);
        },

        /** Get the list of all entity IDs in the scene. */
        getAllEntityIds(): EntityId[] {
          return Array.from(scene.entities.keys());
        },

        /** Instantiates a prefab. Returns a wrapped entity (capability). */
        instantiate(prefabId: string, position?: {x: number, y: number, z: number}, rotation?: {x: number, y: number, z: number}) {
          return sceneApi.instantiate(prefabId, position, rotation);
        },

        /** Queues an entity for destruction. Processed after frame hooks. */
        destroy(entityId: string) {
          const pending = (session as { pendingDestroys?: EntityId[] } | undefined)?.pendingDestroys;
          if (pending) {
            pending.push(toEntityId(entityId));
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
