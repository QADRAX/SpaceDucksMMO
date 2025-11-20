export interface InspectorFieldConfig<TComponent = any> {
  key: string;
  label?: string;
  get?: (component: TComponent) => unknown;
  set?: (component: TComponent, value: unknown) => void;
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
  nullable?: boolean;
  default?: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string | number; label: string; icon?: any }>;
}

export interface InspectorMetadata<TComponent = any> {
  fields: InspectorFieldConfig<TComponent>[];
}

export interface ComponentMetadata<TComponent = any> {
  type: string;
  unique?: boolean;
  requires?: string[];
  conflicts?: string[];
  inspector?: InspectorMetadata<TComponent>;
}
