import type { EngineState } from '../../domain';
import { composeAPI } from '../../domain/api';
// ── engine use cases ─────────────────────────────────────────────
import {
  addEntityToScene,
  addSceneToEngine,
  addViewport,
  clearActiveCamera,
  disableViewport,
  enableViewport,
  pauseEngine,
  pauseScene,
  registerEngineAdapter,
  removeEntityFromScene,
  removeSceneFromEngine,
  removeViewport,
  reparentEntityInScene,
  resizeViewport,
  resumeEngine,
  resumeScene,
  setActiveCamera,
  setViewportCamera,
  setViewportCanvas,
  setViewportScene,
  setupScene,
  teardownScene,
  toggleSceneDebug,
  updateEngine,
  updateScene,
  updateSettings,
} from '../../application';
// ── scene use cases ──────────────────────────────────────────────
// ── viewport use cases ───────────────────────────────────────────
/**
 * Composes the full DuckEngine API from all registered use cases.
 *
 * This is infrastructure — the concrete wiring of every domain and
 * application use case into a single, typed API surface. The returned
 * type is inferred from the use cases, so consumers get full
 * autocompletion and type safety without maintaining a manual interface.
 *
 * Guards declared on individual use cases (e.g. `guardSceneExists` on
 * `setViewportScene`) are executed automatically by the composer.
 */
export function createDuckEngineAPI(engine: EngineState) {
  return (
    composeAPI(engine)
      // ── engine ─────────────────────────────────────────────────
      .add('addScene', addSceneToEngine)
      .add('removeScene', removeSceneFromEngine)
      .add('addViewport', addViewport)
      .add('removeViewport', removeViewport)
      .add('pause', pauseEngine)
      .add('resume', resumeEngine)
      .add('registerAdapter', registerEngineAdapter)
      .add('update', updateEngine)
      .add('updateSettings', updateSettings)
      // ── scene ──────────────────────────────────────────────────
      .add('addEntity', addEntityToScene)
      .add('removeEntity', removeEntityFromScene)
      .add('reparentEntity', reparentEntityInScene)
      .add('setActiveCamera', setActiveCamera)
      .add('clearActiveCamera', clearActiveCamera)
      .add('toggleDebug', toggleSceneDebug)
      .add('setupScene', setupScene)
      .add('teardownScene', teardownScene)
      .add('updateScene', updateScene)
      .add('pauseScene', pauseScene)
      .add('resumeScene', resumeScene)
      // ── viewport ───────────────────────────────────────────────
      .add('enableViewport', enableViewport)
      .add('disableViewport', disableViewport)
      .add('setViewportScene', setViewportScene)
      .add('setViewportCamera', setViewportCamera)
      .add('setViewportCanvas', setViewportCanvas)
      .add('resizeViewport', resizeViewport)
      .build()
  );
}

/** The fully-typed DuckEngine API surface. */
export type DuckEngineAPI = ReturnType<typeof createDuckEngineAPI>;
