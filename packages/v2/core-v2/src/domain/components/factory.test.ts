import { createComponent, getComponentMetadata } from './factory';
import type { CreatableComponentType } from './types/factory';
import { IDENTITY_SPECS } from './constants/gameplay/identity';
import { SCRIPTING_SPECS } from './constants/gameplay/scripting';
import { GEOMETRY_SPECS } from './constants/rendering/geometrySpecs';
import { MATERIAL_SPECS } from './constants/rendering/material';
import { SHADER_MATERIAL_SPECS } from './constants/rendering/shaderMaterial';
import { CAMERA_SPECS } from './constants/rendering/camera';
import { TEXTURE_SPECS } from './constants/rendering/texture';
import { LIGHT_SPECS } from './constants/rendering/light';
import { EFFECT_SPECS } from './constants/rendering/effects';
import { ENVIRONMENT_SPECS } from './constants/rendering/environment';
import { PHYSICS_SPECS } from './constants/physics/physicsSpecs';

/** Combined spec registry used as single source of truth for assertions. */
const ALL_SPECS: Record<string, { metadata: unknown; defaults: Record<string, unknown> }> = {
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

const ALL_TYPES = Object.keys(ALL_SPECS) as CreatableComponentType[];

// ── Shared structure ─────────────────────────────────────────────────
describe('createComponent – shared structure', () => {
  it.each(ALL_TYPES)('%s → has type, enabled, metadata', (type) => {
    const c = createComponent(type);
    expect(c.type).toBe(type);
    expect(c.enabled).toBe(true);
    expect(c.metadata).toBeDefined();
    expect(c.metadata.type).toBe(type);
  });
});

// ── Defaults match spec (no hardcoded values) ────────────────────────
describe('createComponent – defaults from spec', () => {
  it.each(ALL_TYPES)('%s → every default field matches its spec', (type) => {
    const c = createComponent(type);
    expect(c).toMatchObject(ALL_SPECS[type].defaults);
  });
});

// ── getComponentMetadata ─────────────────────────────────────────────
describe('getComponentMetadata', () => {
  it.each(ALL_TYPES)('%s → returns metadata with matching type', (type) => {
    const meta = getComponentMetadata(type);
    expect(meta).toBeDefined();
    expect(meta.type).toBe(type);
  });

  it('every type has label and category', () => {
    for (const type of ALL_TYPES) {
      const meta = getComponentMetadata(type);
      expect(typeof meta.label).toBe('string');
      expect(typeof meta.category).toBe('string');
    }
  });
});

// ── Overrides ────────────────────────────────────────────────────────
describe('createComponent – overrides', () => {
  it('override replaces only the specified field', () => {
    const c = createComponent('boxGeometry', { width: 99 });
    expect(c.width).toBe(99);
    // rest stays at spec defaults
    const spec = GEOMETRY_SPECS.boxGeometry.defaults;
    expect(c.height).toEqual(spec.height);
    expect(c.depth).toEqual(spec.depth);
  });

  it('override works for nested objects', () => {
    const custom = { x: 2, y: 3, z: 4 };
    const c = createComponent('boxCollider', { halfExtents: custom });
    expect(c.halfExtents).toEqual(custom);
    // collider base defaults preserved
    const spec = PHYSICS_SPECS.boxCollider.defaults;
    expect(c.friction).toEqual(spec.friction);
  });

  it('override works for string fields', () => {
    const c = createComponent('name', { value: 'Player' });
    expect(c.value).toBe('Player');
  });

  it('override works for array fields', () => {
    const ref = { scriptId: 'ai', enabled: true, properties: { speed: 5 } };
    const c = createComponent('script', { scripts: [ref] });
    expect(c.scripts).toHaveLength(1);
    expect(c.scripts[0].scriptId).toBe('ai');
  });

  it('override works for enum-like fields', () => {
    const c = createComponent('rigidBody', { bodyType: 'kinematic' });
    expect(c.bodyType).toBe('kinematic');
    const spec = PHYSICS_SPECS.rigidBody.defaults;
    expect(c.mass).toEqual(spec.mass);
  });
});

// ── Isolation ────────────────────────────────────────────────────────
describe('createComponent – isolation', () => {
  it('two components of the same type are independent objects', () => {
    const a = createComponent('boxGeometry');
    const b = createComponent('boxGeometry', { width: 99 });
    const spec = GEOMETRY_SPECS.boxGeometry.defaults;
    expect(a.width).toEqual(spec.width);
    expect(b.width).toBe(99);
  });

  it('mutating a created component does not affect the next one', () => {
    const a = createComponent('rigidBody');
    Object.assign(a, { mass: 999 });
    const b = createComponent('rigidBody');
    expect(b.mass).toEqual(PHYSICS_SPECS.rigidBody.defaults.mass);
  });
});

// ── Metadata relationships ───────────────────────────────────────────
describe('getComponentMetadata – structural rules', () => {
  it('colliders require rigidBody in hierarchy', () => {
    const colliders: CreatableComponentType[] = [
      'boxCollider',
      'sphereCollider',
      'capsuleCollider',
      'cylinderCollider',
      'coneCollider',
      'terrainCollider',
    ];
    for (const type of colliders) {
      const meta = getComponentMetadata(type);
      expect(meta.requiresInHierarchy).toContain('rigidBody');
    }
  });

  it('colliders declare conflicts with other colliders', () => {
    const meta = getComponentMetadata('sphereCollider');
    expect(meta.conflicts).toBeDefined();
    expect(meta.conflicts!.length).toBeGreaterThan(0);
  });

  it('materials require geometry', () => {
    const materials: CreatableComponentType[] = [
      'standardMaterial',
      'basicMaterial',
      'phongMaterial',
      'lambertMaterial',
    ];
    for (const type of materials) {
      expect(getComponentMetadata(type).requires).toContain('geometry');
    }
  });

  it('shader materials require geometry', () => {
    const shaders: CreatableComponentType[] = [
      'basicShaderMaterial',
      'standardShaderMaterial',
      'physicalShaderMaterial',
    ];
    for (const type of shaders) {
      expect(getComponentMetadata(type).requires).toContain('geometry');
    }
  });

  it('postProcess requires cameraView', () => {
    expect(getComponentMetadata('postProcess').requires).toContain('cameraView');
  });

  it('skybox is uniqueInScene', () => {
    expect(getComponentMetadata('skybox').uniqueInScene).toBe(true);
  });

  it('rigidBody inspector has bodyType enum field', () => {
    const meta = getComponentMetadata('rigidBody');
    const field = meta.inspector?.fields.find((f) => f.key === 'bodyType');
    expect(field).toBeDefined();
    expect(field?.type).toBe('enum');
    expect(field?.options?.length).toBeGreaterThan(0);
  });
});
