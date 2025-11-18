export interface InspectorFieldConfig<TComponent = any> {
  key: string;
  label?: string;
  get?: (component: TComponent) => unknown;
  set?: (component: TComponent, value: unknown) => void;
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
