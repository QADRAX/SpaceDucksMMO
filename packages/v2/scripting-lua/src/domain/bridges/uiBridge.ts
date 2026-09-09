import type {
  EntityId,
  SceneState,
  ScriptSchema,
  UiCustomComponent,
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

function getUiCustom(scene: SceneState, id: EntityId): UiCustomComponent | undefined {
  const e = scene.entities.get(id);
  if (!e) return undefined;
  return getComponent<UiCustomComponent>(e, 'uiCustom');
}

function contentComponent(
  scene: SceneState,
  id: EntityId,
): UiViewComponent | UiCustomComponent | undefined {
  return getUiView(scene, id) ?? getUiCustom(scene, id);
}

function fireUiChanged(scene: SceneState, id: EntityId, type: 'uiView' | 'uiCustom'): void {
  const e = scene.entities.get(id);
  e?.observers.fireComponentChanged(id, type);
}

/**
 * UI bridge — operates on `uiView` or `uiCustom` (bindings/props + uiTarget).
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
        const custom = getUiCustom(scene, id);
        if (custom) {
          custom.enabled = !!enabled;
          fireUiChanged(scene, id, 'uiCustom');
          return true;
        }
        return false;
      },

      getProp(id: EntityId, key: string): unknown {
        const view = getUiView(scene, id);
        if (view) return view.bindings[key];
        const custom = getUiCustom(scene, id);
        return custom?.props[key];
      },

      setProp(id: EntityId, key: string, value: unknown): boolean {
        const view = getUiView(scene, id);
        if (view) {
          view.bindings[key] = value;
          fireUiChanged(scene, id, 'uiView');
          return true;
        }
        const custom = getUiCustom(scene, id);
        if (custom) {
          custom.props[key] = value;
          fireUiChanged(scene, id, 'uiCustom');
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
        const custom = getUiCustom(scene, id);
        if (custom) {
          Object.assign(custom.props, props);
          fireUiChanged(scene, id, 'uiCustom');
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
        const custom = getUiCustom(scene, id);
        if (custom) {
          custom.uiTarget = { ...target };
          fireUiChanged(scene, id, 'uiCustom');
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
        const custom = getUiCustom(scene, id);
        if (custom) {
          custom.uiTarget = {};
          fireUiChanged(scene, id, 'uiCustom');
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
