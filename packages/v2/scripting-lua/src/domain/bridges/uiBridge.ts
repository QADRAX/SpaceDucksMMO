import type {
  EntityId,
  SceneState,
  ScriptSchema,
  UiSpaComponent,
  UiTarget,
  UiViewComponent,
  ViewportId,
} from '@duckengine/core-v2';
import {
  getComponent,
  getTransform2d,
  resolveUiTargetViewports,
} from '@duckengine/core-v2';
import type { BridgeDeclaration, BridgePorts } from './types';

function getUiView(scene: SceneState, id: EntityId): UiViewComponent | undefined {
  const e = scene.entities.get(id);
  if (!e) return undefined;
  return getComponent<UiViewComponent>(e, 'uiView');
}

function getUiSpa(scene: SceneState, id: EntityId): UiSpaComponent | undefined {
  const e = scene.entities.get(id);
  if (!e) return undefined;
  return getComponent<UiSpaComponent>(e, 'uiSpa');
}

function contentComponent(
  scene: SceneState,
  id: EntityId,
): UiViewComponent | UiSpaComponent | undefined {
  return getUiView(scene, id) ?? getUiSpa(scene, id);
}

function fireUiChanged(scene: SceneState, id: EntityId, type: 'uiView' | 'uiSpa'): void {
  const e = scene.entities.get(id);
  e?.observers.fireComponentChanged(id, type);
}

/**
 * UI bridge — operates on `uiView` or `uiSpa` (props/bindings + uiTarget).
 * Soft null-logic when content missing or transform2d inactive for paint checks.
 */
export const uiBridge: BridgeDeclaration = {
  name: 'UI',
  perEntity: true,
  factory(scene: SceneState, _entityId, _schema: ScriptSchema | null, _ports: BridgePorts) {
    return {
      has(id: EntityId): boolean {
        return contentComponent(scene, id) !== undefined;
      },

      setEnabled(id: EntityId, enabled: boolean): boolean {
        const view = getUiView(scene, id);
        if (view) {
          view.enabled = !!enabled;
          fireUiChanged(scene, id, 'uiView');
          return true;
        }
        const spa = getUiSpa(scene, id);
        if (spa) {
          spa.enabled = !!enabled;
          fireUiChanged(scene, id, 'uiSpa');
          return true;
        }
        return false;
      },

      getProp(id: EntityId, key: string): unknown {
        const view = getUiView(scene, id);
        if (view) return view.bindings[key];
        const spa = getUiSpa(scene, id);
        return spa?.props[key];
      },

      setProp(id: EntityId, key: string, value: unknown): boolean {
        const view = getUiView(scene, id);
        if (view) {
          view.bindings[key] = value;
          fireUiChanged(scene, id, 'uiView');
          return true;
        }
        const spa = getUiSpa(scene, id);
        if (spa) {
          spa.props[key] = value;
          fireUiChanged(scene, id, 'uiSpa');
          return true;
        }
        return false;
      },

      setProps(id: EntityId, props: Record<string, unknown>): boolean {
        const view = getUiView(scene, id);
        if (view) {
          Object.assign(view.bindings, props);
          fireUiChanged(scene, id, 'uiView');
          return true;
        }
        const spa = getUiSpa(scene, id);
        if (spa) {
          Object.assign(spa.props, props);
          fireUiChanged(scene, id, 'uiSpa');
          return true;
        }
        return false;
      },

      getTarget(id: EntityId): UiTarget | undefined {
        return contentComponent(scene, id)?.uiTarget;
      },

      setTarget(id: EntityId, target: UiTarget): boolean {
        const view = getUiView(scene, id);
        if (view) {
          view.uiTarget = { ...target };
          fireUiChanged(scene, id, 'uiView');
          return true;
        }
        const spa = getUiSpa(scene, id);
        if (spa) {
          spa.uiTarget = { ...target };
          fireUiChanged(scene, id, 'uiSpa');
          return true;
        }
        return false;
      },

      clearTarget(id: EntityId): boolean {
        const view = getUiView(scene, id);
        if (view) {
          view.uiTarget = {};
          fireUiChanged(scene, id, 'uiView');
          return true;
        }
        const spa = getUiSpa(scene, id);
        if (spa) {
          spa.uiTarget = {};
          fireUiChanged(scene, id, 'uiSpa');
          return true;
        }
        return false;
      },

      targetsViewport(id: EntityId, viewportId: string): boolean {
        const e = scene.entities.get(id);
        if (!e || !getTransform2d(e)) return false;
        const content = contentComponent(scene, id);
        if (!content || content.enabled === false) return false;
        const engine = scene.engine;
        if (!engine) return false;
        const viewports = Array.from(engine.viewports.values()).map((vp) => ({
          id: vp.id,
          sceneId: vp.sceneId,
          cameraEntityId: vp.cameraEntityId,
          enabled: vp.enabled,
        }));
        const matched = resolveUiTargetViewports({
          sceneId: scene.id,
          target: content.uiTarget,
          viewports,
        });
        return matched.includes(viewportId as ViewportId);
      },
    };
  },
};
