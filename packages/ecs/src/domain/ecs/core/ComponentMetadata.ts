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
  label?: string;
  unique?: boolean;
  /** If true, at most one instance of this component type is allowed in the entire scene. */
  uniqueInScene?: boolean;
  requires?: string[];
  /**
   * Component types that must exist on this entity OR any ancestor in the entity hierarchy.
   *
   * Use this for requirements that are satisfied by an "owner" entity, e.g. compound colliders
   * requiring a `rigidBody` on a parent.
   */
  requiresInHierarchy?: string[];
  conflicts?: string[];
  inspector?: InspectorMetadata<TComponent>;
  description?: string;
  /**
   * Category for grouping components in the UI
   */
  category?: string;
  /**
   * Icon name for visual representation (e.g., from Lucide icons)
   */
  icon?: string;
}
