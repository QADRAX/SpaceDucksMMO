import type { ResourceKind } from '@duckengine/core-v2';

export type SlotFile = { slot: string; fileName: string; data: Buffer };

/**
 * Validated manifest `componentData` before persistence.
 * Stored JSON should align with `ResourceData<K>` in `@duckengine/core-v2` for `K = componentType`.
 */
export type ValidationResult<K extends ResourceKind = ResourceKind> = {
  readonly componentType: K;
  readonly componentData: Record<string, unknown>;
};

/** Extra metadata merged into `componentData` after `validateProfile` (e.g. extracted clip names). */
export type ProfileMetadata = Record<string, unknown>;

/** Slot → public URL path for `processBindings` (e.g. `/api/files/:id`). */
export type FileBindingRef = { readonly slot: string; readonly url: string };

export interface ResourceUploadHandler {
  validateComponentData(kind: ResourceKind, rawComponentData: unknown): ValidationResult;
  validateProfile(kind: ResourceKind, slotFiles: SlotFile[]): ProfileMetadata | Promise<ProfileMetadata>;
  processBindings(kind: ResourceKind, bindings: FileBindingRef[]): ProfileMetadata;
}
