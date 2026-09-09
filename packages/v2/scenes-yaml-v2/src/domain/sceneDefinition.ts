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

/** Vec2-like object for screen-space transform2d. */
export interface Vec2Like {
  x: number;
  y: number;
}

/** Transform definition in YAML (world pose → transform3d). */
export interface TransformDefinition {
  position?: Vec3Like;
  rotation?: Vec3Like;
  scale?: Vec3Like;
}

/** Screen-space transform2d sugar (root box → transform2d). */
export interface Transform2dDefinition {
  position?: Vec2Like;
  size?: Vec2Like;
  rotation?: number;
  scale?: Vec2Like;
  anchor?: Vec2Like;
  pivot?: Vec2Like;
  zIndex?: number;
  enabled?: boolean;
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
  /** Optional screen UI root box sugar (mutually exclusive with components.transform2d). */
  transform2d?: Transform2dDefinition;
  components?: ComponentsDefinition;
  children?: EntityDefinition[];
}

/** Root scene structure in YAML. */
export interface SceneDefinition {
  entities: EntityDefinition[];
}
