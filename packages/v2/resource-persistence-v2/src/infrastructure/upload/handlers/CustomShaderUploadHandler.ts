import type { CustomShaderResourceKind, ResourceKind } from '@duckengine/core-v2';

import type { FileBindingRef, ProfileMetadata, ResourceUploadHandler, SlotFile, ValidationResult } from '../types';
import { coerceComponentDataStrict } from '../types';

export class CustomShaderUploadHandler implements ResourceUploadHandler {
  validateComponentData(kind: ResourceKind, rawComponentData: unknown): ValidationResult<CustomShaderResourceKind> {
    const componentDataCoerced = coerceComponentDataStrict(rawComponentData);
    return {
      componentType: kind as CustomShaderResourceKind,
      componentData: componentDataCoerced,
    };
  }

  validateProfile(kind: ResourceKind, slotFiles: SlotFile[]): ProfileMetadata {
    const bySlot = new Map(slotFiles.map((s) => [s.slot.toLowerCase(), s]));
    const v = bySlot.get('vertexsource');
    const f = bySlot.get('fragmentsource');
    if (!v || !f) {
      throw new Error(`${kind} requires vertexSource and fragmentSource file bindings`);
    }
    for (const s of [v, f]) {
      const fn = s.fileName.toLowerCase();
      if (!fn.endsWith('.glsl') && !fn.endsWith('.wgsl') && !fn.endsWith('.tsl')) {
        throw new Error(`${kind} shader sources must be .glsl, .wgsl, or .tsl`);
      }
    }
    return {};
  }

  processBindings(_kind: ResourceKind, _bindings: FileBindingRef[]): ProfileMetadata {
    return {};
  }
}
