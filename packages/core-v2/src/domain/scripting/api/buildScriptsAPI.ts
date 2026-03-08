import type { ScriptComponent } from '../../components';
import type { EntityState } from '../../entities';
import type { ScriptPermissions } from '../permissions';
import { canAccessScriptType } from '../permissions';
import type { ScriptAPI, ScriptRefResolutionResult, ScriptsAPI } from './types';

function resolveScriptReference(
  entity: EntityState,
  scriptId: string,
): ScriptRefResolutionResult | null {
  const component = entity.components.get('script') as ScriptComponent | undefined;
  if (!component) return null;

  const index = component.scripts.findIndex((script) => script.scriptId === scriptId);
  if (index < 0) return null;

  return {
    script: component.scripts[index],
    index,
  };
}

function createScriptAPI(entity: EntityState, scriptId: string): ScriptAPI | undefined {
  const resolved = resolveScriptReference(entity, scriptId);
  if (!resolved) return undefined;

  return {
    get scriptId() {
      return resolved.script.scriptId;
    },

    get enabled() {
      return resolved.script.enabled;
    },
    set enabled(value: boolean) {
      resolved.script.enabled = value;
    },

    get properties() {
      return resolved.script.properties;
    },
    set properties(value: Record<string, unknown>) {
      resolved.script.properties = value;
    },
  };
}

export function buildScriptsAPI(entity: EntityState, permissions: ScriptPermissions): ScriptsAPI {
  return new Proxy(
    {},
    {
      get(_target, propertyKey) {
        if (typeof propertyKey !== 'string') return undefined;
        if (!canAccessScriptType(permissions, propertyKey)) return undefined;
        return createScriptAPI(entity, propertyKey);
      },

      has(_target, propertyKey) {
        if (typeof propertyKey !== 'string') return false;
        if (!canAccessScriptType(permissions, propertyKey)) return false;
        return resolveScriptReference(entity, propertyKey) !== null;
      },

      ownKeys() {
        const component = entity.components.get('script') as ScriptComponent | undefined;
        if (!component) return [];
        return component.scripts
          .map((script) => script.scriptId)
          .filter((scriptId) => canAccessScriptType(permissions, scriptId));
      },

      getOwnPropertyDescriptor(_target, propertyKey) {
        if (typeof propertyKey !== 'string') return undefined;
        if (!canAccessScriptType(permissions, propertyKey)) return undefined;
        if (resolveScriptReference(entity, propertyKey) === null) return undefined;
        return {
          enumerable: true,
          configurable: true,
        };
      },
    },
  ) as ScriptsAPI;
}
