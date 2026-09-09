import type { ComponentBase } from '../core';
import type { ResourceRef } from '../../../resources';

/**
 * A node in a Duck UI document (view hierarchy under {@link UiViewComponent}).
 * Layout boxes and controls are nodes here — not ECS entities.
 */
export interface UiNode {
  /** Stable id for Lua paths / events. */
  readonly id?: string;
  /** Kit type id (e.g. `column`, `text`, `button`). */
  readonly type: string;
  /** Serializable node props. */
  readonly props?: Readonly<Record<string, unknown>>;
  /** Child nodes. */
  readonly children?: ReadonlyArray<UiNode>;
}

/**
 * Duck UI content component: document (inline tree or resource) + bindings.
 * Mutually exclusive with {@link UiSpaComponent} (phase 1).
 * Requires presence of `transform2d`.
 */
export interface UiViewComponent extends ComponentBase<'uiView', UiViewComponent> {
  /**
   * Inline view tree, or a reference to a `uiDocument` resource.
   * Exactly one representation should be used per instance at authoring time.
   */
  document: UiNode | ResourceRef<'uiDocument'> | null;
  /** Serializable bindings (scene + Lua writable). */
  bindings: Record<string, unknown>;
}
