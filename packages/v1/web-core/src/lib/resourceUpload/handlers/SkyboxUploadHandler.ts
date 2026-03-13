import { ResourceUploadHandler, ValidationResult, SlotFile, coerceComponentData } from '../types';

export class SkyboxUploadHandler implements ResourceUploadHandler {
    validateComponentData(kind: string, rawComponentData: unknown): ValidationResult {
        const componentDataCoerced = coerceComponentData(rawComponentData);
        return {
            componentType: 'skybox',
            componentData: componentDataCoerced,
        };
    }

    validateProfile(kind: string, slotFiles: SlotFile[]): Record<string, unknown> {
        const required = ['px', 'nx', 'py', 'ny', 'pz', 'nz'] as const;
        const slots = slotFiles.map((s) => String(s.slot).toLowerCase());

        for (const r of required) {
            if (!slots.includes(r)) {
                throw new Error("skybox requires 6 cube face bindings: px, nx, py, ny, pz, nz");
            }
        }

        if (slotFiles.length !== 6) {
            throw new Error("skybox only supports 6 cube face bindings: px, nx, py, ny, pz, nz");
        }

        return {};
    }

    processBindings(kind: string, bindings: Array<{ slot: string; url: string }>): Record<string, unknown> {
        // We don't inject bindings into componentData for skyboxes
        return {};
    }
}
