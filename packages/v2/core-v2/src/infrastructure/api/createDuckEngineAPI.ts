import type { EngineState } from '../../domain';
import { composeAPI } from '../../domain/api';
import {
  addEntityToScene,
  addPrefab,
  instantiatePrefab,
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
  setViewportDebugEnabled,
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

import type { DuckEngineAPI } from './createDuckEngineAPI.docs';

/**
 * Composes the full DuckEngine API from all registered use cases.
 * Types and TSDoc live in createDuckEngineAPI.docs.ts.
 */
export function buildDuckEngineAPI(engine: EngineState) {
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
    .add('addPrefab', addPrefab)
    .add('instantiatePrefab', instantiatePrefab)
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
    .add('setDebug', setViewportDebugEnabled)
    .add('setScene', setViewportScene)
    .add('setCamera', setViewportCamera)
    .add('setCanvas', setViewportCanvas)
    .add('resize', resizeViewport)
    .build();
}

export function createDuckEngineAPI(engine: EngineState): DuckEngineAPI {
  return buildDuckEngineAPI(engine) as DuckEngineAPI;
}