export type SlotFile = { slot: string; fileName: string; data: Buffer };

export interface ValidationResult {
    componentType: string;
    componentData: Record<string, unknown>;
}

export interface ResourceUploadHandler {
    /**
     * Validates and coerces manifest componentData.
     * Modifies componentData and sets the specific componentType (e.g. standardMaterial).
     */
    validateComponentData(kind: string, rawComponentData: unknown): ValidationResult;

    /**
     * Validates file contents / structure (e.g. required slots, GLB validation).
     * Returns additional metadata to merge into componentData (e.g. extracted animations).
     * Throws an error if the files are invalid for this resource kind.
     */
    validateProfile(kind: string, slotFiles: SlotFile[]): Record<string, unknown> | Promise<Record<string, unknown>>;

    /**
     * Context available after files are saved to map their URLs into componentData fields.
     */
    processBindings(kind: string, bindings: Array<{ slot: string, url: string }>): Record<string, unknown>;
}

/**
 * Utility to safely coerce componentData.
 */
export function coerceComponentData(raw: unknown): Record<string, unknown> {
    if (raw === undefined || raw === null) return {};
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
    throw new Error('componentData must be an object (or omitted)');
}
