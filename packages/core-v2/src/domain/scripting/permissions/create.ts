import type { ComponentType } from '../../components';
import type { PropertyValue, ScriptSchema } from '../schema';
import type { ScriptPermissions } from './types';

/** Options for permission creation. */
export interface CreateScriptPermissionsOptions {
  readonly canDestroySelf?: boolean;
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asStringArray(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
}

/**
 * Creates script permissions from schema declaration + runtime properties.
 */
export function createPermissionsFromSchema(
  schema: ScriptSchema,
  properties: Readonly<Record<string, PropertyValue>>,
  selfEntityId: string,
  options: CreateScriptPermissionsOptions = {},
): ScriptPermissions {
  const allowedEntityIds = new Set<string>();
  const allowedScriptTypes = new Set<string>();
  const allowedComponentTypes = new Set<ComponentType>();
  const allowedPrefabIds = new Set<string>();

  for (const [key, propertySchema] of Object.entries(schema.properties)) {
    const value = properties[key];

    switch (propertySchema.type) {
      case 'entityRef': {
        const entityId = asNonEmptyString(value);
        if (entityId) {
          allowedEntityIds.add(entityId);
        }
        break;
      }

      case 'entityRefArray': {
        for (const entityId of asStringArray(value)) {
          allowedEntityIds.add(entityId);
        }
        break;
      }

      case 'scriptRef': {
        allowedScriptTypes.add(propertySchema.scriptType);
        break;
      }

      case 'componentRef': {
        for (const componentType of propertySchema.componentTypes) {
          allowedComponentTypes.add(componentType);
        }
        break;
      }

      case 'prefabRef': {
        const prefabId = asNonEmptyString(value);
        if (prefabId) {
          allowedPrefabIds.add(prefabId);
        }
        break;
      }

      default:
        break;
    }
  }

  return {
    selfEntityId,
    allowedEntityIds,
    allowedScriptTypes,
    allowedComponentTypes,
    allowedPrefabIds,
    canDestroySelf: options.canDestroySelf ?? true,
  };
}
