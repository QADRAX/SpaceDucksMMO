import { TEXTURE_SLOT_KEYS, type ResourceKind } from '@duckengine/core-v2';

import { MaterialComponentSchema, MaterialComponentTypeSchema } from '../../../domain/validation/schemas';
import type { FileBindingRef, ProfileMetadata, ResourceUploadHandler, SlotFile, ValidationResult } from '../types';
import { coerceComponentDataStrict } from '../types';

export class MaterialUploadHandler implements ResourceUploadHandler {
  validateComponentData(kind: ResourceKind, rawComponentData: unknown): ValidationResult {
    const materialKind = MaterialComponentTypeSchema.parse(kind);
    const componentDataCoerced = coerceComponentDataStrict(rawComponentData);

    const parsed = MaterialComponentSchema.safeParse({
      componentType: materialKind,
      componentData: componentDataCoerced,
    });

    if (!parsed.success) {
      throw new Error('Invalid componentData for material resource kind');
    }

    return {
      componentType: parsed.data.componentType,
      componentData: parsed.data.componentData ?? {},
    };
  }

  async validateProfile(_kind: ResourceKind, _slotFiles: SlotFile[]): Promise<ProfileMetadata> {
    return {};
  }

  processBindings(_kind: ResourceKind, bindings: FileBindingRef[]): ProfileMetadata {
    const componentDataExtras: Record<string, unknown> = {};
    const supportedTextureFields = new Set<string>(TEXTURE_SLOT_KEYS);

    for (const b of bindings) {
      if (!supportedTextureFields.has(b.slot)) continue;
      if (b.slot === 'albedo') {
        componentDataExtras.texture = b.url;
      } else {
        componentDataExtras[b.slot] = b.url;
      }
    }
    return componentDataExtras;
  }
}
