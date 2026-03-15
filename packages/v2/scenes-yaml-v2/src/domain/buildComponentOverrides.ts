/**
 * Domain: build component overrides from YAML definition.
 * Pure transformation logic. Solo core-v2.
 */
import { getComponentMetadata } from '@duckengine/core-v2';
import type { CreatableComponentType } from '@duckengine/core-v2';
import {
  resolveShorthandToResourceRef,
  resolveScriptShorthand,
} from './resourceResolver';

function isResourceFieldType(type: string | undefined): boolean {
  return type === 'texture' || type === 'resource' || type === 'reference';
}

function resolveOverrideValue(
  componentType: CreatableComponentType,
  fieldKey: string,
  value: unknown,
): unknown {
  if (typeof value !== 'string') return value;

  const meta = getComponentMetadata(componentType);
  const field = meta.inspector?.fields?.find((f) => (f as { key: string }).key === fieldKey) as
    | { type?: string; key: string }
    | undefined;
  if (!field || !isResourceFieldType(field.type)) return value;

  const resolved = resolveShorthandToResourceRef(componentType as any, value);
  if (resolved) return resolved.value;

  return value;
}

/**
 * Builds component create overrides from YAML value (shorthand string or override object).
 */
export function buildComponentOverrides(
  componentType: CreatableComponentType,
  value: string | Record<string, unknown>,
): Record<string, unknown> {
  if (typeof value === 'string') {
    if (componentType === 'script') {
      const ref = resolveScriptShorthand(value);
      return { scripts: [ref] };
    }
    const resolved = resolveShorthandToResourceRef(componentType as any, value);
    if (resolved) {
      return { [resolved.fieldKey]: resolved.value };
    }
    return {};
  }

  const overrides: Record<string, unknown> = {};
  const meta = getComponentMetadata(componentType);
  const fields = meta.inspector?.fields ?? [];

  for (const [key, val] of Object.entries(value)) {
    if (val === undefined) continue;
    const field = fields.find((f) => (f as { key: string }).key === key) as
      | { type?: string; key: string }
      | undefined;
    const resolved = field ? resolveOverrideValue(componentType, key, val) : val;
    overrides[key] = resolved;
  }
  return overrides;
}
