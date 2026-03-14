export {
  createResourceCoordinatorSubsystem,
  type CreateResourceCoordinatorSubsystemOptions,
} from './infrastructure/resourceCoordinatorSubsystem';
export type { ResourceLoader } from './domain/resourceLoader';
export type { ResourceCoordinatorState } from './domain/types';
export {
  collectRefsFromEntity,
  collectRefsFromSubtree,
  collectRefsFromPrefabs,
  collectRefsFromScene,
  collectRefsFromAllScenes,
  type CollectedRefs,
} from './domain/collectResourceRefs';
