export type PrimitiveKind =
  | 'number'
  | 'boolean'
  | 'string'
  | 'enum'
  | 'color'
  | 'vec2'
  | 'vec3'
  | 'vec4'
  | 'object';

export type ComponentPrimitiveKind = Extract<
  PrimitiveKind,
  'number' | 'boolean' | 'string' | 'color' | 'enum' | 'object'
>;

export type ScriptingPrimitiveKind = Extract<
  PrimitiveKind,
  'number' | 'boolean' | 'string' | 'vec2' | 'vec3' | 'color' | 'enum'
>;

/** Shared text/description attribute used by multiple schema systems. */
export interface DescribedAttribute {
  readonly description?: string;
}

/** Marks a value as required in schema-driven contracts. */
export interface RequiredAttribute {
  readonly required?: boolean;
}

/** Marks a value as nullable in editor-facing contracts. */
export interface NullableAttribute {
  readonly nullable?: boolean;
}

/** Generic default value attribute. */
export interface DefaultValueAttribute<T = unknown> {
  readonly default?: T;
}

/** Shared numeric constraints. */
export interface NumericConstraintAttributes {
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
}

/** Shared enum option shape for UI-driven selectors. */
export interface EnumOption<T extends string | number = string | number> {
  readonly value: T;
  readonly label: string;
  readonly icon?: unknown;
}

/** Shared enum value constraints. */
export interface EnumValueConstraint<T extends string | number = string | number> {
  readonly options: ReadonlyArray<T>;
}

export interface PrimitiveValidationRules {
  readonly kind: PrimitiveKind;
  readonly required?: boolean;
  readonly nullable?: boolean;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly options?: ReadonlyArray<string | number>;
  readonly colorMode?: 'string' | 'rgba';
}

export interface PrimitiveValidationResult {
  readonly valid: boolean;
  readonly error?: string;
}
