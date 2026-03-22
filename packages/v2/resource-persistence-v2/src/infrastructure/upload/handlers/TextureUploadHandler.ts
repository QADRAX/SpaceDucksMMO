import type { ResourceKind } from '@duckengine/core-v2';

import { EmptyStrictComponentDataSchema } from '../../../domain/validation/schemas';
import type { FileBindingRef, ProfileMetadata, ResourceUploadHandler, SlotFile, ValidationResult } from '../types';
import { coerceComponentDataStrict } from '../types';

export class TextureUploadHandler implements ResourceUploadHandler {
  validateComponentData(_kind: ResourceKind, rawComponentData: unknown): ValidationResult<'texture'> {
    const parsed = EmptyStrictComponentDataSchema.safeParse(coerceComponentDataStrict(rawComponentData));
    if (!parsed.success) {
      throw new Error('Invalid componentData for texture resource kind');
    }
    return {
      componentType: 'texture',
      componentData: (parsed.data ?? {}) as Record<string, unknown>,
    };
  }

  validateProfile(_kind: ResourceKind, slotFiles: SlotFile[]): ProfileMetadata {
    const img = slotFiles.find((s) => s.slot.toLowerCase() === 'image');
    if (!img) {
      throw new Error("texture requires an 'image' file binding");
    }
    return {};
  }

  processBindings(_kind: ResourceKind, _bindings: FileBindingRef[]): ProfileMetadata {
    return {};
  }
}
