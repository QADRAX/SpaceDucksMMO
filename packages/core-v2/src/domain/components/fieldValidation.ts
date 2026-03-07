import type { InspectorFieldConfig } from './types/core';
import type { Result } from '../utils';
import { ok, err } from '../utils';

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
    // 1. Nullability
    if (value === null || value === undefined) {
        if (field.nullable) return ok(undefined);
        return err('validation', `Field '${field.key}' does not accept null/undefined.`);
    }

    // 2. Type check per inspector field type
    switch (field.type) {
        case 'number': {
            if (typeof value !== 'number' || Number.isNaN(value)) {
                return err('validation', `Field '${field.key}' expects a number, got ${typeof value}.`);
            }
            if (field.min !== undefined && value < field.min) {
                return err(
                    'validation',
                    `Field '${field.key}' value ${value} is below minimum ${field.min}.`,
                );
            }
            if (field.max !== undefined && value > field.max) {
                return err(
                    'validation',
                    `Field '${field.key}' value ${value} exceeds maximum ${field.max}.`,
                );
            }
            break;
        }
        case 'boolean': {
            if (typeof value !== 'boolean') {
                return err('validation', `Field '${field.key}' expects a boolean, got ${typeof value}.`);
            }
            break;
        }
        case 'string':
        case 'color':
        case 'texture':
        case 'reference': {
            if (typeof value !== 'string') {
                return err('validation', `Field '${field.key}' expects a string, got ${typeof value}.`);
            }
            break;
        }
        case 'enum': {
            if (!field.options || !field.options.some((o) => o.value === value)) {
                const allowed = field.options?.map((o) => o.value).join(', ') ?? '(none)';
                return err(
                    'validation',
                    `Field '${field.key}' value '${String(value)}' is not in allowed options: [${allowed}].`,
                );
            }
            break;
        }
        case 'vector':
        case 'object':
        case 'uniforms': {
            if (typeof value !== 'object') {
                return err('validation', `Field '${field.key}' expects an object, got ${typeof value}.`);
            }
            break;
        }
        default:
            // Unknown field type — allow the value through
            break;
    }

    return ok(undefined);
}
