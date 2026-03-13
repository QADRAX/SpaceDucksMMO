/**
 * Shared test utilities for scripting integration tests.
 */

import type { ScriptComponent, ScriptReference } from '@duckengine/core-v2';

/**
 * Extracts the full script component data from a snapshot result.
 * Use when you need to mutate scripts (e.g. setField).
 */
export function getScriptComponentData(
  snap: { ok: boolean; value?: unknown }
): ScriptComponent | null {
  if (!snap.ok || !snap.value) return null;
  return snap.value as ScriptComponent;
}

/**
 * Extracts script properties from a component snapshot result.
 * @param snap - Component snapshot from .snapshot()
 * @param indexOrScriptId - Optional: script index (0-based) or scriptId to find
 */
export function getScriptProperties(
  snap: { ok: boolean; value?: unknown },
  indexOrScriptId?: number | string
): Record<string, unknown> | null {
  const data = getScriptComponentData(snap);
  if (!data?.scripts?.length) return null;
  const scripts = data.scripts;
  if (indexOrScriptId === undefined) return scripts[0]?.properties ?? null;
  if (typeof indexOrScriptId === 'number') return scripts[indexOrScriptId]?.properties ?? null;
  const found = scripts.find((s: ScriptReference) => s.scriptId === indexOrScriptId);
  return found?.properties ?? null;
}
