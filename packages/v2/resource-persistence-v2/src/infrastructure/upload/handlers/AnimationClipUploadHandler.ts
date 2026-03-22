import type { ResourceKind } from '@duckengine/core-v2';

import { AnimationClipComponentDataSchema } from '../../../domain/validation/schemas';
import type { FileBindingRef, ProfileMetadata, ResourceUploadHandler, SlotFile, ValidationResult } from '../types';
import { coerceComponentDataStrict } from '../types';

export class AnimationClipUploadHandler implements ResourceUploadHandler {
  validateComponentData(_kind: ResourceKind, rawComponentData: unknown): ValidationResult<'animationClip'> {
    const componentDataCoerced = coerceComponentDataStrict(rawComponentData);
    const parsed = AnimationClipComponentDataSchema.safeParse(componentDataCoerced);
    if (!parsed.success) {
      throw new Error('Invalid componentData for animationClip resource kind');
    }
    return {
      componentType: 'animationClip',
      componentData: (parsed.data ?? {}) as Record<string, unknown>,
    };
  }

  validateProfile(_kind: ResourceKind, slotFiles: SlotFile[]): ProfileMetadata {
    const clip = slotFiles.find((s) => s.slot.toLowerCase() === 'clip');
    if (!clip) {
      throw new Error("animationClip requires a 'clip' file binding");
    }
    return {};
  }

  processBindings(_kind: ResourceKind, _bindings: FileBindingRef[]): ProfileMetadata {
    return {};
  }
}
