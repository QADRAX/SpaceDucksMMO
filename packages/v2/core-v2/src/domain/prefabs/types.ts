import type { PrefabId } from '../ids';

/** Event emitted when a prefab is added to the scene's prefab map. */
export type PrefabAddedEvent = {
  readonly kind: 'prefab-added';
  readonly prefabId: PrefabId;
};

/** Event emitted when a prefab is removed from the scene's prefab map. */
export type PrefabRemovedEvent = {
  readonly kind: 'prefab-removed';
  readonly prefabId: PrefabId;
};
