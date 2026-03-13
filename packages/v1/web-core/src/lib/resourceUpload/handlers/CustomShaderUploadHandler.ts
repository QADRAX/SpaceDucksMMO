import { ResourceUploadHandler, ValidationResult, SlotFile, coerceComponentData } from '../types';

export class CustomShaderUploadHandler implements ResourceUploadHandler {
    validateComponentData(kind: string, rawComponentData: unknown): ValidationResult {
        const componentDataCoerced = coerceComponentData(rawComponentData);
        return {
            componentType: kind,
            componentData: componentDataCoerced,
        };
    }

    validateProfile(kind: string, slotFiles: SlotFile[]): Record<string, unknown> {
        if (slotFiles.length !== 1) {
            throw new Error(`${kind} requires exactly one file binding`);
        }

        const filename = slotFiles[0].fileName.toLowerCase();
        if (!filename.endsWith('.glsl') && !filename.endsWith('.wgsl') && !filename.endsWith('.tsl')) {
            throw new Error(`${kind} file must be .glsl, .wgsl, or .tsl`);
        }

        return {};
    }

    processBindings(kind: string, bindings: Array<{ slot: string; url: string }>): Record<string, unknown> {
        // Custom shaders usually don't map their URL directly into component data fields implicitly.
        // The binding itself is accessed via the activeVersion.bindings list when needed.
        return {};
    }
}
