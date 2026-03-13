import type {
  EntityId,
  SceneState,
  ComponentType,
  InspectorFieldConfig,
  ResourceKind,
} from '@duckengine/core-v2';
import {
  emitSceneChange,
  getFieldValue,
  setFieldValue,
  validateFieldValue,
  createComponentViewFromBase,
  inferResourceKindFromFieldConfig,
} from '@duckengine/core-v2';
import type { BridgeDeclaration, BridgePorts, BridgeSession } from './types';
import { toEntityId } from './types';

/**
 * Component bridge — generic read/write of any component field.
 * Supports dot-notation (e.g. halfExtents.x), ResourceRef via setResource,
 * and full component snapshot via getData.
 */
export const componentBridge: BridgeDeclaration = {
  name: 'Component',
  perEntity: true,
  factory(scene: SceneState, _entityId, _schema: unknown, _ports: BridgePorts, _session?: BridgeSession) {
    return {
      /**
       * Get a field value (supports dot-notation).
       * Scoped: (owningEntityId, entityIdFromLua, componentType, fieldKey) — uses entityIdFromLua.
       */
      getField(owningEntityId: EntityId, entityIdFromLua: string, componentType: ComponentType, fieldKey: string): unknown {
        if (!scene) return undefined;
        const eid = entityIdFromLua === owningEntityId ? owningEntityId : toEntityId(entityIdFromLua);
        const entity = scene.entities.get(eid);
        if (!entity) return undefined;
        const comp = entity.components.get(componentType);
        if (!comp) return undefined;
        return getFieldValue(comp, fieldKey);
      },

      /**
       * Set a field value (validates against inspector metadata).
       * Scoped: (owningEntityId, entityIdFromLua, componentType, fieldKey, value) — uses entityIdFromLua.
       */
      setField(
        owningEntityId: EntityId,
        entityIdFromLua: string,
        componentType: ComponentType,
        fieldKey: string,
        value: unknown,
      ): boolean {
        if (!scene) return false;
        const eid = entityIdFromLua === owningEntityId ? owningEntityId : toEntityId(entityIdFromLua);
        const entity = scene.entities.get(eid);
        if (!entity) return false;
        const comp = entity.components.get(componentType);
        if (!comp) return false;

        const meta = comp.metadata;
        const inspector = meta?.inspector;
        if (!inspector) return false;

        const field = inspector.fields.find((f: InspectorFieldConfig) => f.key === fieldKey);
        if (!field) return false;

        const validation = validateFieldValue(field, value);
        if (!validation.ok) return false;

        if (field.set) {
          (field.set as (c: unknown, v: unknown) => void)(comp, value);
        } else {
          setFieldValue(comp, fieldKey, value);
        }

        entity.observers.fireComponentChanged(eid, componentType);
        emitSceneChange(scene, {
          kind: 'component-changed',
          entityId: eid,
          componentType,
        });
        return true;
      },

      /**
       * Set a resource field by key (builds ResourceRef from field metadata).
       * Scoped: (owningEntityId, entityIdFromLua, componentType, fieldKey, resourceKey, kind?) — uses entityIdFromLua.
       */
      setResource(
        owningEntityId: EntityId,
        entityIdFromLua: string,
        componentType: ComponentType,
        fieldKey: string,
        resourceKey: string,
        kindOverride?: ResourceKind,
      ): boolean {
        if (!scene) return false;
        const eid = entityIdFromLua === owningEntityId ? owningEntityId : toEntityId(entityIdFromLua);
        const entity = scene.entities.get(eid);
        if (!entity) return false;
        const comp = entity.components.get(componentType);
        if (!comp) return false;

        const meta = comp.metadata;
        const inspector = meta?.inspector;
        if (!inspector) return false;

        const field = inspector.fields.find((f: InspectorFieldConfig) => f.key === fieldKey);
        if (!field) return false;

        const kind: ResourceKind | null =
          kindOverride ?? inferResourceKindFromFieldConfig(componentType, field);
        if (!kind) return false;

        const ref = { key: resourceKey, kind };
        // ResourceRef fields (texture/reference/resource) store { key, kind };
        // validateFieldValue expects string for texture/reference, so we set directly.
        if (field.set) {
          (field.set as (c: unknown, v: unknown) => void)(comp, ref);
        } else {
          setFieldValue(comp, fieldKey, ref);
        }

        entity.observers.fireComponentChanged(eid, componentType);
        emitSceneChange(scene, {
          kind: 'component-changed',
          entityId: eid,
          componentType,
        });
        return true;
      },

      /**
       * Get full component snapshot (readonly).
       * Scoped: (owningEntityId, entityIdFromLua, componentType) — uses entityIdFromLua.
       */
      getData(owningEntityId: EntityId, entityIdFromLua: string, componentType: ComponentType): unknown {
        if (!scene) return undefined;
        const eid = entityIdFromLua === owningEntityId ? owningEntityId : toEntityId(entityIdFromLua);
        const entity = scene.entities.get(eid);
        if (!entity) return undefined;
        const comp = entity.components.get(componentType);
        if (!comp) return undefined;
        return createComponentViewFromBase(comp);
      },

      /**
       * Check if entity has the component.
       * Scoped: (owningEntityId, entityIdFromLua, componentType) — uses entityIdFromLua.
       */
      has(owningEntityId: EntityId, entityIdFromLua: string, componentType: ComponentType): boolean {
        if (!scene) return false;
        const eid = entityIdFromLua === owningEntityId ? owningEntityId : toEntityId(entityIdFromLua);
        const entity = scene.entities.get(eid);
        if (!entity) return false;
        return entity.components.has(componentType);
      },
    };
  },
};
