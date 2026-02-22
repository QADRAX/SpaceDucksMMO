import { ResourceUploadHandler, ValidationResult, SlotFile, coerceComponentData } from '../types';
import { MaterialComponentSchema, MaterialComponentTypeSchema } from '@/lib/types';

export class MaterialUploadHandler implements ResourceUploadHandler {
    validateComponentData(kind: string, rawComponentData: unknown): ValidationResult {
        const materialKind = MaterialComponentTypeSchema.parse(kind);
        const componentDataCoerced = coerceComponentData(rawComponentData);

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

    validateProfile(kind: string, slotFiles: SlotFile[]): Record<string, unknown> {
        // Materials don't have strict structural profile requirements for the zip contents
        return {};
    }

    processBindings(kind: string, bindings: Array<{ slot: string; url: string }>): Record<string, unknown> {
        const componentDataExtras: Record<string, unknown> = {};
        const supportedTextureFields = new Set([
            'texture',
            'normalMap',
            'envMap',
            'aoMap',
            'roughnessMap',
            'metalnessMap',
            'specularMap',
            'bumpMap',
            'baseColor',
            'albedo',
        ]);

        for (const b of bindings) {
            if (supportedTextureFields.has(b.slot)) {
                if (b.slot === 'baseColor' || b.slot === 'albedo') {
                    componentDataExtras.texture = b.url;
                } else {
                    componentDataExtras[b.slot] = b.url;
                }
            }
        }
        return componentDataExtras;
    }
}
