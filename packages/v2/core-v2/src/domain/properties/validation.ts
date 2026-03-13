import type { PrimitiveValidationResult, PrimitiveValidationRules } from './types';

function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

function isNumericTuple(value: unknown, size: number): boolean {
  return Array.isArray(value) && value.length === size && value.every((v) => typeof v === 'number');
}

function isRgbaTuple(value: unknown): boolean {
  return (
    isNumericTuple(value, 4)
    && (value as readonly number[]).every((v) => v >= 0 && v <= 1)
  );
}

function validateRuleConsistency(rules: PrimitiveValidationRules): PrimitiveValidationResult {
  if (rules.kind === 'number') {
    if (rules.min !== undefined && rules.max !== undefined && rules.min > rules.max) {
      return { valid: false, error: `Invalid numeric rules: min (${rules.min}) cannot be greater than max (${rules.max})` };
    }
    if (rules.step !== undefined && rules.step <= 0) {
      return { valid: false, error: `Invalid numeric rules: step (${rules.step}) must be greater than 0` };
    }
  }

  if (rules.kind === 'enum') {
    if (!rules.options || rules.options.length === 0) {
      return { valid: false, error: 'Enum rules must define at least one option' };
    }
  }

  return { valid: true };
}

/**
 * Shared primitive validator used by multiple domains (components, scripting, etc.).
 */
export function validatePrimitiveValue(
  rules: PrimitiveValidationRules,
  value: unknown
): PrimitiveValidationResult {
  const rulesCheck = validateRuleConsistency(rules);
  if (!rulesCheck.valid) {
    return rulesCheck;
  }

  const allowNull = rules.nullable === true || rules.required !== true;

  if (isNullish(value)) {
    if (allowNull) {
      return { valid: true };
    }
    return { valid: false, error: 'Value is required but is null or undefined' };
  }

  switch (rules.kind) {
    case 'number': {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        return { valid: false, error: `Expected number, got ${typeof value}` };
      }
      if (rules.min !== undefined && value < rules.min) {
        return { valid: false, error: `Value ${value} is below minimum ${rules.min}` };
      }
      if (rules.max !== undefined && value > rules.max) {
        return { valid: false, error: `Value ${value} is above maximum ${rules.max}` };
      }
      return { valid: true };
    }

    case 'boolean': {
      if (typeof value !== 'boolean') {
        return { valid: false, error: `Expected boolean, got ${typeof value}` };
      }
      return { valid: true };
    }

    case 'string': {
      if (typeof value !== 'string') {
        return { valid: false, error: `Expected string, got ${typeof value}` };
      }
      return { valid: true };
    }

    case 'enum': {
      if (typeof value !== 'string' && typeof value !== 'number') {
        return { valid: false, error: `Expected string or number for enum, got ${typeof value}` };
      }
      const options = rules.options;
      if (!options) {
        return { valid: false, error: 'Enum rules must define at least one option' };
      }
      if (!options.includes(value)) {
        return { valid: false, error: `Value '${String(value)}' is not in allowed options: ${options.join(', ')}` };
      }
      return { valid: true };
    }

    case 'color': {
      if (rules.colorMode === 'rgba') {
        if (!isRgbaTuple(value)) {
          return { valid: false, error: 'Expected RGBA tuple [r,g,b,a] with values in range [0,1]' };
        }
        return { valid: true };
      }
      if (typeof value !== 'string') {
        return { valid: false, error: `Expected color string, got ${typeof value}` };
      }
      return { valid: true };
    }

    case 'vec2': {
      if (!isNumericTuple(value, 2)) {
        return { valid: false, error: 'Expected array of 2 numbers' };
      }
      return { valid: true };
    }

    case 'vec3': {
      if (!isNumericTuple(value, 3)) {
        return { valid: false, error: 'Expected array of 3 numbers' };
      }
      return { valid: true };
    }

    case 'vec4': {
      if (!isNumericTuple(value, 4)) {
        return { valid: false, error: 'Expected array of 4 numbers' };
      }
      return { valid: true };
    }

    case 'object': {
      if (typeof value !== 'object' || value === null) {
        return { valid: false, error: `Expected object, got ${typeof value}` };
      }
      return { valid: true };
    }
  }
}
