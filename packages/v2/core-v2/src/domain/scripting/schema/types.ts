import type { PropertySchema } from './propertyTypes';
import type { EntityId, InstanceId } from '../../ids';

export type { PropertySchema } from './propertyTypes';

/**
 * Script schema definition.
 * Declares a script's contract: what properties it exposes, what it requires, and what it provides.
 */
export interface ScriptSchema {
  /**
   * Unique script type identifier.
   * Used for script references and instantiation.
   */
  readonly name: string;

  /**
   * Human-readable description of the script's purpose.
   */
  readonly description?: string;

  /**
   * Property schema definitions.
   * Maps property names to their configurations.
   */
  readonly properties: Readonly<Record<string, PropertySchema>>;

  /**
   * Script lifecycle hook flags.
   */
  readonly lifecycle?: {
    readonly hasOnCreate?: boolean;
    readonly hasOnUpdate?: boolean;
    readonly hasOnDestroy?: boolean;
    readonly hasOnEnable?: boolean;
    readonly hasOnDisable?: boolean;
  };

  /**
   * Script category for organization.
   */
  readonly category?: string;

  /**
   * Tags for filtering and search.
   */
  readonly tags?: readonly string[];
}

/**
 * Runtime property value types based on schema.
 */
export type PropertyValue =
  | number
  | boolean
  | string
  | readonly [number, number]
  | readonly [number, number, number]
  | readonly [number, number, number, number]
  | EntityId // entityRef (entity ID)
  | readonly EntityId[] // entityRefArray (entity IDs)
  | null;

/**
 * Runtime property values record.
 */
export type PropertyValues = Record<string, PropertyValue>;

/**
 * Script instance configuration.
 * Combines the schema with actual property values.
 */
export interface ScriptInstance {
  /**
   * The script schema definition.
   */
  readonly schema: ScriptSchema;

  /**
   * Runtime property values.
   */
  readonly properties: PropertyValues;

  /**
   * Whether the script is currently enabled.
   */
  readonly enabled: boolean;

  /**
   * Unique instance identifier within the entity.
   */
  readonly instanceId?: InstanceId;
}

/**
 * Script registry entry.
 * Used to register and look up script schemas.
 */
export interface ScriptRegistryEntry {
  readonly schema: ScriptSchema;
  readonly sourceCode: string;
  readonly filePath?: string;
}
