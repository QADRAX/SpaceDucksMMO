export function buildInspectorValue(component: any, fields: any[]): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const f of fields) {
        const key = String(f?.key ?? '');
        if (!key) continue;

        let v: unknown;
        if (typeof f?.get === 'function') v = f.get(component);
        else v = component?.[key];

        if (v === undefined && f?.default !== undefined) v = f.default;
        out[key] = v;
    }
    return out;
}

export function diffInspectorValue(prev: Record<string, unknown>, next: Record<string, unknown>): Record<string, unknown> {
    const delta: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(next)) {
        if (!Object.is(prev[k], v)) delta[k] = v;
    }
    for (const k of Object.keys(prev)) {
        if (!(k in next)) delta[k] = undefined;
    }

    return delta;
}
