import type { ComponentRefProperty, ScriptRefProperty } from '../propertyTypes';
import type { ScriptSchema } from '../types';
import { isNumberTuple } from './common';

/** Validates schema declaration integrity for a script schema. */
export function validateScriptSchema(schema: ScriptSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema.name || typeof schema.name !== 'string' || schema.name.trim().length === 0) {
    errors.push('Script schema must have a non-empty name');
  }

  if (!schema.properties || typeof schema.properties !== 'object') {
    errors.push('Script schema must have a properties object');
  } else {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (!propSchema || typeof propSchema !== 'object') {
        errors.push(`Property "${key}" has invalid schema`);
        continue;
      }

      if (!propSchema.type) {
        errors.push(`Property "${key}" must have a type`);
      }

      if (propSchema.type === 'scriptRef' && !(propSchema as ScriptRefProperty).scriptType) {
        errors.push(`ScriptRef property "${key}" must specify scriptType`);
      }

      if (
        propSchema.type === 'componentRef' &&
        (!(propSchema as ComponentRefProperty).componentTypes ||
          (propSchema as ComponentRefProperty).componentTypes.length === 0)
      ) {
        errors.push(`ComponentRef property "${key}" must specify at least one componentType`);
      }

      if (propSchema.type === 'enum' && (!propSchema.options || propSchema.options.length === 0)) {
        errors.push(`Enum property "${key}" must have at least one option`);
      }

      if (
        propSchema.type === 'enum' &&
        propSchema.default !== undefined &&
        !propSchema.options.includes(propSchema.default)
      ) {
        errors.push(`Enum property "${key}" has default value not present in options`);
      }

      if (propSchema.type === 'number') {
        if (
          propSchema.min !== undefined &&
          propSchema.max !== undefined &&
          propSchema.min > propSchema.max
        ) {
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

      if (
        propSchema.type === 'vec2' &&
        propSchema.default !== undefined &&
        !isNumberTuple(propSchema.default, 2)
      ) {
        errors.push(`Vec2 property "${key}" default must be [number, number]`);
      }

      if (
        propSchema.type === 'vec3' &&
        propSchema.default !== undefined &&
        !isNumberTuple(propSchema.default, 3)
      ) {
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
