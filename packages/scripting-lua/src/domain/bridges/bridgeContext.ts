import type { SceneState } from '@duckengine/core-v2';
import type { BridgeDeclaration, BridgePorts, ScriptBridgeContext } from './types';

/**
 * Composes a bridge context for a specific entity within a scene.
 *
 * Per-entity bridges receive the entity ID and produce a scoped API.
 * Global bridges ignore the entity ID (same API for all scripts).
 *
 * @param scene    - The scene the entity belongs to.
 * @param entityId - The entity that owns the script slot.
 * @param bridges  - Ordered bridge declarations to install.
 * @param ports    - External ports bridges may optionally consume.
 * @returns Frozen record of bridge name → API object.
 */
export function createScriptBridgeContext(
  scene: SceneState,
  entityId: string,
  bridges: ReadonlyArray<BridgeDeclaration>,
  ports: BridgePorts,
): ScriptBridgeContext {
  const ctx: Record<string, Record<string, unknown>> = {};

  for (const bridge of bridges) {
    ctx[bridge.name] = bridge.factory(scene, entityId, ports);
  }

  return Object.freeze(ctx);
}
