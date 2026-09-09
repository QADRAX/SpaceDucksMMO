import type { EntityId, SceneState, UiSpaComponent, UiViewComponent, ViewportId } from '@duckengine/core-v2';
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
 * Reconciles UI root mounts for the scene against current viewports and components.
 * Mounts missing targets, updates existing ones, unmounts stale pairs.
 *
 * Composable on scene events and `lateUpdate` — only requires `{ scene }`.
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
      const spa = entity.components.get('uiSpa') as UiSpaComponent | undefined;
      const content = view?.enabled !== false ? view : undefined;
      const spaContent = !content && spa?.enabled !== false ? spa : undefined;
      if (!content && !spaContent) continue;

      const target = content?.uiTarget ?? spaContent?.uiTarget ?? {};
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

        if (content && state.viewRuntime) {
          if (state.mounted.has(key)) {
            void state.viewRuntime.update({
              entityId: entity.id,
              viewportId,
              layout,
              document: content.document,
              bindings: content.bindings,
            });
          } else {
            void state.viewRuntime.mount({
              entityId: entity.id,
              sceneId: scene.id,
              viewportId,
              surface,
              layout,
              document: content.document,
              bindings: content.bindings,
            });
            state.mounted.add(key);
          }
        } else if (spaContent?.spa && state.spaRuntime) {
          if (state.mounted.has(key)) {
            void state.spaRuntime.update({
              entityId: entity.id,
              viewportId,
              layout,
              props: spaContent.props,
            });
          } else {
            void state.spaRuntime.mount({
              entityId: entity.id,
              sceneId: scene.id,
              viewportId,
              surface,
              layout,
              spa: spaContent.spa,
              context: {
                entityId: entity.id,
                sceneId: scene.id,
                viewportId,
                props: { ...spaContent.props },
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
      void state.spaRuntime?.unmount(entityId, viewportId);
      state.mounted.delete(key);
    }
  },
});
