/**
 * Bootstraps the harness app: engine, scene, camera, viewport, canvas.
 */
import {
  createSceneId,
  createEntityId,
  createViewportId,
  createCanvasId,
  createEntity,
  createComponent,
  addComponent,
  setPosition,
  lookAt,
  FULL_RECT,
} from '@duckengine/core-v2';
import type { DuckEngineAPI, ViewportRectProviderPort } from '@duckengine/core-v2';
import type { LogStack } from '@duckengine/diagnostic-v2';
import { loadSceneFromYaml, parseAndValidateSceneYaml } from '@duckengine/scenes-yaml-v2';
import type { PerformanceReportStorage } from './performanceReportStorage';

export const DEFAULT_SCENE_ID = createSceneId('main');
export const DEFAULT_CAMERA_ID = createEntityId('harness-camera');
export const DEFAULT_VIEWPORT_ID = createViewportId('main');
export const DEFAULT_CANVAS_ID = createCanvasId('main');

export interface HarnessAppState {
  api: DuckEngineAPI;
  viewportRectProvider: ViewportRectProviderPort;
  canvas: HTMLCanvasElement;
  sceneId: typeof DEFAULT_SCENE_ID;
  cameraId: typeof DEFAULT_CAMERA_ID;
  viewportId: typeof DEFAULT_VIEWPORT_ID;
  canvasId: typeof DEFAULT_CANVAS_ID;
  logStack: LogStack;
  frozen: boolean;
  frameId: number | null;
  performanceReport?: PerformanceReportStorage;
}

function createDefaultCameraEntity() {
  const entity = createEntity(DEFAULT_CAMERA_ID, 'Harness Camera');
  addComponent(
    entity,
    createComponent('cameraPerspective', {
      fov: 60,
      near: 0.1,
      far: 1000,
      aspect: 16 / 9,
    }),
  );
  setPosition(entity.transform, 0, 6, 8);
  lookAt(entity.transform, { x: 0, y: 0, z: 0 });
  return entity;
}

/** Options for initHarnessScene. */
export interface InitHarnessSceneOptions {
  performanceReport?: PerformanceReportStorage;
}

/**
 * Initializes the harness: scene, camera, viewport, canvas registration.
 * Call after createHarnessEngine. Does not load any YAML.
 */
export function initHarnessScene(
  api: DuckEngineAPI,
  viewportRectProvider: ViewportRectProviderPort,
  canvas: HTMLCanvasElement,
  logStack: LogStack,
  options?: InitHarnessSceneOptions,
): HarnessAppState {
  api.addScene({ sceneId: DEFAULT_SCENE_ID });
  const sceneApi = api.scene(DEFAULT_SCENE_ID);

  const cameraEntity = createDefaultCameraEntity();
  sceneApi.addEntity({ entity: cameraEntity });
  sceneApi.setActiveCamera({ entityId: DEFAULT_CAMERA_ID });

  sceneApi.setupScene({});

  api.registerCanvas({
    canvasId: DEFAULT_CANVAS_ID,
    element: canvas as any,
  });

  const addResult = api.addViewport({
    id: DEFAULT_VIEWPORT_ID,
    sceneId: DEFAULT_SCENE_ID,
    cameraEntityId: DEFAULT_CAMERA_ID,
    canvasId: DEFAULT_CANVAS_ID,
    rect: FULL_RECT,
  });

  if (addResult.ok && addResult.value) {
    viewportRectProvider.setRect(DEFAULT_VIEWPORT_ID, FULL_RECT);
  }

  return {
    api,
    viewportRectProvider,
    canvas,
    sceneId: DEFAULT_SCENE_ID,
    cameraId: DEFAULT_CAMERA_ID,
    viewportId: DEFAULT_VIEWPORT_ID,
    canvasId: DEFAULT_CANVAS_ID,
    logStack,
    frozen: false,
    frameId: null,
    performanceReport: options?.performanceReport,
  };
}

function findFirstCameraEntityId(yamlStr: string): string | null {
  const parseResult = parseAndValidateSceneYaml(yamlStr);
  if (!parseResult.ok) return null;
  for (const entity of parseResult.value.entities) {
    if (entity.components?.cameraPerspective != null || entity.components?.cameraOrthographic != null) {
      return entity.id;
    }
  }
  return null;
}

/**
 * Loads YAML into the scene. Clears existing entities first, then adds from YAML.
 * If the scene defines a camera, sets it as the viewport camera.
 */
export function loadSceneYaml(
  state: HarnessAppState,
  yamlStr: string,
): { ok: boolean; error?: string } {
  const sceneApi = state.api.scene(state.sceneId);
  const listResult = sceneApi.listEntities();
  const roots = listResult.ok ? listResult.value : [];
  for (const e of roots) {
    sceneApi.removeEntity({ entityId: createEntityId(e.id) });
  }

  const result = loadSceneFromYaml(state.api, state.sceneId, yamlStr);
  if (!result.ok) {
    return { ok: false, error: result.error.message };
  }
  const cameraId = findFirstCameraEntityId(yamlStr);
  if (cameraId) {
    state.api.viewport(state.viewportId).setCamera({
      cameraEntityId: createEntityId(cameraId),
    });
  }
  return { ok: true };
}

/**
 * Starts the update loop. Respects frozen state.
 */
export function startUpdateLoop(state: HarnessAppState): void {
  if (state.frameId != null) return;

  const tick = () => {
    state.api.update({ dt: state.frozen ? 0 : 1 / 60 });
    state.frameId = requestAnimationFrame(tick);
  };
  state.frameId = requestAnimationFrame(tick);
}

/**
 * Stops the update loop.
 */
export function stopUpdateLoop(state: HarnessAppState): void {
  if (state.frameId != null) {
    cancelAnimationFrame(state.frameId);
    state.frameId = null;
  }
}
