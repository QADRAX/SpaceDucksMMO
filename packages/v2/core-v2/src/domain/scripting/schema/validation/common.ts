/** Returns true when the provided value is null or undefined. */
export function isMissingValue(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/** Returns true when value is a numeric tuple with the exact size. */
export function isNumberTuple(value: unknown, size: number): boolean {
  return Array.isArray(value) && value.length === size && value.every((v) => typeof v === 'number');
}
