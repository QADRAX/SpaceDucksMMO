/**
 * Generates JSON Schema for scene YAML from component specs.
 * Single source of truth: COMPONENT_SPECS + inspector.fields.
 */
import {
  IDENTITY_SPECS,
  GEOMETRY_SPECS,
  MATERIAL_SPECS,
  SHADER_MATERIAL_SPECS,
  CAMERA_SPECS,
  RIGGING_SPECS,
  TEXTURE_SPECS,
  LIGHT_SPECS,
  EFFECT_SPECS,
  ENVIRONMENT_SPECS,
  PHYSICS_SPECS,
  SCRIPTING_SPECS,
  getComponentMetadata,
} from '@duckengine/core-v2';
import type { CreatableComponentType } from '@duckengine/core-v2';
type JSONSchema = Record<string, unknown>;

const ALL_SPECS: Record<string, unknown> = {
  ...IDENTITY_SPECS,
  ...GEOMETRY_SPECS,
  ...MATERIAL_SPECS,
  ...SHADER_MATERIAL_SPECS,
  ...CAMERA_SPECS,
  ...RIGGING_SPECS,
  ...TEXTURE_SPECS,
  ...LIGHT_SPECS,
  ...EFFECT_SPECS,
  ...ENVIRONMENT_SPECS,
  ...PHYSICS_SPECS,
  ...SCRIPTING_SPECS,
};

const CREATABLE_TYPES = Object.keys(ALL_SPECS) as CreatableComponentType[];

const VEC3_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    x: { type: 'number' },
    y: { type: 'number' },
    z: { type: 'number' },
  },
  required: ['x', 'y', 'z'],
};

function fieldToJsonSchema(field: { type?: string; key: string; label?: string; min?: number; max?: number; step?: number; nullable?: boolean; options?: { value: unknown }[] }): JSONSchema {
  const base: JSONSchema = { description: field.label };
  switch (field.type) {
    case 'number':
      return { ...base, type: 'number', minimum: field.min, maximum: field.max };
    case 'boolean':
      return { ...base, type: 'boolean' };
    case 'string':
    case 'texture':
    case 'reference':
    case 'resource':
      return { ...base, type: 'string' };
    case 'color':
      return { ...base, type: 'string' };
    case 'enum':
      return {
        ...base,
        enum: field.options?.map((o) => o.value) ?? [],
      };
    case 'vector':
      return { ...base, ...VEC3_SCHEMA };
    case 'object':
    case 'uniforms':
      return { ...base, type: 'object' };
    default:
      return { ...base, type: ['string', 'number', 'boolean', 'object'] };
  }
}

function buildComponentOverrideSchema(type: CreatableComponentType): JSONSchema {
  const meta = getComponentMetadata(type);
  const fields = meta.inspector?.fields ?? [];
  const properties: Record<string, JSONSchema> = {};
  for (const field of fields) {
    const f = field as { type?: string; key: string; label?: string; min?: number; max?: number; step?: number; nullable?: boolean; options?: { value: unknown }[] };
    properties[f.key] = fieldToJsonSchema(f);
  }
  return {
    type: 'object',
    properties,
    additionalProperties: true,
  };
}

/** Build JSON Schema for the scene YAML format. */
export function buildJsonSchemaFromSpecs(): JSONSchema {
  const componentSchemas: Record<string, JSONSchema> = {};
  for (const type of CREATABLE_TYPES) {
    componentSchemas[type] = {
      oneOf: [
        { type: 'string', description: 'Resource key shorthand' },
        buildComponentOverrideSchema(type),
      ],
    };
  }

  const entitySchema: JSONSchema = {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', description: 'Entity ID' },
      displayName: { type: 'string' },
      transform: {
        type: 'object',
        properties: {
          position: VEC3_SCHEMA,
          rotation: VEC3_SCHEMA,
          scale: VEC3_SCHEMA,
        },
      },
      components: {
        type: 'object',
        properties: componentSchemas,
        additionalProperties: false,
      },
      children: {
        type: 'array',
        items: { $ref: '#/definitions/Entity' },
      },
    },
  };

  return {
    $schema: 'http://json-schema.org/draft-04/schema#',
    title: 'Scene YAML',
    description: 'Declarative scene definition for DuckEngine',
    type: 'object',
    required: ['entities'],
    properties: {
      entities: {
        type: 'array',
        items: { $ref: '#/definitions/Entity' },
      },
    },
    definitions: {
      Entity: entitySchema,
    },
  };
}
