/** Domain: types, pure functions, load logic, cache, port provider. */
export type { ResourceLoader } from './resourceLoader';
export type { ResourceCoordinatorState } from './types';
export {
  collectRefsFromEntity,
  collectRefsFromSubtree,
  collectRefsFromPrefabs,
  collectRefsFromScene,
  collectRefsFromAllScenes,
  type CollectedRefs,
} from './collectResourceRefs';
export { loadRefsIntoCache } from './loadRefsIntoCache';
export { provideResourceCoordinatorPorts } from './provideResourceCoordinatorPorts';
export { createResourceRuntimeCache } from './resourceRuntimeCache';
