import type { SceneState, ScriptSchema, EntityId } from '@duckengine/core-v2';
import type { BridgeDeclaration, BridgePorts, BridgeAPI, ScriptBridgeContext } from './types';
import type { ScriptingSessionState } from '../session';

/**
 * Composes a bridge context for a specific entity within a scene.
 *
 * Per-entity bridges receive the entity ID and produce a scoped API.
 * Global bridges ignore the entity ID (same API for all scripts).
 *
 * @param scene    - The scene the entity belongs to.
 * @param entityId  - The entity that owns the script slot.
 * @param schema   - The script's schema (null if not found).
 * @param bridges  - Ordered bridge declarations to install.
 * @param ports    - External ports bridges may optionally consume.
 * @param session  - Optional session for bridges that need to sync sibling state (e.g. Script.setProperty).
 * @returns Frozen record of bridge name → API object.
 */
export function createScriptBridgeContext(
  scene: SceneState,
  entityId: EntityId,
  schema: ScriptSchema | null,
  bridges: ReadonlyArray<BridgeDeclaration>,
  ports: BridgePorts,
  session?: ScriptingSessionState,
): ScriptBridgeContext {
  const ctx: Record<string, BridgeAPI> = {};

  for (const bridge of bridges) {
    ctx[bridge.name] = bridge.factory(scene, entityId, schema, ports, session);
  }

  return Object.freeze(ctx);
}
