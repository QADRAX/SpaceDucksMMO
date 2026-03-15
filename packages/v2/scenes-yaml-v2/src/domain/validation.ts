/**
 * Runtime validation of scene YAML definitions.
 * Uses component specs from core-v2 for structure and ECS rules.
 */
import {
  getComponentMetadata,
  validateFieldValue,
  type CreatableComponentType,
} from '@duckengine/core-v2';
import {
  IDENTITY_SPECS,
  GEOMETRY_SPECS,
  MATERIAL_SPECS,
  SHADER_MATERIAL_SPECS,
  CAMERA_SPECS,
  TEXTURE_SPECS,
  LIGHT_SPECS,
  EFFECT_SPECS,
  ENVIRONMENT_SPECS,
  PHYSICS_SPECS,
  SCRIPTING_SPECS,
} from '@duckengine/core-v2';
import { ok, err, type Result } from '@duckengine/core-v2';
import type {
  SceneDefinition,
  EntityDefinition,
  ComponentsDefinition,
  Vec3Like,
} from './sceneDefinition';

const ALL_SPECS: Record<string, unknown> = {
  ...IDENTITY_SPECS,
  ...GEOMETRY_SPECS,
  ...MATERIAL_SPECS,
  ...SHADER_MATERIAL_SPECS,
  ...CAMERA_SPECS,
  ...TEXTURE_SPECS,
  ...LIGHT_SPECS,
  ...EFFECT_SPECS,
  ...ENVIRONMENT_SPECS,
  ...PHYSICS_SPECS,
  ...SCRIPTING_SPECS,
};

const CREATABLE_TYPES = new Set(Object.keys(ALL_SPECS));

/** Validation error with path for user feedback. */
export interface ValidationError {
  path: string;
  message: string;
}

function fail(path: string, message: string): Result<never> {
  return err('validation', message, { path });
}

function validateVec3(value: unknown, path: string): Result<Vec3Like> {
  if (value === null || value === undefined) {
    return fail(path, 'Vec3 is required');
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    return fail(path, 'Vec3 must be an object with x, y, z');
  }
  const v = value as Record<string, unknown>;
  const x = v.x;
  const y = v.y;
  const z = v.z;
  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
    return fail(path, 'Vec3 x, y, z must be numbers');
  }
  return ok({ x, y, z });
}

function validateComponentValue(
  componentType: string,
  value: unknown,
  path: string,
): Result<void> {
  if (typeof value === 'string') {
    // Shorthand: resource key
    if (value.trim().length === 0) {
      return fail(path, 'Resource key cannot be empty');
    }
    return ok(undefined);
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return fail(path, 'Component value must be string (shorthand) or object (override)');
  }

  const type = componentType as CreatableComponentType;
  if (!CREATABLE_TYPES.has(componentType)) {
    return fail(path, `Unknown component type: ${componentType}`);
  }

  const meta = getComponentMetadata(type);
  const fields = meta.inspector?.fields ?? [];
  const knownKeys = new Set(fields.map((f) => (f as { key: string }).key));
  knownKeys.add('type');
  knownKeys.add('enabled');
  knownKeys.add('metadata');

  // Allow composite vec3 keys (e.g. halfExtents) when inspector has halfExtents.x, halfExtents.y, halfExtents.z
  for (const f of fields) {
    const k = (f as { key: string }).key;
    if (k.includes('.')) {
      const parent = k.split('.')[0];
      knownKeys.add(parent);
    }
  }

  const obj = value as Record<string, unknown>;
  for (const [key, val] of Object.entries(obj)) {
    if (!knownKeys.has(key)) {
      return fail(`${path}.${key}`, `Unknown field: ${key}`);
    }
    const field = fields.find((f) => (f as { key: string }).key === key);
    if (field && val !== undefined) {
      const r = validateFieldValue(field as any, val);
      if (!r.ok) {
        return fail(`${path}.${key}`, r.error.message);
      }
    }
    // Validate composite vec3 (e.g. halfExtents: { x, y, z }) when no direct field match
    if (!field && val !== undefined && typeof val === 'object' && val !== null && !Array.isArray(val)) {
      const v = val as Record<string, unknown>;
      if ('x' in v && 'y' in v && 'z' in v) {
        const r = validateVec3(val, `${path}.${key}`);
        if (!r.ok) {
          return fail(`${path}.${key}`, r.error.message);
        }
      }
    }
  }
  return ok(undefined);
}

function validateComponents(
  components: ComponentsDefinition,
  path: string,
): Result<void> {
  for (const [compType, value] of Object.entries(components)) {
    if (!CREATABLE_TYPES.has(compType)) {
      return fail(`${path}.${compType}`, `Unknown component type: ${compType}`);
    }
    const r = validateComponentValue(compType, value, `${path}.${compType}`);
    if (!r.ok) return r;
  }
  return ok(undefined);
}

function validateEntity(entity: EntityDefinition, path: string): Result<void> {
  if (!entity.id || typeof entity.id !== 'string') {
    return fail(`${path}.id`, 'Entity id is required and must be a string');
  }
  if (entity.id.trim().length === 0) {
    return fail(`${path}.id`, 'Entity id cannot be empty');
  }

  if (entity.transform) {
    const t = entity.transform;
    if (t.position) {
      const r = validateVec3(t.position, `${path}.transform.position`);
      if (!r.ok) return r;
    }
    if (t.rotation) {
      const r = validateVec3(t.rotation, `${path}.transform.rotation`);
      if (!r.ok) return r;
    }
    if (t.scale) {
      const r = validateVec3(t.scale, `${path}.transform.scale`);
      if (!r.ok) return r;
    }
  }

  if (entity.components) {
    const r = validateComponents(entity.components, `${path}.components`);
    if (!r.ok) return r;
  }

  if (entity.children) {
    if (!Array.isArray(entity.children)) {
      return fail(`${path}.children`, 'children must be an array');
    }
    for (let i = 0; i < entity.children.length; i++) {
      const r = validateEntity(entity.children[i], `${path}.children[${i}]`);
      if (!r.ok) return r;
    }
  }

  return ok(undefined);
}

/**
 * Validates a parsed scene definition against structure and ECS rules.
 * Returns the same definition if valid (no transformation).
 */
export function validateSceneDefinition(
  data: unknown,
): Result<SceneDefinition> {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return err('validation', 'Scene must be an object with entities array');
  }

  const obj = data as Record<string, unknown>;
  const entities = obj.entities;
  if (!Array.isArray(entities)) {
    return err('validation', 'Scene must have an entities array');
  }

  const scene: SceneDefinition = { entities: [] };
  const seenIds = new Set<string>();

  const collectIds = (e: EntityDefinition) => {
    if (seenIds.has(e.id)) {
      throw new Error(`Duplicate entity id: ${e.id}`);
    }
    seenIds.add(e.id);
    for (const c of e.children ?? []) collectIds(c);
  };

  for (let i = 0; i < entities.length; i++) {
    const ent = entities[i];
    if (typeof ent !== 'object' || ent === null || Array.isArray(ent)) {
      return err('validation', `entities[${i}] must be an object`);
    }
    const r = validateEntity(ent as EntityDefinition, `entities[${i}]`);
    if (!r.ok) return r;

    const def = ent as EntityDefinition;
    try {
      collectIds(def);
    } catch (e) {
      return err('validation', (e as Error).message);
    }

    scene.entities.push(def);
  }

  return ok(scene);
}
