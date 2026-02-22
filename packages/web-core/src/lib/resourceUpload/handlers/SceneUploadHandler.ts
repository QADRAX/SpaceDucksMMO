import { ResourceUploadHandler, ValidationResult, SlotFile } from '../types';
import { createEmptyEcsTreeSnapshot, EcsTreeSnapshotSchema } from '@/lib/ecs-snapshot';

export class SceneUploadHandler implements ResourceUploadHandler {
    validateComponentData(kind: string, rawComponentData: unknown): ValidationResult {
        const input =
            rawComponentData === undefined || rawComponentData === null
                ? createEmptyEcsTreeSnapshot()
                : rawComponentData;

        const parsed = EcsTreeSnapshotSchema.safeParse(input);
        if (!parsed.success) {
            throw new Error(`Invalid componentData for ${kind} resource kind`);
        }

        return {
            componentType: kind,
            componentData: parsed.data as unknown as Record<string, unknown>,
        };
    }

    validateProfile(kind: string, slotFiles: SlotFile[]): Record<string, unknown> {
        // Scenes/Prefabs typically don't depend on slot files in the same way,
        // or they embed their references in the ECS snapshot.
        // We don't enforce a strict zip structural profile here.
        return {};
    }

    processBindings(kind: string, bindings: Array<{ slot: string; url: string }>): Record<string, unknown> {
        // No automatic binding injections for Scenes/Prefabs at this level.
        // The Snapshot itself usually contains the URLs or references.
        return {};
    }
}
