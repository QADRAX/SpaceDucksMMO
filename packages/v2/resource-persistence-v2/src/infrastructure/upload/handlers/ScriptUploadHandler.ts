import type { ResourceKind } from '@duckengine/core-v2';

import { EmptyStrictComponentDataSchema } from '../../../domain/validation/schemas';
import type { FileBindingRef, ProfileMetadata, ResourceUploadHandler, SlotFile, ValidationResult } from '../types';
import { coerceComponentDataStrict } from '../types';

export class ScriptUploadHandler implements ResourceUploadHandler {
  validateComponentData(_kind: ResourceKind, rawComponentData: unknown): ValidationResult<'script'> {
    const parsed = EmptyStrictComponentDataSchema.safeParse(coerceComponentDataStrict(rawComponentData));
    if (!parsed.success) {
      throw new Error('Invalid componentData for script resource kind');
    }
    return {
      componentType: 'script',
      componentData: (parsed.data ?? {}) as Record<string, unknown>,
    };
  }

  validateProfile(_kind: ResourceKind, slotFiles: SlotFile[]): ProfileMetadata {
    const src = slotFiles.find((s) => s.slot.toLowerCase() === 'source');
    if (!src) {
      throw new Error("script requires a 'source' file binding");
    }
    return {};
  }

  processBindings(_kind: ResourceKind, _bindings: FileBindingRef[]): ProfileMetadata {
    return {};
  }
}
