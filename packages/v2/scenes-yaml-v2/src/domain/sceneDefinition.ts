/**
 * Types for the YAML scene definition format.
 * Used by parse, validation, and builder.
 */

/** Vec3-like object for position, rotation, scale. */
export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

/** Transform definition in YAML. */
export interface TransformDefinition {
  position?: Vec3Like;
  rotation?: Vec3Like;
  scale?: Vec3Like;
}

/**
 * Component value in YAML: either a shorthand (string resource key)
 * or an override object with explicit fields.
 */
export type ComponentValueYaml = string | Record<string, unknown>;

/**
 * Components map: componentType -> value (shorthand or override).
 */
export type ComponentsDefinition = Record<string, ComponentValueYaml>;

/** Single entity definition in YAML. */
export interface EntityDefinition {
  id: string;
  displayName?: string;
  transform?: TransformDefinition;
  components?: ComponentsDefinition;
  children?: EntityDefinition[];
}

/** Root scene structure in YAML. */
export interface SceneDefinition {
  entities: EntityDefinition[];
}
