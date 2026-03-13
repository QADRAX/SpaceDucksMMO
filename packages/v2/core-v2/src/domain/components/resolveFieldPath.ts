/**
 * Resolves a dot-notation path to get/set deeply nested values.
 *
 * Inspector field keys support paths like `halfExtents.x` or
 * `heightfield.size.z` which map to nested object properties.
 */

/**
 * Gets a value from `obj` at the given dot-notation `path`.
 * Returns `undefined` if any intermediate segment is missing.
 */
export function getFieldValue(obj: unknown, path: string): unknown {
    const segments = path.split('.');
    let current: unknown = obj;
    for (const segment of segments) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return undefined;
        }
        current = (current as Record<string, unknown>)[segment];
    }
    return current;
}

/**
 * Sets a value on `obj` at the given dot-notation `path`.
 * Creates intermediate objects if they do not exist.
 * Throws if a non-terminal segment is a primitive.
 */
export function setFieldValue(obj: unknown, path: string, value: unknown): void {
    const segments = path.split('.');
    let current: Record<string, unknown> = obj as Record<string, unknown>;

    for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];
        if (current[segment] === null || current[segment] === undefined) {
            current[segment] = {};
        }
        current = current[segment] as Record<string, unknown>;
    }

    current[segments[segments.length - 1]] = value;
}
