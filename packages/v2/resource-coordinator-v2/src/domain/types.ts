import type { ResourceLoader } from './resourceLoader';

/** Coordinator state holds the loader; cache comes from ports. */
export interface ResourceCoordinatorState {
  readonly resourceLoader: ResourceLoader;
}
