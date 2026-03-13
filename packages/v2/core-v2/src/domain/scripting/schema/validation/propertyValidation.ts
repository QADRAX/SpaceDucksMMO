import type { PrimitiveValidationRules } from '../../../properties';
import { validatePrimitiveValue } from '../../../properties';
import type { PropertySchema, PropertyValue, ScriptSchema } from '../types';
import { isMissingValue } from './common';

function validateRequired(
  schema: PropertySchema,
  value: PropertyValue,
): { valid: boolean; error?: string } {
  if (schema.required && isMissingValue(value)) {
    return { valid: false, error: 'Property is required but value is null or undefined' };
  }
  return { valid: true };
}

function toPrimitiveRules(schema: PropertySchema): PrimitiveValidationRules | null {
  switch (schema.type) {
    case 'number':
      return {
        kind: 'number',
        min: schema.min,
        max: schema.max,
        step: schema.step,
        required: schema.required,
      };
    case 'boolean':
      return { kind: 'boolean', required: schema.required };
    case 'string':
      return { kind: 'string', required: schema.required };
    case 'vec2':
      return { kind: 'vec2', required: schema.required };
    case 'vec3':
      return { kind: 'vec3', required: schema.required };
    case 'color':
      return { kind: 'color', colorMode: 'rgba', required: schema.required };
    case 'enum':
      return { kind: 'enum', options: schema.options, required: schema.required };
    default:
      return null;
  }
}

/** Validates a property value against its schema definition. */
export function validatePropertyValue(
  schema: PropertySchema,
  value: PropertyValue,
): { valid: boolean; error?: string } {
  const requiredCheck = validateRequired(schema, value);
  if (!requiredCheck.valid) return requiredCheck;

  if (isMissingValue(value)) {
    return { valid: true };
  }

  const primitiveRules = toPrimitiveRules(schema);
  if (primitiveRules) {
    return validatePrimitiveValue(primitiveRules, value);
  }

  switch (schema.type) {
    case 'entityRef':
    case 'entityComponentRef':
      return typeof value === 'string' || value === null
        ? { valid: true }
        : { valid: false, error: 'Expected entity ID string or null' };

    case 'entityRefArray':
    case 'entityComponentRefArray':
      if (!Array.isArray(value)) {
        return { valid: false, error: 'Expected array of entity IDs' };
      }
      if (!value.every((v) => typeof v === 'string')) {
        return { valid: false, error: 'All entity IDs must be strings' };
      }
      return { valid: true };

    case 'prefabRef':
      return typeof value === 'string' || value === null
        ? { valid: true }
        : { valid: false, error: 'Expected prefab ID string or null' };

    case 'scriptRef':
    case 'componentRef':
      return { valid: true };

    default:
      return {
        valid: false,
        error: `Unsupported property type: ${(schema as { type: string }).type}`,
      };
  }
}

/** Validates a full property bag against a script schema. */
export function validatePropertyValues(
  schema: ScriptSchema,
  values: Record<string, PropertyValue>,
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const [key, propSchema] of Object.entries(schema.properties)) {
    const result = validatePropertyValue(propSchema, values[key]);
    if (!result.valid && result.error) {
      errors[key] = result.error;
    }
  }

  for (const key of Object.keys(values)) {
    if (!(key in schema.properties)) {
      errors[key] = 'Property not defined in schema';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
