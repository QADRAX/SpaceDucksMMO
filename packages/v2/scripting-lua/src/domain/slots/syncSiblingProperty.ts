import type { EntityId, PropertyValue } from '@duckengine/core-v2';
import type { ScriptSlotState } from './types';
import type { ScriptSandbox } from '../ports';
import { slotKey } from './slots';
import type { NormalizedPropertyValue } from '../properties';

/**
 * Syncs a property value to a sibling script's slot so it sees the change in the same frame.
 * Used when one script (e.g. WaypointPath) drives another (e.g. MoveToPoint) via setProperty.
 *
 * @param slots - Slot registry.
 * @param sandbox - Sandbox to push properties and call onPropertyChanged.
 * @param entityId - Entity owning the sibling script.
 * @param scriptId - Sibling script identifier.
 * @param key - Property key.
 * @param value - Normalized value (e.g. from normalizeVec3Like).
 */
export function syncSiblingPropertyToSlot(
  slots: Map<string, ScriptSlotState>,
  sandbox: ScriptSandbox,
  entityId: EntityId,
  scriptId: string,
  key: string,
  value: NormalizedPropertyValue,
): void {
  const siblingKey = slotKey(entityId, scriptId);
  const slot = slots.get(siblingKey);
  if (!slot) return;

  // Cast: slot.properties expects PropertyValue; NormalizedPropertyValue includes Vec3Like
  // which the runtime accepts but core-v2's PropertyValue type does not.
  slot.properties[key] = value as PropertyValue;
  sandbox.syncProperties(siblingKey, slot.properties);
  sandbox.callHook(siblingKey, 'onPropertyChanged', 0, key, value);
}
