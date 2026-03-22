import type { ResourceKind } from '@duckengine/core-v2';

import { EmptyStrictComponentDataSchema } from '../../../domain/validation/schemas';
import type { FileBindingRef, ProfileMetadata, ResourceUploadHandler, SlotFile, ValidationResult } from '../types';
import { coerceComponentDataStrict } from '../types';

/** Matches {@link SkyboxFileSlots} in core-v2 (five faces; no bottom face). */
const SKYBOX_FACE_SLOTS = ['px', 'nx', 'py', 'ny', 'pz'] as const;

export class SkyboxUploadHandler implements ResourceUploadHandler {
  validateComponentData(_kind: ResourceKind, rawComponentData: unknown): ValidationResult<'skybox'> {
    const parsed = EmptyStrictComponentDataSchema.safeParse(coerceComponentDataStrict(rawComponentData));
    if (!parsed.success) {
      throw new Error('Invalid componentData for skybox resource kind');
    }
    return {
      componentType: 'skybox',
      componentData: (parsed.data ?? {}) as Record<string, unknown>,
    };
  }

  validateProfile(_kind: ResourceKind, slotFiles: SlotFile[]): ProfileMetadata {
    const slots = slotFiles.map((s) => String(s.slot).toLowerCase());

    for (const r of SKYBOX_FACE_SLOTS) {
      if (!slots.includes(r)) {
        throw new Error(`skybox requires 5 cube face bindings: ${SKYBOX_FACE_SLOTS.join(', ')}`);
      }
    }

    if (slotFiles.length !== SKYBOX_FACE_SLOTS.length) {
      throw new Error(`skybox only supports ${SKYBOX_FACE_SLOTS.length} cube face bindings: ${SKYBOX_FACE_SLOTS.join(', ')}`);
    }

    return {};
  }

  processBindings(_kind: ResourceKind, _bindings: FileBindingRef[]): ProfileMetadata {
    return {};
  }
}
