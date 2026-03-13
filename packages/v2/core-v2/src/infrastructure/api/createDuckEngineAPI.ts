import type { EngineState } from '../../domain';
import { composeAPI } from '../../domain/api';
import {
  addEntityToScene,
  addSceneToEngine,
  addViewport,
  addUISlot,
  removeUISlot,
  updateUISlot,
  setActiveCamera,
  setEnginePaused,
  setupEngine,
  registerEngineSubsystem,
  removeEntityFromScene,
  removeSceneFromEngine,
  removeViewport,
  reparentEntityInScene,
  resizeViewport,
  setViewportCamera,
  setViewportCanvas,
  setViewportScene,
  setViewportEnabled,
  setupScene,
  teardownScene,
  toggleSceneDebug,
  updateEngine,
  updateScene,
  updateSettings,
  setScenePaused,
  subscribeToSceneChanges,
  getSettings,
  listScenes,
  listViewports,
  listEntities,
  addComponentToEntity,
  removeComponentFromEntity,
  getEntityView,
  setEntityDisplayName,
  setEntityGizmoIcon,
  setEntityDebugEnabled,
  listEntityChildren,
  setEnabled,
  setComponentField,
  getComponentSnapshot,
} from '../../application';

/**
 * Composes the full DuckEngine API from all registered use cases.
 *
 * This is infrastructure — the concrete wiring of every domain and
 * application use case into a single, typed API surface. The returned
 * type is inferred from the use cases, so consumers get full
 * autocompletion and type safety without maintaining a manual interface.
 *
 * Guards declared on individual use cases are executed automatically
 * by the composer.
 *
 * @example
 * ```ts
 * const api = createDuckEngineAPI(engine);
 *
 * // Engine level
 * api.addScene({ sceneId: 'main' });    // → Result<SceneState>
 * api.setPaused({ paused: true });
 * api.getSettings();                     // → Result<GameSettings>
 *
 * // Scene level
 * const scene = api.scene('main');
 * scene.addEntity({ entity });           // → Result<EntityView>
 *
 * // Entity level
 * const entity = api.scene('main').entity('player');
 * entity.addComponent({ component });    // → Result<void>
 * entity.view();                         // → Result<EntityView>
 *
 * // Component level
 * const rb = api.scene('main').entity('player').component('rigidBody');
 * rb.setEnabled({ enabled: false });
 *
 * // Viewport level
 * const vp = api.viewport('vp1');
 * vp.setEnabled({ enabled: true });
 * ```
 */
export function createDuckEngineAPI(engine: EngineState) {
  return composeAPI(engine)
    // ── engine ─────────────────────────────────────────────────
    .add('addScene', addSceneToEngine)
    .add('removeScene', removeSceneFromEngine)
    .add('addViewport', addViewport)
    .add('removeViewport', removeViewport)
    .add('setPaused', setEnginePaused)
    .add('setup', setupEngine)
    .add('registerSubsystem', registerEngineSubsystem)
    .add('update', updateEngine)
    .add('updateSettings', updateSettings)
    .add('getSettings', getSettings)
    .add('listScenes', listScenes)
    .add('listViewports', listViewports)
    // ── scene ──────────────────────────────────────────────────
    .add('addEntity', addEntityToScene)
    .add('removeEntity', removeEntityFromScene)
    .add('reparentEntity', reparentEntityInScene)
    .add('setActiveCamera', setActiveCamera)
    .add('toggleDebug', toggleSceneDebug)
    .add('setupScene', setupScene)
    .add('teardownScene', teardownScene)
    .add('updateScene', updateScene)
    .add('setPaused', setScenePaused)
    .add('subscribe', subscribeToSceneChanges)
    .add('listEntities', listEntities)
    .add('addUISlot', addUISlot)
    .add('removeUISlot', removeUISlot)
    .add('updateUISlot', updateUISlot)
    // ── entity ─────────────────────────────────────────────────
    .add('addComponent', addComponentToEntity)
    .add('removeComponent', removeComponentFromEntity)
    .add('view', getEntityView)
    .add('setDisplayName', setEntityDisplayName)
    .add('setGizmoIcon', setEntityGizmoIcon)
    .add('setDebug', setEntityDebugEnabled)
    .add('listChildren', listEntityChildren)
    // ── component ──────────────────────────────────────────────
    .add('setEnabled', setEnabled)
    .add('setField', setComponentField)
    .add('snapshot', getComponentSnapshot)
    // ── viewport ───────────────────────────────────────────────
    .add('setEnabled', setViewportEnabled)
    .add('setScene', setViewportScene)
    .add('setCamera', setViewportCamera)
    .add('setCanvas', setViewportCanvas)
    .add('resize', resizeViewport)
    .build();
}

/** The fully-typed DuckEngine API surface. */
export type DuckEngineAPI = ReturnType<typeof createDuckEngineAPI>;