import type { ResourceKind } from '@duckengine/core-v2';

import { MeshComponentDataSchema } from '../../../domain/validation/schemas';
import type { FileBindingRef, ProfileMetadata, ResourceUploadHandler, SlotFile, ValidationResult } from '../types';
import { coerceComponentDataStrict } from '../types';

/**
 * `mesh` resource: `geometry` + optional `thumbnail` per {@link MeshFileSlots} in core-v2.
 */
export class MeshResourceHandler implements ResourceUploadHandler {
  validateComponentData(_kind: ResourceKind, rawComponentData: unknown): ValidationResult<'mesh'> {
    const componentDataCoerced = coerceComponentDataStrict(rawComponentData);
    const parsed = MeshComponentDataSchema.safeParse(componentDataCoerced);
    if (!parsed.success) {
      throw new Error('Invalid componentData for mesh resource kind');
    }
    return {
      componentType: 'mesh',
      componentData: (parsed.data ?? {}) as Record<string, unknown>,
    };
  }

  validateProfile(_kind: ResourceKind, slotFiles: SlotFile[]): ProfileMetadata {
    const mesh = slotFiles.find((s) => s.slot.toLowerCase() === 'geometry');
    if (!mesh) {
      throw new Error("mesh requires a 'geometry' file binding");
    }
    return {};
  }

  processBindings(_kind: ResourceKind, _bindings: FileBindingRef[]): ProfileMetadata {
    return {};
  }
}
