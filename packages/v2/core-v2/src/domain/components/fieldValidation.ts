import type { InspectorFieldConfig } from './types/core';
import type { Result } from '../utils';
import type { PrimitiveValidationRules } from '../properties';
import { ok, err } from '../utils';
import { validatePrimitiveValue } from '../properties';

function toPrimitiveRules(field: InspectorFieldConfig): PrimitiveValidationRules | null {
    switch (field.type) {
        case 'number':
            return {
                kind: 'number',
                required: true,
                nullable: field.nullable,
                min: field.min,
                max: field.max,
                step: field.step,
            };
        case 'boolean':
            return { kind: 'boolean', required: true, nullable: field.nullable };
        case 'string':
        case 'texture':
        case 'reference':
            return { kind: 'string', required: true, nullable: field.nullable };
        case 'color':
            return {
                kind: 'color',
                colorMode: 'string',
                required: true,
                nullable: field.nullable,
            };
        case 'enum':
            return {
                kind: 'enum',
                required: true,
                nullable: field.nullable,
                options: field.options.map((o) => o.value),
            };
        case 'vector':
        case 'object':
        case 'uniforms':
            return { kind: 'object', required: true, nullable: field.nullable };
        default:
            return null;
    }
}

/**
 * Validates a value against the constraints declared in an `InspectorFieldConfig`.
 *
 * Checks performed (in order):
 * 1. Nullability – rejects `null`/`undefined` unless `nullable` is true.
 * 2. Type check – ensures the JS type matches the inspector field type.
 * 3. Enum – for `'enum'` fields, ensures the value matches one of `options`.
 * 4. Range – for `'number'` fields, clamps to `min`/`max` if defined.
 *
 * Returns `ok(undefined)` when the value is valid, or `err(...)` with a
 * descriptive message when validation fails.
 */
export function validateFieldValue(
    field: InspectorFieldConfig,
    value: unknown,
): Result<void> {
    const fail = (message: string): Result<void> =>
        err('validation', `Field '${field.key}' ${message}`);

    const rules = toPrimitiveRules(field);
    if (!rules) {
        // Unknown/unspecified field type — allow pass-through for backward compatibility.
        return ok(undefined);
    }

    const result = validatePrimitiveValue(rules, value);
    return result.valid ? ok(undefined) : fail(result.error ?? 'is invalid.');
}
