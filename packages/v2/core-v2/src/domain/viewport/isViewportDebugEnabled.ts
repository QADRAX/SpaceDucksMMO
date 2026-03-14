import type { ViewportState, ViewportView } from './types';
import type { DebugKind } from '../entities';

/**
 * Returns whether a debug visualization kind is enabled for the viewport.
 * Defaults to false when not explicitly set.
 */
export function isViewportDebugEnabled(
  viewport: ViewportState | ViewportView,
  kind: DebugKind
): boolean {
  return viewport.debugFlags.get(kind) ?? false;
}
