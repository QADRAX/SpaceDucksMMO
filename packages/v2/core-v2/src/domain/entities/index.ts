export * from './types';
export {
  createTransform,
  ensureClean,
  getPosition,
  getLocalPosition,
  getRotation,
  getAngle,
  getLocalRotation,
  getLocalAngle,
  getScale,
  getLocalScale,
  setPosition,
  setRotation,
  setRotationFromQuaternion,
  setScale,
  setUniformScale,
  lookAt,
  setTransformParent,
  copyTransform,
  cloneTransform,
  onTransformChange,
  removeTransformChange,
} from './transform';

export {
  type TransformView,
  createTransformView,
  getForward,
  getUp,
  getRight,
} from './transformView';

export { createEntityObservers } from './observers';

export {
  validateAddComponent,
  validateRemoveComponent,
  satisfiesRequirement,
  satisfiesHierarchyRequirement,
  wouldCreateCycle,
  validateHierarchyInSubtree,
  GEOMETRY_TYPES,
} from './validation';

export { cloneEntitySubtree } from './cloneEntity';

export {
  createEntity,
  createSpatialEntity,
  addComponent,
  removeComponent,
  getComponent,
  hasComponent,
  hasAnyComponent,
  getAllComponents,
  updateComponent,
  setComponentEnabled,
  setDisplayName,
  setGizmoIcon,
  setDebugEnabled,
  isDebugEnabled,
  getEnabledDebugs,
  addChild,
  removeChildById,
  getChild,
  getChildren,
} from './entity';

export {
  hasTransform3d,
  getTransform3d,
  requireTransform3d,
  findNearestAncestorTransform3d,
  reconcileTransform3dParent,
} from './transform3dAccess';

export { type EntityView, createEntityView } from './entityView';
