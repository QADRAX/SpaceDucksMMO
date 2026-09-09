import type { ComponentBase } from '../core';
import type { ResourceRef } from '../../../resources';
import type { UiTarget } from '../../../ui/uiTarget';

/**
 * Custom SPA UI content: resource reference + per-instance props.
 * Parallel to {@link ScriptComponent} (asset + instance data).
 * Mutually exclusive with {@link UiViewComponent} (phase 1).
 * Requires presence of `transform2d`.
 */
export interface UiSpaComponent extends ComponentBase<'uiSpa', UiSpaComponent> {
  /** Reference to a `spa` resource. */
  spa: ResourceRef<'spa'> | null;
  /** Instance props from scene YAML / Lua (`UI.setProps`). */
  props: Record<string, unknown>;
  /** Viewport filter (§3.6). Empty = all enabled viewports of the scene. */
  uiTarget: UiTarget;
}
