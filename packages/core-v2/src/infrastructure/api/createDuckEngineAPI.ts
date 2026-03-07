import type {  EngineState  } from '../../domain/types/../engine';
import { composeAPI } from '../../domain/api/apiComposer';

// ── engine use cases ─────────────────────────────────────────────
import { addSceneToEngine } from '../../application/engine/addSceneToEngine';
import { removeSceneFromEngine } from '../../application/engine/removeSceneFromEngine';
import { addViewport } from '../../application/engine/addViewport';
import { removeViewport } from '../../application/engine/removeViewport';
import { pauseEngine } from '../../application/engine/pauseEngine';
import { resumeEngine } from '../../application/engine/resumeEngine';
import { registerEngineAdapter } from '../../application/engine/registerEngineAdapter';
import { updateEngine } from '../../application/engine/updateEngine';
import { updateSettings } from '../../application/engine/updateSettings';

// ── scene use cases ──────────────────────────────────────────────
import { addEntityToScene } from '../../application/scene/addEntityToScene';
import { removeEntityFromScene } from '../../application/scene/removeEntityFromScene';
import { reparentEntityInScene } from '../../application/scene/reparentEntityInScene';
import { setActiveCamera } from '../../application/scene/setActiveCamera';
import { clearActiveCamera } from '../../application/scene/clearActiveCamera';
import { toggleSceneDebug } from '../../application/scene/toggleSceneDebug';
import { setupScene } from '../../application/scene/setupScene';
import { teardownScene } from '../../application/scene/teardownScene';
import { updateScene } from '../../application/scene/updateScene';
import { pauseScene } from '../../application/scene/pauseScene';
import { resumeScene } from '../../application/scene/resumeScene';

// ── viewport use cases ───────────────────────────────────────────
import { enableViewport } from '../../application/viewport/enableViewport';
import { disableViewport } from '../../application/viewport/disableViewport';
import { setViewportScene } from '../../application/viewport/setViewportScene';
import { setViewportCamera } from '../../application/viewport/setViewportCamera';
import { setViewportCanvas } from '../../application/viewport/setViewportCanvas';
import { resizeViewport } from '../../application/viewport/resizeViewport';

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
  return composeAPI(engine)
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
    .build();
}

/** The fully-typed DuckEngine API surface. */
export type DuckEngineAPI = ReturnType<typeof createDuckEngineAPI>;
