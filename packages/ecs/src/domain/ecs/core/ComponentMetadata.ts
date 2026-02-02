export interface InspectorFieldConfig<TComponent = any, TValue = unknown> {
  key: string;
  label?: string;
  get?(component: TComponent): TValue;
  set?(component: TComponent, value: TValue): void;
  // UI metadata
  type?:
    | "number"
    | "boolean"
    | "string"
    | "color"
    | "texture"
    | "enum"
    | "vector"
    | "object"
    | "reference"
    | "uniforms";
  description?: string;
  nullable?: boolean;
  default?: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string | number; label: string; icon?: any }>;
}

export interface InspectorMetadata<TComponent = any> {
  fields: InspectorFieldConfig<TComponent, unknown>[];
}

export interface ComponentMetadata<TComponent = any> {
  type: string;
  unique?: boolean;
  requires?: string[];
  conflicts?: string[];
  inspector?: InspectorMetadata<TComponent>;
  description?: string;
}
