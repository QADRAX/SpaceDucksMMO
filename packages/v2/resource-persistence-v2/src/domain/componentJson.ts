/**
 * Parse persisted `componentData` JSON string from DB rows.
 */
export function parseComponentDataJsonString(raw: string | null | undefined): Record<string, unknown> {
  if (typeof raw !== 'string' || !raw.trim()) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}
