import type { PropertySchema, PropertyValue, ScriptSchema } from '../types';

/** Type guard to check if an unknown value is a valid property value payload. */
export function isPropertyValue(value: unknown): value is PropertyValue {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
    return true;
  }

  if (Array.isArray(value)) {
    if (value.length === 2 || value.length === 3 || value.length === 4) {
      return value.every((v) => typeof v === 'number');
    }
    return value.every((v) => typeof v === 'string');
  }

  return false;
}

/** Returns the default runtime value for a given property schema. */
export function getDefaultPropertyValue(schema: PropertySchema): PropertyValue {
  if ('default' in schema && schema.default !== undefined) {
    return schema.default as PropertyValue;
  }

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
    case 'entityComponentRef':
      return null;
    case 'entityRefArray':
    case 'entityComponentRefArray':
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

/** Creates default property values object for all properties in a script schema. */
export function createDefaultPropertyValues(schema: ScriptSchema): Record<string, PropertyValue> {
  const values: Record<string, PropertyValue> = {};

  for (const [key, propSchema] of Object.entries(schema.properties)) {
    values[key] = getDefaultPropertyValue(propSchema);
  }

  return values;
}
