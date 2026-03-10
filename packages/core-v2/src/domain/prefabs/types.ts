
/** Event emitted when a prefab is added to the scene's prefab map. */
export type PrefabAddedEvent = {
  readonly kind: 'prefab-added';
  readonly prefabId: string;
};

/** Event emitted when a prefab is removed from the scene's prefab map. */
export type PrefabRemovedEvent = {
  readonly kind: 'prefab-removed';
  readonly prefabId: string;
};
