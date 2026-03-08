import type { ComponentType } from '../../components';
import type { EntityState } from '../../entities';
import type { ScriptPermissions } from '../permissions';
import { canAccessComponentType } from '../permissions';
import type { ComponentsAPI } from './types';

/**
 * Builds component access API filtered by component permissions.
 */
export function buildComponentsAPI(
  entity: EntityState,
  permissions: ScriptPermissions,
): ComponentsAPI {
  return new Proxy(
    {},
    {
      get(_target, propertyKey) {
        if (typeof propertyKey !== 'string') {
          return undefined;
        }

        const type = propertyKey as ComponentType;
        if (!canAccessComponentType(permissions, type)) {
          return undefined;
        }

        return entity.components.get(type);
      },

      has(_target, propertyKey) {
        if (typeof propertyKey !== 'string') {
          return false;
        }

        const type = propertyKey as ComponentType;
        return canAccessComponentType(permissions, type) && entity.components.has(type);
      },

      set() {
        return true;
      },

      ownKeys() {
        return [...entity.components.keys()].filter((type) =>
          canAccessComponentType(permissions, type),
        );
      },

      getOwnPropertyDescriptor(_target, propertyKey) {
        if (typeof propertyKey !== 'string') return undefined;
        const type = propertyKey as ComponentType;
        if (!canAccessComponentType(permissions, type) || !entity.components.has(type)) {
          return undefined;
        }
        return {
          enumerable: true,
          configurable: true,
        };
      },
    },
  ) as ComponentsAPI;
}
