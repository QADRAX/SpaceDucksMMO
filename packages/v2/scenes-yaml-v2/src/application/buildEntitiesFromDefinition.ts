/**
 * Use case: build EntityState trees from validated scene definition.
 * Orchestrates domain (buildComponentOverrides, applyTransformToEntity) + core-v2.
 */
import {
  createEntity,
  addComponent,
  addChild,
  createComponent,
  createEntityId,
} from '@duckengine/core-v2';
import type { EntityState } from '@duckengine/core-v2';
import type { CreatableComponentType } from '@duckengine/core-v2';
import { ok, type Result } from '@duckengine/core-v2';
import type { SceneDefinition, EntityDefinition } from '../domain/sceneDefinition';
import { buildComponentOverrides } from '../domain/buildComponentOverrides';
import { applyTransformToEntity } from '../domain/applyTransform';

/**
 * Builds EntityState trees from a validated scene definition.
 * Returns an array of root entities (to be added to the scene).
 */
export function buildEntitiesFromDefinition(
  definition: SceneDefinition,
): Result<EntityState[]> {
  const entities: EntityState[] = [];
  for (const def of definition.entities) {
    const r = buildEntityFromDefinition(def);
    if (!r.ok) return r;
    entities.push(r.value);
  }
  return ok(entities);
}

function buildEntityFromDefinition(def: EntityDefinition): Result<EntityState> {
  const id = createEntityId(def.id);
  const entity = createEntity(id, def.displayName ?? def.id);

  if (def.transform) {
    applyTransformToEntity(entity, def.transform);
  }

  if (def.components) {
    for (const [compType, value] of Object.entries(def.components)) {
      const type = compType as CreatableComponentType;
      const overrides = buildComponentOverrides(type, value);
      const comp = createComponent(type, overrides as any);
      const r = addComponent(entity, comp);
      if (!r.ok) return r;
    }
  }

  if (def.children) {
    for (const childDef of def.children) {
      const childResult = buildEntityFromDefinition(childDef);
      if (!childResult.ok) return childResult;
      addChild(entity, childResult.value);
    }
  }

  return ok(entity);
}
