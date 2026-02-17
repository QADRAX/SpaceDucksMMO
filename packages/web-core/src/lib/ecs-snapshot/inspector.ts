import {
    type InspectorFieldConfig,
} from '@duckengine/ecs';

/**
 * Applies a dictionary of data to a component instance, using the component's inspector metadata.
 * It handles type coercion (e.g. string -> number) and validation based on field configuration (min/max).
 * 
 * @param comp The target component instance to modify.
 * @param data Theoretical partial data to apply (key-value pairs).
 */
export function applyComponentDataWithInspector(comp: any, data: Record<string, unknown>): void {
    const fields: InspectorFieldConfig<any, unknown>[] = comp?.metadata?.inspector?.fields ?? [];
    const byKey = new Map<string, InspectorFieldConfig<any, unknown>>();
    for (const f of fields) byKey.set(String(f.key), f);

    const coerceFiniteNumber = (raw: unknown): number | null => {
        if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            if (!trimmed.length) return null;
            const n = Number(trimmed);
            return Number.isFinite(n) ? n : null;
        }
        return null;
    };

    for (const [key, raw] of Object.entries(data)) {
        const cfg = byKey.get(key);
        if (cfg?.set) {
            try {
                // Avoid poisoning components with invalid numbers (e.g. null -> 0)
                // which can make validation fail and drop components on load.
                if ((cfg as any)?.type === 'number') {
                    if (raw === null || raw === undefined) {
                        if ((cfg as any)?.nullable) cfg.set(comp, undefined as any);
                        continue;
                    }

                    const n = coerceFiniteNumber(raw);
                    if (n === null) {
                        if ((cfg as any)?.nullable && (raw === '' || raw === undefined || raw === null)) {
                            cfg.set(comp, undefined as any);
                        }
                        continue;
                    }

                    let next = n;
                    const min = (cfg as any)?.min;
                    const max = (cfg as any)?.max;
                    if (typeof min === 'number' && Number.isFinite(min)) next = Math.max(min, next);
                    if (typeof max === 'number' && Number.isFinite(max)) next = Math.min(max, next);

                    cfg.set(comp, next as any);
                    continue;
                }

                cfg.set(comp, raw);
                continue;
            } catch {
                // fallthrough to direct assignment
            }
        }

        try {
            (comp as any)[key] = raw;
        } catch {
            // ignore
        }
    }

    // Ensure change notification for UI systems.
    try {
        comp?.notifyChanged?.();
    } catch {
        // ignore
    }
}
