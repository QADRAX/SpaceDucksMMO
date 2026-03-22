/** Pure: coerce unknown manifest/component JSON to a plain object. */
export function coerceComponentDataStrict(raw: unknown): Record<string, unknown> {
  if (raw === undefined || raw === null) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  throw new Error('componentData must be an object (or omitted)');
}
