import type { ComponentBase } from '../core';
import type { ResourceRef } from '../../../resources';
import type { UiTarget } from '../../../ui/uiTarget';

/**
 * Custom UI content: resource reference + per-instance props map.
 * Parallel to {@link ScriptComponent} (asset + instance data).
 * Mutually exclusive with {@link UiViewComponent} (phase 1).
 * Requires presence of `transform2d`.
 */
export interface UiCustomComponent extends ComponentBase<'uiCustom', UiCustomComponent> {
  /** Reference to a `spa` resource (custom UI entry module). */
  spa: ResourceRef<'spa'> | null;
  /** Generic instance props (YAML + Lua `UI.setProps`) injected into the custom UI. */
  props: Record<string, unknown>;
  /** Viewport filter (§3.6). Empty = all enabled viewports of the scene. */
  uiTarget: UiTarget;
}
