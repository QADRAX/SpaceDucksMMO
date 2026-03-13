import { ResourceUploadHandler, ValidationResult, SlotFile, coerceComponentData } from '../types';
import { CustomMeshComponentDataSchema } from '@/lib/types';
import { assertCustomMeshGlbProfile } from '@/lib/glb/validateCustomMeshGlb';
import { assertFullMeshGlbProfile } from '@/lib/glb/validateFullMeshGlb';

export class MeshUploadHandler implements ResourceUploadHandler {
    validateComponentData(kind: string, rawComponentData: unknown): ValidationResult {
        const componentDataCoerced = coerceComponentData(rawComponentData);

        // For customMesh we have structured validation
        if (kind === 'customMesh') {
            const parsed = CustomMeshComponentDataSchema.safeParse(componentDataCoerced);
            if (!parsed.success) {
                throw new Error('Invalid componentData for customMesh resource kind');
            }
            return {
                componentType: 'customMesh',
                componentData: parsed.data ?? {},
            };
        }

        // For fullMesh it is relatively free-form
        return {
            componentType: 'fullMesh',
            componentData: componentDataCoerced,
        };
    }

    validateProfile(kind: string, slotFiles: SlotFile[]): Record<string, unknown> {
        const mesh = slotFiles.find((s) => s.slot.toLowerCase() === 'mesh');
        if (!mesh) throw new Error(`${kind} requires a 'mesh' file binding`);
        if (!mesh.fileName.toLowerCase().endsWith('.glb')) {
            throw new Error(`${kind} 'mesh' file must be a .glb`);
        }

        const metadata: Record<string, unknown> = {};

        if (kind === 'customMesh') {
            if (slotFiles.length !== 1) {
                throw new Error("customMesh only supports a single file binding ('mesh')");
            }
            assertCustomMeshGlbProfile(mesh.data);
        } else if (kind === 'fullMesh') {
            const meta = assertFullMeshGlbProfile(mesh.data);
            if (meta && Array.isArray(meta.animations) && meta.animations.length) {
                metadata.animations = meta.animations.map((n) => ({ name: n }));
            }
        }

        return metadata;
    }

    processBindings(kind: string, bindings: Array<{ slot: string; url: string }>): Record<string, unknown> {
        const componentDataExtras: Record<string, unknown> = {};
        for (const b of bindings) {
            if (b.slot.toLowerCase() === 'mesh') {
                componentDataExtras.mesh = b.url;
            }
        }
        return componentDataExtras;
    }
}
