import type {
  EntityId,
  UIViewMountParams,
  UIViewRuntimePort,
  UIViewUpdateParams,
  ViewportId,
} from '@duckengine/core-v2';

/** Recorded Duck UI runtime call for tests. */
export type RecordingUIViewCall =
  | { readonly op: 'mount'; readonly params: UIViewMountParams }
  | { readonly op: 'update'; readonly params: UIViewUpdateParams }
  | { readonly op: 'unmount'; readonly entityId: EntityId; readonly viewportId: ViewportId };

/**
 * Recording {@link UIViewRuntimePort} for unit/integration tests.
 */
export function createRecordingUIViewRuntime(): UIViewRuntimePort & {
  readonly calls: RecordingUIViewCall[];
} {
  const calls: RecordingUIViewCall[] = [];
  return {
    calls,
    mount(params) {
      calls.push({ op: 'mount', params });
    },
    update(params) {
      calls.push({ op: 'update', params });
    },
    unmount(entityId, viewportId) {
      calls.push({ op: 'unmount', entityId, viewportId });
    },
  };
}
