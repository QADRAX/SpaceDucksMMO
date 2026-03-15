export {
  createResourceCoordinatorSubsystem,
  type CreateResourceCoordinatorSubsystemOptions,
} from './infrastructure';
export {
  type ResourceLoader,
  type ResourceCoordinatorState,
  collectRefsFromEntity,
  collectRefsFromSubtree,
  collectRefsFromPrefabs,
  collectRefsFromScene,
  collectRefsFromAllScenes,
  type CollectedRefs,
} from './domain';
