import type {
  EntityId,
  SceneState,
  UiCustomComponent,
  UiViewComponent,
  ViewportId,
} from '@duckengine/core-v2';
import {
  defineSubsystemUseCase,
  getTransform2d,
  resolveUiTargetViewports,
} from '@duckengine/core-v2';
import type { UISubsystemState } from '../domain/uiSubsystem/types';
import { uiMountKey } from '../domain/uiSubsystem/types';
import { layoutFromTransform2d } from '../domain/uiSubsystem/layoutFromTransform2d';

/** Params shared by scene events and frame phases (both carry `scene`). */
export interface ReconcileUiRootsParams {
  readonly scene: SceneState;
}

/**
 * Shared UI projection: resolve targets/surfaces, then **delegate** to Duck or custom runtimes.
 * Mounts missing targets, updates existing ones, unmounts stale pairs.
 */
export const reconcileUiRoots = defineSubsystemUseCase<
  UISubsystemState,
  ReconcileUiRootsParams,
  void
>({
  name: 'ui/reconcileUiRoots',
  execute(state, { scene }) {
    const engine = scene.engine;
    if (!engine || !state.surfaceHost) return;

    const viewports = Array.from(engine.viewports.values()).map((vp) => ({
      id: vp.id,
      sceneId: vp.sceneId,
      cameraEntityId: vp.cameraEntityId,
      enabled: vp.enabled,
    }));

    const desired = new Set<string>();

    for (const entity of scene.entities.values()) {
      const transform = getTransform2d(entity);
      if (!transform) continue;

      const view = entity.components.get('uiView') as UiViewComponent | undefined;
      const custom = entity.components.get('uiCustom') as UiCustomComponent | undefined;
      const duckContent = view?.enabled !== false ? view : undefined;
      const customContent = !duckContent && custom?.enabled !== false ? custom : undefined;
      if (!duckContent && !customContent) continue;

      const target = duckContent?.uiTarget ?? customContent?.uiTarget ?? {};
      const viewportIds = resolveUiTargetViewports({
        sceneId: scene.id,
        target,
        viewports,
        cameraHasTag: state.cameraHasTag,
      });

      const layout = layoutFromTransform2d(transform);

      for (const viewportId of viewportIds) {
        const surface = state.surfaceHost.getSurface(viewportId);
        if (!surface) continue;

        const key = uiMountKey(entity.id, viewportId);
        desired.add(key);

        if (duckContent && state.viewRuntime) {
          if (state.mounted.has(key)) {
            void state.viewRuntime.update({
              entityId: entity.id,
              viewportId,
              layout,
              document: duckContent.document,
              bindings: duckContent.bindings,
            });
          } else {
            void state.viewRuntime.mount({
              entityId: entity.id,
              sceneId: scene.id,
              viewportId,
              surface,
              layout,
              document: duckContent.document,
              bindings: duckContent.bindings,
            });
            state.mounted.add(key);
          }
        } else if (customContent?.spa && state.customRuntime) {
          if (state.mounted.has(key)) {
            void state.customRuntime.update({
              entityId: entity.id,
              viewportId,
              layout,
              props: customContent.props,
            });
          } else {
            void state.customRuntime.mount({
              entityId: entity.id,
              sceneId: scene.id,
              viewportId,
              surface,
              layout,
              spa: customContent.spa,
              context: {
                entityId: entity.id,
                sceneId: scene.id,
                viewportId,
                props: { ...customContent.props },
                onProps: () => () => undefined,
                emit: () => undefined,
              },
            });
            state.mounted.add(key);
          }
        }
      }
    }

    for (const key of [...state.mounted]) {
      if (desired.has(key)) continue;
      const [entityId, viewportId] = key.split('::') as [EntityId, ViewportId];
      void state.viewRuntime?.unmount(entityId, viewportId);
      void state.customRuntime?.unmount(entityId, viewportId);
      state.mounted.delete(key);
    }
  },
});
