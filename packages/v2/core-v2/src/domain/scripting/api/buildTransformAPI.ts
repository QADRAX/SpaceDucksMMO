import {
  getLocalPosition,
  getLocalRotation,
  getLocalScale,
  getPosition,
  getRotation,
  getScale,
  lookAt,
  setPosition,
  setRotation,
  setScale,
} from '../../entities/transform';
import type { EntityState } from '../../entities';
import { addChild, removeChildById } from '../../entities';
import { getTransform3d } from '../../entities/transform3dAccess';
import type { SceneState } from '../../scene';
import type { EntityAPI, TransformAPI, Vec3API } from './types';

function toVec3Like(value: { x: number; y: number; z: number }): Vec3API {
  return { x: value.x, y: value.y, z: value.z };
}

function canWrite(isSelf: boolean): boolean {
  return isSelf;
}

/**
 * Builds a transform API for scripting with guarded write access.
 * Caller must ensure the entity has transform3d.
 */
export function buildTransformAPI(
  ownerEntity: EntityState,
  scene: SceneState,
  isSelf: boolean,
  resolveEntityAPI: (entity: EntityState, isSelfEntity: boolean) => EntityAPI,
): TransformAPI {
  const transform = getTransform3d(ownerEntity);
  if (!transform) {
    throw new Error(`buildTransformAPI: entity "${ownerEntity.id}" has no transform3d`);
  }

  return {
    get position() {
      return toVec3Like(getPosition(transform));
    },
    set position(value: Vec3API) {
      if (!canWrite(isSelf)) return;
      setPosition(transform, value.x, value.y, value.z);
    },

    get rotation() {
      return toVec3Like(getRotation(transform));
    },
    set rotation(value: Vec3API) {
      if (!canWrite(isSelf)) return;
      setRotation(transform, value.x, value.y, value.z);
    },

    get scale() {
      return toVec3Like(getScale(transform));
    },
    set scale(value: Vec3API) {
      if (!canWrite(isSelf)) return;
      setScale(transform, value.x, value.y, value.z);
    },

    get localPosition() {
      return toVec3Like(getLocalPosition(transform));
    },
    set localPosition(value: Vec3API) {
      if (!canWrite(isSelf)) return;
      setPosition(transform, value.x, value.y, value.z);
    },

    get localRotation() {
      return toVec3Like(getLocalRotation(transform));
    },
    set localRotation(value: Vec3API) {
      if (!canWrite(isSelf)) return;
      setRotation(transform, value.x, value.y, value.z);
    },

    get localScale() {
      return toVec3Like(getLocalScale(transform));
    },
    set localScale(value: Vec3API) {
      if (!canWrite(isSelf)) return;
      setScale(transform, value.x, value.y, value.z);
    },

    get parent() {
      // Logical entity parent (hierarchy), not pose parent.
      if (!ownerEntity.parent) return null;
      return resolveEntityAPI(ownerEntity.parent, false);
    },

    get children() {
      return ownerEntity.children.map((child) => resolveEntityAPI(child, false));
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
