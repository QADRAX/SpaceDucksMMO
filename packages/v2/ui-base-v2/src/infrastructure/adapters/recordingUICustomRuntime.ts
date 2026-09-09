import type {
  EntityId,
  UICustomMountParams,
  UICustomRuntimePort,
  UICustomUpdateParams,
  ViewportId,
} from '@duckengine/core-v2';

/** Recorded custom UI runtime call for tests. */
export type RecordingUICustomCall =
  | { readonly op: 'mount'; readonly params: UICustomMountParams }
  | { readonly op: 'update'; readonly params: UICustomUpdateParams }
  | { readonly op: 'unmount'; readonly entityId: EntityId; readonly viewportId: ViewportId };

/**
 * Recording {@link UICustomRuntimePort} for unit/integration tests.
 */
export function createRecordingUICustomRuntime(): UICustomRuntimePort & {
  readonly calls: RecordingUICustomCall[];
} {
  const calls: RecordingUICustomCall[] = [];
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
