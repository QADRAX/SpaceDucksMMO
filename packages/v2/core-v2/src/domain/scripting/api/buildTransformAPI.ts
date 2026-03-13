import {
  ensureClean,
  lookAt,
  setPosition,
  setRotation,
  setScale,
  setTransformParent,
} from '../../entities/transform';
import type { EntityState, TransformState } from '../../entities';
import { addChild, removeChildById } from '../../entities';
import type { SceneState } from '../../scene';
import type { EntityAPI, TransformAPI, Vec3API } from './types';

function toVec3Like(value: Vec3API): Vec3API {
  return { x: value.x, y: value.y, z: value.z };
}

function canWrite(isSelf: boolean): boolean {
  return isSelf;
}

/**
 * Builds a transform API for scripting with guarded write access.
 */
export function buildTransformAPI(
  transform: TransformState,
  ownerEntity: EntityState,
  scene: SceneState,
  isSelf: boolean,
  resolveEntityAPI: (entity: EntityState, isSelfEntity: boolean) => EntityAPI,
): TransformAPI {
  const getParentEntity = (): EntityState | undefined => {
    const parentTransform = transform.parent;
    if (!parentTransform) return undefined;

    for (const entity of scene.entities.values()) {
      if (entity.transform === parentTransform) {
        return entity;
      }
    }

    return undefined;
  };

  const getChildrenEntities = (): EntityState[] => {
    return ownerEntity.children;
  };

  return {
    get position() {
      ensureClean(transform);
      return toVec3Like(transform.worldPosition);
    },
    set position(value: Vec3API) {
      if (!canWrite(isSelf)) return;
      setPosition(transform, value.x, value.y, value.z);
    },

    get rotation() {
      ensureClean(transform);
      return toVec3Like(transform.worldRotation);
    },
    set rotation(value: Vec3API) {
      if (!canWrite(isSelf)) return;
      setRotation(transform, value.x, value.y, value.z);
    },

    get scale() {
      ensureClean(transform);
      return toVec3Like(transform.worldScale);
    },
    set scale(value: Vec3API) {
      if (!canWrite(isSelf)) return;
      setScale(transform, value.x, value.y, value.z);
    },

    get localPosition() {
      return toVec3Like(transform.localPosition);
    },
    set localPosition(value: Vec3API) {
      if (!canWrite(isSelf)) return;
      setPosition(transform, value.x, value.y, value.z);
    },

    get localRotation() {
      return toVec3Like(transform.localRotation);
    },
    set localRotation(value: Vec3API) {
      if (!canWrite(isSelf)) return;
      setRotation(transform, value.x, value.y, value.z);
    },

    get localScale() {
      return toVec3Like(transform.localScale);
    },
    set localScale(value: Vec3API) {
      if (!canWrite(isSelf)) return;
      setScale(transform, value.x, value.y, value.z);
    },

    get parent() {
      const parentEntity = getParentEntity();
      if (!parentEntity) return null;
      return resolveEntityAPI(parentEntity, false);
    },

    get children() {
      return getChildrenEntities()
        .map((child) => resolveEntityAPI(child, false));
    },

    lookAt(target: Vec3API) {
      if (!canWrite(isSelf)) return;
      lookAt(transform, target);
    },

    setParent(parent: EntityAPI | null) {
      if (!canWrite(isSelf)) return;

      if (ownerEntity.parent) {
        removeChildById(ownerEntity.parent, ownerEntity.id);
      }

      if (!parent) {
        setTransformParent(transform, undefined);
        ownerEntity.parent = undefined;
        return;
      }

      const parentEntity = scene.entities.get(parent.id);
      if (!parentEntity) {
        return;
      }

      addChild(parentEntity, ownerEntity);
    },
  };
}
