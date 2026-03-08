import type { PropertySchema, PropertyValue, ScriptSchema } from './types';
import type {
  ScriptRefProperty,
  ComponentRefProperty,
} from './propertyTypes';
import type { PrimitiveValidationRules } from '../../properties';
import { validatePrimitiveValue } from '../../properties';

function isMissingValue(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

function validateRequired(schema: PropertySchema, value: PropertyValue): { valid: boolean; error?: string } {
  if (schema.required && isMissingValue(value)) {
    return { valid: false, error: 'Property is required but value is null or undefined' };
  }
  return { valid: true };
}

function toPrimitiveRules(schema: PropertySchema): PrimitiveValidationRules | null {
  switch (schema.type) {
    case 'number':
      return { kind: 'number', min: schema.min, max: schema.max, step: schema.step, required: schema.required };
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

function isNumberTuple(value: unknown, size: number): boolean {
  return Array.isArray(value) && value.length === size && value.every((v) => typeof v === 'number');
}

/**
 * Validates a property value against its schema.
 */
export function validatePropertyValue(
  schema: PropertySchema,
  value: PropertyValue
): { valid: boolean; error?: string } {
  const requiredCheck = validateRequired(schema, value);
  if (!requiredCheck.valid) return requiredCheck;

  // Allow null/undefined for non-required properties
  if (isMissingValue(value)) {
    return { valid: true };
  }

  const primitiveRules = toPrimitiveRules(schema);
  if (primitiveRules) {
    return validatePrimitiveValue(primitiveRules, value);
  }

  switch (schema.type) {
    case 'entityRef': {
      if (typeof value !== 'string' && value !== null) {
        return { valid: false, error: 'Expected entity ID string or null' };
      }
      return { valid: true };
    }

    case 'entityRefArray': {
      if (!Array.isArray(value)) {
        return { valid: false, error: 'Expected array of entity IDs' };
      }
      if (!value.every((v) => typeof v === 'string')) {
        return { valid: false, error: 'All entity IDs must be strings' };
      }
      return { valid: true };
    }

    case 'prefabRef': {
      if (typeof value !== 'string' && value !== null) {
        return { valid: false, error: 'Expected prefab ID string or null' };
      }
      return { valid: true };
    }

    case 'scriptRef':
    case 'componentRef': {
      // Script refs and component refs are validated at schema level, not value level  
      return { valid: true };
    }

    default:
      return { valid: false, error: `Unsupported property type: ${(schema as { type: string }).type}` };
  }
}

/**
 * Validates an entire property values object against a script schema.
 */
export function validatePropertyValues(
  schema: ScriptSchema,
  values: Record<string, PropertyValue>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate each property defined in the schema
  for (const [key, propSchema] of Object.entries(schema.properties)) {
    const value = values[key];
    const result = validatePropertyValue(propSchema, value);

    if (!result.valid && result.error) {
      errors[key] = result.error;
    }
  }

  // Check for unexpected properties
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

/**
 * Validates a script schema definition.
 */
export function validateScriptSchema(schema: ScriptSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate name
  if (!schema.name || typeof schema.name !== 'string' || schema.name.trim().length === 0) {
    errors.push('Script schema must have a non-empty name');
  }

  // Validate properties
  if (!schema.properties || typeof schema.properties !== 'object') {
    errors.push('Script schema must have a properties object');
  } else {
    // Validate each property schema
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (!propSchema || typeof propSchema !== 'object') {
        errors.push(`Property "${key}" has invalid schema`);
        continue;
      }

      if (!propSchema.type) {
        errors.push(`Property "${key}" must have a type`);
      }

      // Validate script ref has scriptType
      if (propSchema.type === 'scriptRef' && !(propSchema as ScriptRefProperty).scriptType) {
        errors.push(`ScriptRef property "${key}" must specify scriptType`);
      }

      // Validate component ref has componentTypes
      if (propSchema.type === 'componentRef' && (!(propSchema as ComponentRefProperty).componentTypes || (propSchema as ComponentRefProperty).componentTypes.length === 0)) {
        errors.push(`ComponentRef property "${key}" must specify at least one componentType`);
      }

      // Validate enum has options
      if (propSchema.type === 'enum' && (!propSchema.options || propSchema.options.length === 0)) {
        errors.push(`Enum property "${key}" must have at least one option`);
      }

      if (propSchema.type === 'enum' && propSchema.default !== undefined && !propSchema.options.includes(propSchema.default)) {
        errors.push(`Enum property "${key}" has default value not present in options`);
      }

      if (propSchema.type === 'number') {
        if (propSchema.min !== undefined && propSchema.max !== undefined && propSchema.min > propSchema.max) {
          errors.push(`Number property "${key}" has min greater than max`);
        }
        if (propSchema.step !== undefined && propSchema.step <= 0) {
          errors.push(`Number property "${key}" must have step > 0`);
        }
        if (propSchema.default !== undefined) {
          if (typeof propSchema.default !== 'number') {
            errors.push(`Number property "${key}" default must be a number`);
          } else {
            if (propSchema.min !== undefined && propSchema.default < propSchema.min) {
              errors.push(`Number property "${key}" default is below min`);
            }
            if (propSchema.max !== undefined && propSchema.default > propSchema.max) {
              errors.push(`Number property "${key}" default is above max`);
            }
          }
        }
      }

      if (propSchema.type === 'vec2' && propSchema.default !== undefined && !isNumberTuple(propSchema.default, 2)) {
        errors.push(`Vec2 property "${key}" default must be [number, number]`);
      }

      if (propSchema.type === 'vec3' && propSchema.default !== undefined && !isNumberTuple(propSchema.default, 3)) {
        errors.push(`Vec3 property "${key}" default must be [number, number, number]`);
      }

      if (propSchema.type === 'color' && propSchema.default !== undefined) {
        if (!isNumberTuple(propSchema.default, 4)) {
          errors.push(`Color property "${key}" default must be [r,g,b,a]`);
        } else if (!propSchema.default.every((c) => c >= 0 && c <= 1)) {
          errors.push(`Color property "${key}" default values must be in [0,1]`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Type guard to check if a value is a valid PropertyValue.
 */
export function isPropertyValue(value: unknown): value is PropertyValue {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
    return true;
  }

  if (Array.isArray(value)) {
    // Check for vec2, vec3, color, or entityRefArray
    if (value.length === 2 || value.length === 3 || value.length === 4) {
      return value.every((v) => typeof v === 'number');
    }
    // Entity ref array
    return value.every((v) => typeof v === 'string');
  }

  return false;
}

/**
 * Gets the default value for a property schema.
 */
export function getDefaultPropertyValue(schema: PropertySchema): PropertyValue {
  if ('default' in schema && schema.default !== undefined) {
    return schema.default as PropertyValue;
  }

  // Return type-specific defaults
  switch (schema.type) {
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'string':
      return '';
    case 'vec2':
      return [0, 0];
    case 'vec3':
      return [0, 0, 0];
    case 'color':
      return [1, 1, 1, 1];
    case 'entityRef':
      return null;
    case 'entityRefArray':
      return [];
    case 'prefabRef':
      return null;
    case 'enum':
      return schema.options[0] || '';
    case 'scriptRef':
    case 'componentRef':
      return null;
  }
}

/**
 * Creates a complete property values object from a schema, using defaults.
 */
export function createDefaultPropertyValues(schema: ScriptSchema): Record<string, PropertyValue> {
  const values: Record<string, PropertyValue> = {};

  for (const [key, propSchema] of Object.entries(schema.properties)) {
    values[key] = getDefaultPropertyValue(propSchema);
  }

  return values;
}
