import type {
  EntityId,
  UISpaMountParams,
  UISpaRuntimePort,
  UISpaUpdateParams,
  ViewportId,
} from '@duckengine/core-v2';

/** Recorded SPA runtime call for tests. */
export type RecordingUISpaCall =
  | { readonly op: 'mount'; readonly params: UISpaMountParams }
  | { readonly op: 'update'; readonly params: UISpaUpdateParams }
  | { readonly op: 'unmount'; readonly entityId: EntityId; readonly viewportId: ViewportId };

/**
 * Recording {@link UISpaRuntimePort} for unit/integration tests.
 */
export function createRecordingUISpaRuntime(): UISpaRuntimePort & {
  readonly calls: RecordingUISpaCall[];
} {
  const calls: RecordingUISpaCall[] = [];
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
